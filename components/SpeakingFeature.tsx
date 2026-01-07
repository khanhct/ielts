'use client'

import { useState, useEffect } from 'react'
import styles from './SpeakingFeature.module.css'
import { saveHistory, getHistory, deleteHistoryItem, formatTimestamp, type HistoryItem } from '@/utils/history'

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
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

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
      
      // Save to history
      saveHistory('speaking', { question, part, bands: selectedBands }, data.results)
      setHistory(getHistory('speaking'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setHistory(getHistory('speaking'))
  }, [])

  const loadHistoryItem = (item: HistoryItem) => {
    const input = item.input
    setQuestion(input.question)
    setPart(input.part)
    setSelectedBands(input.bands)
    setResults(item.result)
    setShowHistory(false)
  }

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteHistoryItem('speaking', id)
    setHistory(getHistory('speaking'))
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
      <div className={styles.historyHeader}>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className={styles.historyButton}
        >
          {showHistory ? 'Hide' : 'Show'} History ({history.length})
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <div className={styles.historyContainer}>
          <h3 className={styles.historyTitle}>Previous Questions</h3>
          <div className={styles.historyList}>
            {history.map((item) => (
              <div
                key={item.id}
                className={styles.historyItem}
                onClick={() => loadHistoryItem(item)}
              >
                <div className={styles.historyItemHeader}>
                  <span className={styles.historyQuestion}>
                    {item.input.question.substring(0, 60)}
                    {item.input.question.length > 60 ? '...' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                    className={styles.deleteButton}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.historyMeta}>
                  Part {item.input.part} • Bands: {item.input.bands.join(', ')} • {formatTimestamp(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

