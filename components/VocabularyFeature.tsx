'use client'

import { useState, useEffect } from 'react'
import styles from './VocabularyFeature.module.css'
import { saveHistory, getHistory, deleteHistoryItem, formatTimestamp, type HistoryItem } from '@/utils/history'

interface VocabularyItem {
  english: string
  vietnamese: string
  example: string
}

interface StructureItem {
  english: string
  vietnamese: string
  example: string
}

interface VocabularyResponse {
  vocabulary: VocabularyItem[]
  structures: StructureItem[]
}

export default function VocabularyFeature() {
  const [topic, setTopic] = useState('')
  const [taskType, setTaskType] = useState<'speaking' | 'writing'>('speaking')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VocabularyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          taskType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate vocabulary')
      }

      const data: VocabularyResponse = await response.json()
      setResult(data)
      
      // Save to history
      saveHistory('vocabulary', { topic, taskType }, data)
      setHistory(getHistory('vocabulary'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setHistory(getHistory('vocabulary'))
  }, [])

  const loadHistoryItem = (item: HistoryItem) => {
    const input = item.input
    setTopic(input.topic)
    setTaskType(input.taskType)
    setResult(item.result)
    setShowHistory(false)
  }

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteHistoryItem('vocabulary', id)
    setHistory(getHistory('vocabulary'))
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
          <h3 className={styles.historyTitle}>Previous Topics</h3>
          <div className={styles.historyList}>
            {history.map((item) => (
              <div
                key={item.id}
                className={styles.historyItem}
                onClick={() => loadHistoryItem(item)}
              >
                <div className={styles.historyItemHeader}>
                  <span className={styles.historyQuestion}>
                    {item.input.topic} ({item.input.taskType})
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
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="topic">Topic</label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Environment, Technology, Education, Health..."
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="taskType">Task Type</label>
          <select
            id="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as 'speaking' | 'writing')}
            className={styles.select}
          >
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Generating Vocabulary & Structures...' : 'Generate Learning Materials'}
        </button>
      </form>

      {result && (
        <div className={styles.result}>
          <div className={styles.header}>
            <h2 className={styles.resultTitle}>
              Phrases & Idioms for: <span className={styles.topicName}>{topic}</span>
            </h2>
            <p className={styles.taskType}>
              Task Type: {taskType === 'speaking' ? 'Speaking' : 'Writing'} 
              ({taskType === 'speaking' ? 'Conversational phrases and idioms' : 'Academic phrases and idioms'})
            </p>
          </div>

          <div className={styles.content}>
            <div className={styles.vocabSection}>
              <h3 className={styles.sectionTitle}>
                📚 Phrases & Idioms - Set 1 ({result.vocabulary.length} items)
              </h3>
              <div className={styles.itemsList}>
                {result.vocabulary.map((item, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemNumber}>{idx + 1}</span>
                      <span className={styles.itemEnglish}>{item.english}</span>
                    </div>
                    <div className={styles.itemVietnamese}>
                      <strong>Vietnamese:</strong> {item.vietnamese}
                    </div>
                    <div className={styles.itemExample}>
                      <strong>Example:</strong> <em>"{item.example}"</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.structureSection}>
              <h3 className={styles.sectionTitle}>
                📚 Phrases & Idioms - Set 2 ({result.structures.length} items)
              </h3>
              <div className={styles.itemsList}>
                {result.structures.map((item, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemNumber}>{idx + 1}</span>
                      <span className={styles.itemEnglish}>{item.english}</span>
                    </div>
                    <div className={styles.itemVietnamese}>
                      <strong>Vietnamese:</strong> {item.vietnamese}
                    </div>
                    <div className={styles.itemExample}>
                      <strong>Example:</strong> <em>"{item.example}"</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

