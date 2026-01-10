'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './VocabularyLearn.module.css';

interface VerbPhrase {
  phrase: string;
  meaning: string;
}

interface RelatedVerb {
  verb: string;
  pronunciation: string;
  meaning: string;
}

interface VocabularyLearnItem {
  word: string;
  word_type: string;
  pronunciation: string;
  meaning: string;
  related_verb?: RelatedVerb;
  verb_phrases: VerbPhrase[];
  synonyms: string[];
}

interface VocalSession {
  id: number;
  input_words: string;
  results_json: string;
  created_at: string;
}

export default function VocabularyLearn() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VocabularyLearnItem[]>([]);
  const [history, setHistory] = useState<VocalSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/vocabulary-learn');
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/vocabulary-learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: inputText }),
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data);
        setInputText('');
        fetchHistory();
      } else {
        alert(data.error || 'Failed to generate vocabulary');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      const response = await fetch('/api/vocabulary-learn', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        fetchHistory();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.inputSection}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Learn New Vocabulary</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter words separated by commas (e.g., contribution, resilient, meticulous)"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 className="animate-spin" size={20} /> Generating...
              </span>
            ) : 'Learn Now'}
          </button>
        </form>
      </section>

      {results.length > 0 && (
        <section className={styles.resultsSection}>
          <h2 style={{ fontWeight: 600 }}>Vocabulary Results</h2>
          {results.map((item, idx) => (
            <VocabularyCard key={idx} item={item} />
          ))}
        </section>
      )}

      <section>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#4b5563', marginTop: '1rem' }}
        >
          {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          History ({history.length} turns)
        </button>

        {showHistory && (
          <div className={styles.historyList}>
            {history.map((session) => (
              <div key={session.id} className={styles.historyItem}>
                <div style={{ flex: 1 }}>
                  <span className={styles.historyWord}>{session.input_words}</span>
                  <span className={styles.historyDate} style={{ marginLeft: '1rem' }}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      try {
                        const results = JSON.parse(session.results_json);
                        setResults(results);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      } catch (e) {
                        console.error('Parse error', e);
                      }
                    }}
                    className={styles.deleteBtn}
                    style={{ color: '#3b82f6' }}
                    title="View details"
                  >
                    <BookOpen size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(session.id)} 
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VocabularyCard({ item }: { item: VocabularyLearnItem }) {
  return (
    <div className={styles.card}>
      <div className={styles.wordHeader}>
        {item.word} 
        <span className={styles.wordType}>({item.word_type})</span>: 
        <span className={styles.pronunciation}>{item.pronunciation}</span>
      </div>
      <div className={styles.meaning}>{item.meaning}</div>

      {item.related_verb && item.related_verb.verb && (
        <div className={styles.subSection}>
          <span className={styles.subTitle}>
            Verb: <span style={{ color: '#2563eb' }}>{item.related_verb.verb}</span>(v):
            <span className={styles.pronunciation} style={{ marginLeft: 0 }}>{item.related_verb.pronunciation}</span> 
            {item.related_verb.meaning}
          </span>
        </div>
      )}

      {item.verb_phrases && item.verb_phrases.length > 0 && (
        <div className={styles.subSection}>
          <span className={styles.subTitle}>Verb Phrases:</span>
          {item.verb_phrases.map((p, i) => (
            <div key={i} className={styles.verbPhrase}>
              <span className={styles.phraseText}>- {p.phrase}:</span>
              <span>{p.meaning}</span>
            </div>
          ))}
        </div>
      )}

      {item.synonyms && item.synonyms.length > 0 && (
        <div className={styles.subSection}>
          <span className={styles.subTitle}>Synonyms:</span>
          <div className={styles.synonyms}>
            {item.synonyms.map((s, i) => (
              <span key={i} className={styles.synonymTag}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
