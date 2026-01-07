'use client'

import { useState } from 'react'
import SpeakingFeature from '@/components/SpeakingFeature'
import WritingFeature from '@/components/WritingFeature'
import WritingFixFeature from '@/components/WritingFixFeature'
import styles from './page.module.css'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'speaking' | 'writing' | 'writing-fix'>('speaking')

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
        <button
          className={`${styles.tab} ${activeTab === 'writing-fix' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('writing-fix')}
        >
          Writing Fix
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'speaking' && <SpeakingFeature />}
        {activeTab === 'writing' && <WritingFeature />}
        {activeTab === 'writing-fix' && <WritingFixFeature />}
      </div>
    </main>
  )
}

