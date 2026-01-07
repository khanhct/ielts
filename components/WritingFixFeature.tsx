'use client'

import { useState, useRef } from 'react'
import styles from './WritingFixFeature.module.css'

interface ErrorItem {
  location: string
  originalText: string
  errorType: 'grammar' | 'typo' | 'spelling' | string
  explanation: string
  correctedText: string
}

interface FixResponse {
  score: number
  scoreExplanation: string
  errors: ErrorItem[]
  correctedAnswer: string
}

export default function WritingFixFeature() {
  const [question, setQuestion] = useState('')
  const [questionImage, setQuestionImage] = useState<string | null>(null)
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FixResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const questionFileInputRef = useRef<HTMLInputElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setQuestionImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        const base64Data = base64.split(',')[1]
        setQuestionImage(base64Data)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleQuestionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB')
            return
          }
          if (!file.type.startsWith('image/')) {
            setError('Please paste an image file')
            return
          }
          setError(null)
          setQuestionImageFile(file)
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            const base64Data = base64.split(',')[1]
            setQuestionImage(base64Data)
          }
          reader.readAsDataURL(file)
        }
        return
      }
    }
  }

  const removeQuestionImage = () => {
    setQuestionImage(null)
    setQuestionImageFile(null)
    if (questionFileInputRef.current) {
      questionFileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim() && !questionImage) {
      setError('Please enter a question or upload an image')
      return
    }

    if (!answer.trim()) {
      setError('Please enter your answer')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/writing-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question || 'Analyze this image and provide feedback on the answer',
          questionImageBase64: questionImage || undefined,
          answer,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze answer')
      }

      const data: FixResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'grammar':
        return styles.errorGrammar
      case 'typo':
        return styles.errorTypo
      case 'spelling':
        return styles.errorSpelling
      default:
        return styles.errorOther
    }
  }

  const getErrorTypeLabel = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'grammar':
        return 'Grammar'
      case 'typo':
        return 'Typo'
      case 'spelling':
        return 'Spelling'
      default:
        return 'Error'
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="question">Question (Text or Image)</label>
          <textarea
            ref={questionTextareaRef}
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onPaste={handleQuestionPaste}
            placeholder="Enter the IELTS writing question or paste an image here..."
            rows={4}
            className={styles.textarea}
          />
          <div className={styles.imageUploadSection}>
            <input
              ref={questionFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleQuestionImageUpload}
              className={styles.fileInput}
              id="questionImageUpload"
            />
            <label htmlFor="questionImageUpload" className={styles.uploadButton}>
              📷 Upload Image
            </label>
            {questionImage && (
              <div className={styles.imagePreview}>
                <img src={`data:image/jpeg;base64,${questionImage}`} alt="Question Preview" />
                <button
                  type="button"
                  onClick={removeQuestionImage}
                  className={styles.removeImageButton}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
          <p className={styles.helpText}>
            💡 Tip: You can paste images directly into the question box or use the upload button
          </p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="answer">Your Answer</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste your answer here for analysis..."
            rows={10}
            className={styles.textarea}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? 'Analyzing Your Answer...' : 'Analyze & Fix'}
        </button>
      </form>

      {result && (
        <div className={styles.result}>
          <div className={styles.scoreSection}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreValue}>{result.score}</span>
              <span className={styles.scoreLabel}>Band Score</span>
            </div>
            <div className={styles.scoreExplanation}>
              <h3>Score Explanation</h3>
              <p>{result.scoreExplanation}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className={styles.errorsSection}>
              <h2 className={styles.sectionTitle}>
                Errors Found ({result.errors.length})
              </h2>
              <div className={styles.errorsList}>
                {result.errors.map((err, idx) => (
                  <div key={idx} className={styles.errorItem}>
                    <div className={styles.errorHeader}>
                      <span className={`${styles.errorTypeBadge} ${getErrorTypeColor(err.errorType)}`}>
                        {getErrorTypeLabel(err.errorType)}
                      </span>
                      <span className={styles.errorLocation}>{err.location}</span>
                    </div>
                    <div className={styles.errorContent}>
                      <div className={styles.errorOriginal}>
                        <strong>Original:</strong>
                        <span className={styles.errorText}>"{err.originalText}"</span>
                      </div>
                      <div className={styles.errorCorrected}>
                        <strong>Corrected:</strong>
                        <span className={styles.correctedText}>"{err.correctedText}"</span>
                      </div>
                      <div className={styles.errorExplanation}>
                        <strong>Explanation:</strong>
                        <p>{err.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.correctedSection}>
            <h2 className={styles.sectionTitle}>Corrected Answer</h2>
            <div className={styles.correctedAnswer}>
              {result.correctedAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

