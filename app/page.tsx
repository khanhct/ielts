'use client'

import { useState } from 'react'
import SpeakingFeature from '@/components/SpeakingFeature'
import WritingFeature from '@/components/WritingFeature'
import styles from './page.module.css'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'speaking' | 'writing'>('speaking')

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>
        IELTS Assistant
      </h1>
      
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
      </div>

      <div className={styles.content}>
        {activeTab === 'speaking' ? <SpeakingFeature /> : <WritingFeature />}
      </div>
    </main>
  )
}

