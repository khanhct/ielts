'use client'

import { useState } from 'react'
import styles from './SpeakingFeature.module.css'

interface AnswerResponse {
  band: string
  answer: string
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
  results: AnswerResponse[]
}

export default function SpeakingFeature() {
  const [question, setQuestion] = useState('')
  const [part, setPart] = useState('1')
  const [selectedBands, setSelectedBands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnswerResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  const bandOptions = ['7', '8', '9']

  const handleBandToggle = (band: string) => {
    setSelectedBands(prev =>
      prev.includes(band)
        ? prev.filter(b => b !== band)
        : [...prev, band]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) {
      setError('Please enter a question')
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
      const response = await fetch('/api/speaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          part,
          bands: selectedBands,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate answer')
      }

      const data: ApiResponse = await response.json()
      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const highlightText = (text: string, vocab: AnswerResponse['vocabulary'], structures: AnswerResponse['structures']) => {
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
          <label htmlFor="question">Question</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your IELTS speaking question..."
            rows={4}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="part">Part</label>
          <select
            id="part"
            value={part}
            onChange={(e) => setPart(e.target.value)}
            className={styles.select}
          >
            <option value="1">Part 1</option>
            <option value="2">Part 2</option>
            <option value="3">Part 3</option>
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
            ? `Generating Answers for ${selectedBands.length} Band${selectedBands.length > 1 ? 's' : ''}...`
            : 'Generate Answer'}
        </button>
      </form>

      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          {results.map((result) => (
            <div key={result.band} className={styles.result}>
              <h2 className={styles.resultTitle}>Band {result.band} Answer</h2>
              <div
                className={styles.answer}
                dangerouslySetInnerHTML={{
                  __html: highlightText(result.answer, result.vocabulary, result.structures),
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

