'use client'

import { useState, useEffect } from 'react'
import SpeakingFeature from '@/components/SpeakingFeature'
import WritingFeature from '@/components/WritingFeature'
import WritingFixFeature from '@/components/WritingFixFeature'
import VocabularyFeature from '@/components/VocabularyFeature'
import Login from '@/components/Login'
import styles from './page.module.css'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'speaking' | 'writing' | 'writing-fix' | 'vocabulary'>('speaking')
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication on mount
    const authStatus = localStorage.getItem('isAuthenticated')
    const storedUsername = localStorage.getItem('username')
    
    if (authStatus === 'true' && storedUsername) {
      setIsAuthenticated(true)
      setUsername(storedUsername)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    const storedUsername = localStorage.getItem('username')
    setUsername(storedUsername)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
    setUsername(null)
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          IELTS Assistant
        </h1>
        <div className={styles.userSection}>
          <span className={styles.username}>Welcome, {username}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
      
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'speaking' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('speaking')}
        >
          Speaking
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'writing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('writing')}
        >
          Writing
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'writing-fix' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('writing-fix')}
        >
          Writing Fix
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'vocabulary' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          Vocabulary
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'speaking' && <SpeakingFeature />}
        {activeTab === 'writing' && <WritingFeature />}
        {activeTab === 'writing-fix' && <WritingFixFeature />}
        {activeTab === 'vocabulary' && <VocabularyFeature />}
      </div>
    </main>
  )
}

