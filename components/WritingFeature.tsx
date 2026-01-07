'use client'

import { useState, useRef } from 'react'
import styles from './WritingFeature.module.css'

interface WritingResponse {
  band: string
  response: string
  vocabulary: Array<{
    english: string
    vietnamese: string
  }>
  structures: Array<{
    english: string
    vietnamese: string
  }>
}

interface ApiResponse {
  results: WritingResponse[]
}

export default function WritingFeature() {
  const [input, setInput] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [taskType, setTaskType] = useState('1')
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<WritingResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const bandOptions = ['7', '8', '9']

  const handleBandToggle = (band: string) => {
    setSelectedBands(prev =>
      prev.includes(band)
        ? prev.filter(b => b !== band)
        : [...prev, band]
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        // Remove data URL prefix
        const base64Data = base64.split(',')[1]
        setImage(base64Data)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          // Validate file size
          if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB')
            return
          }
          // Validate file type
          if (!file.type.startsWith('image/')) {
            setError('Please paste an image file')
            return
          }
          setError(null) // Clear any previous errors
          setImageFile(file)
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            const base64Data = base64.split(',')[1]
            setImage(base64Data)
          }
          reader.readAsDataURL(file)
        }
        return
      }
    }
  }

  const removeImage = () => {
    setImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() && !image) {
      setError('Please enter text or upload an image')
      return
    }

    if (selectedBands.length === 0) {
      setError('Please select at least one band score')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input || 'Analyze this image and provide a writing response',
          imageBase64: image || undefined,
          taskType,
          bands: selectedBands,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate response')
      }

      const data: ApiResponse = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const highlightText = (text: string, vocab: WritingResponse['vocabulary'], structures: WritingResponse['structures']) => {
    const allItems = [
      ...vocab.map(v => ({ ...v, type: 'vocab' as const })),
      ...structures.map(s => ({ ...s, type: 'structure' as const })),
    ]

    // Sort by length (longest first) to avoid partial matches
    allItems.sort((a, b) => b.english.length - a.english.length)

    let highlightedText = text
    const replacements: Array<{ start: number; end: number; item: typeof allItems[0] }> = []

    allItems.forEach(item => {
      // Escape special regex characters
      const escaped = item.english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Use word boundaries for single words, or direct match for phrases
      const isPhrase = item.english.includes(' ')
      const pattern = isPhrase ? escaped : `\\b${escaped}\\b`
      const regex = new RegExp(pattern, 'gi')
      
      let match
      // Reset regex lastIndex to avoid issues with global regex
      regex.lastIndex = 0
      while ((match = regex.exec(text)) !== null) {
        // Check if this position is already in replacements (avoid overlaps)
        const overlaps = replacements.some(
          r => (match.index! >= r.start && match.index! < r.end) ||
               (match.index! + match[0].length > r.start && match.index! + match[0].length <= r.end) ||
               (match.index! <= r.start && match.index! + match[0].length >= r.end)
        )
        if (!overlaps) {
          replacements.push({
            start: match.index!,
            end: match.index! + match[0].length,
            item,
          })
        }
      }
    })

    // Sort replacements by position (reverse order for safe replacement)
    replacements.sort((a, b) => b.start - a.start)

    replacements.forEach(({ start, end, item }) => {
      const className = item.type === 'vocab' ? styles.vocabHighlight : styles.structureHighlight
      const before = highlightedText.substring(0, start)
      const match = highlightedText.substring(start, end)
      const after = highlightedText.substring(end)
      highlightedText = `${before}<mark class="${className}" data-english="${item.english}" data-vietnamese="${item.vietnamese}" data-type="${item.type}">${match}</mark>${after}`
    })

    return highlightedText
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="input">Question / Prompt (Text or Image)</label>
          <textarea
            ref={textareaRef}
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Enter your IELTS writing question or paste an image here..."
            rows={6}
            className={styles.textarea}
          />
          <div className={styles.imageUploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className={styles.uploadButton}>
              📷 Upload Image
            </label>
            {image && (
              <div className={styles.imagePreview}>
                <img src={`data:image/jpeg;base64,${image}`} alt="Preview" />
                <button
                  type="button"
                  onClick={removeImage}
                  className={styles.removeImageButton}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
          <p className={styles.helpText}>
            💡 Tip: You can paste images directly into the text box or use the upload button
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="taskType">Task Type</label>
          <select
            id="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className={styles.select}
          >
            <option value="1">Task 1 (Graph/Chart/Letter)</option>
            <option value="2">Task 2 (Essay)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Band Selections (Multiple choices)</label>
          <div className={styles.bandSelection}>
            {bandOptions.map(band => (
              <button
                key={band}
                type="button"
                onClick={() => handleBandToggle(band)}
                className={`${styles.bandButton} ${selectedBands.includes(band) ? styles.bandButtonActive : ''}`}
              >
                Band {band}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading
            ? `Generating Responses for ${selectedBands.length} Band${selectedBands.length > 1 ? 's' : ''}...`
            : 'Generate Response'}
        </button>
      </form>

      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          {results.map((result) => (
            <div key={result.band} className={styles.result}>
              <h2 className={styles.resultTitle}>Band {result.band} Response</h2>
              <div
                className={styles.response}
                dangerouslySetInnerHTML={{
                  __html: highlightText(result.response, result.vocabulary, result.structures),
                }}
              />

              <div className={styles.highlights}>
                <div className={styles.vocabSection}>
                  <h3 className={styles.highlightTitle}>Vocabulary</h3>
                  <ul className={styles.highlightList}>
                    {result.vocabulary.map((item, idx) => (
                      <li key={idx} className={styles.highlightItem}>
                        <strong>{item.english}</strong>: {item.vietnamese}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.structureSection}>
                  <h3 className={styles.highlightTitle}>Structures</h3>
                  <ul className={styles.highlightList}>
                    {result.structures.map((item, idx) => (
                      <li key={idx} className={styles.highlightItem}>
                        <strong>{item.english}</strong>: {item.vietnamese}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

