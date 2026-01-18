'use client';

import { useState, useEffect } from 'react';
import { Loader2, Volume2, BookOpen, MessageSquare, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './SpeakingPractice.module.css';

interface VocabularyItem {
  english: string;
  vietnamese: string;
  explanation?: string;
}

interface IdiomItem {
  english: string;
  vietnamese: string;
  usage: string;
}

interface GrammarItem {
  structure: string;
  explanation: string;
  examples: string[];
}

interface SentencePattern {
  pattern: string;
  explanation: string;
  examples: string[];
}

interface PracticeResponse {
  speech: string;
  vocabulary: VocabularyItem[];
  idioms: IdiomItem[];
  grammar: GrammarItem[];
  sentencePatterns: SentencePattern[];
}

interface PracticeSession {
  id: number;
  conversation_name: string;
  topic: string;
  results_json: string;
  created_at: string;
}

const WORK_TOPICS = [
  { id: 'customer-meeting', label: 'Customer Meeting', description: 'Presenting solutions, discussing requirements' },
  { id: 'team-discussion', label: 'Team Discussion', description: 'Collaborating with colleagues, brainstorming' },
  { id: 'project-update', label: 'Project Update', description: 'Reporting progress, discussing timelines' },
  { id: 'technical-explanation', label: 'Technical Explanation', description: 'Explaining technical concepts clearly' },
  { id: 'problem-solving', label: 'Problem Solving', description: 'Discussing issues and solutions' },
  { id: 'code-review', label: 'Code Review', description: 'Reviewing code with team members' },
  { id: 'standup-meeting', label: 'Standup Meeting', description: 'Daily standup communication' },
  { id: 'client-presentation', label: 'Client Presentation', description: 'Presenting to clients professionally' },
  { id: 'negotiation', label: 'Negotiation', description: 'Negotiating deadlines, resources, features' },
  { id: 'feedback-session', label: 'Feedback Session', description: 'Giving and receiving feedback' },
  { id: 'introducing-yourself', label: 'Introducing Yourself', description: 'First impressions, networking, meeting new people' },
  { id: 'asking-questions', label: 'Asking Questions', description: 'Clarifying doubts, seeking information politely' },
  { id: 'agreeing-disagreeing', label: 'Agreeing & Disagreeing', description: 'Expressing opinions diplomatically' },
  { id: 'making-suggestions', label: 'Making Suggestions', description: 'Proposing ideas and recommendations' },
  { id: 'apologizing', label: 'Apologizing', description: 'Handling mistakes and misunderstandings professionally' },
  { id: 'asking-for-help', label: 'Asking for Help', description: 'Requesting assistance from colleagues' },
  { id: 'explaining-delays', label: 'Explaining Delays', description: 'Communicating setbacks and timeline issues' },
  { id: 'celebrating-success', label: 'Celebrating Success', description: 'Acknowledging achievements and milestones' },
  { id: 'handling-criticism', label: 'Handling Criticism', description: 'Responding to negative feedback constructively' },
  { id: 'small-talk', label: 'Small Talk', description: 'Casual conversation, building rapport' },
  { id: 'email-follow-up', label: 'Email Follow-up', description: 'Following up on previous communications' },
  { id: 'setting-expectations', label: 'Setting Expectations', description: 'Clarifying requirements and deliverables' },
];

const DAILY_LIFE_TOPICS = [
  { id: 'ordering-food', label: 'Ordering Food', description: 'Restaurant conversations, takeout, food preferences' },
  { id: 'shopping', label: 'Shopping', description: 'Buying clothes, groceries, asking for help in stores' },
  { id: 'directions', label: 'Asking for Directions', description: 'Getting around, finding places, using transportation' },
  { id: 'weather', label: 'Talking about Weather', description: 'Weather conversations, seasonal topics' },
  { id: 'hobbies', label: 'Discussing Hobbies', description: 'Talking about interests, free time activities' },
  { id: 'weekend-plans', label: 'Weekend Plans', description: 'Making plans, discussing activities' },
  { id: 'movies-tv', label: 'Movies & TV Shows', description: 'Discussing entertainment, recommendations' },
  { id: 'sports', label: 'Sports', description: 'Talking about games, teams, fitness' },
  { id: 'travel', label: 'Travel', description: 'Vacation plans, travel experiences, destinations' },
  { id: 'health', label: 'Health & Wellness', description: 'Doctor visits, fitness, healthy lifestyle' },
  { id: 'family', label: 'Family', description: 'Talking about family members, relationships' },
  { id: 'friends', label: 'Friends & Socializing', description: 'Making plans with friends, social events' },
  { id: 'complaining', label: 'Complaining Politely', description: 'Expressing dissatisfaction, service issues' },
  { id: 'compliments', label: 'Giving Compliments', description: 'Praising others, expressing appreciation' },
  { id: 'invitations', label: 'Invitations', description: 'Inviting people, accepting or declining politely' },
  { id: 'phone-calls', label: 'Phone Calls', description: 'Making and receiving calls, leaving messages' },
  { id: 'making-appointments', label: 'Making Appointments', description: 'Scheduling meetings, doctor visits, reservations' },
  { id: 'complaining-service', label: 'Service Issues', description: 'Dealing with problems at restaurants, stores, services' },
  { id: 'gossip', label: 'Casual Gossip', description: 'Talking about people, news, rumors (light conversation)' },
  { id: 'complaining-weather', label: 'Complaining about Weather', description: 'Common weather complaints and small talk' },
];

type SpeechFormat = 'speech' | 'conversation';

export default function SpeakingPractice() {
  const [speechFormat, setSpeechFormat] = useState<SpeechFormat>('speech');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState('');
  const [conversationName, setConversationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingName, setGeneratingName] = useState(false);
  const [result, setResult] = useState<PracticeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'vocab' | 'idioms' | 'grammar' | 'patterns'>('vocab');
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/speaking-practice');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const generateConversationName = async (topic: string) => {
    if (!topic) return;
    
    setGeneratingName(true);
    try {
      const response = await fetch('/api/speaking-practice/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          setConversationName(data.name);
        }
      }
    } catch (error) {
      console.error('Failed to generate name:', error);
    } finally {
      setGeneratingName(false);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setCustomTopic('');
    const topic = [...WORK_TOPICS, ...DAILY_LIFE_TOPICS].find(t => t.id === topicId);
    if (topic && !conversationName.trim()) {
      generateConversationName(topic.label);
    }
  };

  const handleCustomTopicChange = (value: string) => {
    setCustomTopic(value);
    if (value.trim()) {
      setSelectedTopic('');
      if (!conversationName.trim()) {
        generateConversationName(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topicLabel = customTopic.trim() || (selectedTopic ? [...WORK_TOPICS, ...DAILY_LIFE_TOPICS].find(t => t.id === selectedTopic)?.label : '');
    if (!topicLabel) {
      setError('Please select or enter a topic');
      return;
    }

    // Auto-generate name if not provided
    let finalName = conversationName.trim();
    if (!finalName) {
      setGeneratingName(true);
      try {
        const nameResponse = await fetch('/api/speaking-practice/generate-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topicLabel }),
        });
        if (nameResponse.ok) {
          const nameData = await nameResponse.json();
          finalName = nameData.name || topicLabel;
        } else {
          finalName = topicLabel;
        }
      } catch (error) {
        finalName = topicLabel;
      } finally {
        setGeneratingName(false);
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/speaking-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topicLabel, 
          conversationName: finalName,
          format: speechFormat 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate practice content');
      }

      const data: PracticeResponse = await response.json();
      setResult(data);
      setConversationName(finalName); // Update with generated name
      fetchHistory(); // Refresh history after saving
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = (session: PracticeSession) => {
    try {
      const practiceData = JSON.parse(session.results_json);
      setResult(practiceData);
      setConversationName(session.conversation_name);
      setCustomTopic(session.topic);
      setSelectedTopic('');
      setShowHistory(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to load session:', error);
      setError('Failed to load conversation');
    }
  };

  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      const response = await fetch('/api/speaking-practice', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        fetchHistory();
        if (result) {
          // Clear result if deleted session was currently displayed
          const sessionData = history.find(s => s.id === id);
          if (sessionData && JSON.stringify(result) === sessionData.results_json) {
            setResult(null);
          }
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const highlightText = (text: string, items: Array<{ english: string }>) => {
    let highlightedText = text;
    const replacements: Array<{ start: number; end: number; item: { english: string } }> = [];

    items.forEach(item => {
      const escaped = item.english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isPhrase = item.english.includes(' ');
      const pattern = isPhrase ? escaped : `\\b${escaped}\\b`;
      const regex = new RegExp(pattern, 'gi');
      
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        const overlaps = replacements.some(
          r => (match.index! >= r.start && match.index! < r.end) ||
               (match.index! + match[0].length > r.start && match.index! + match[0].length <= r.end) ||
               (match.index! <= r.start && match.index! + match[0].length >= r.end)
        );
        if (!overlaps) {
          replacements.push({
            start: match.index!,
            end: match.index! + match[0].length,
            item,
          });
        }
      }
    });

    replacements.sort((a, b) => b.start - a.start);
    replacements.forEach(({ start, end, item }) => {
      const before = highlightedText.substring(0, start);
      const match = highlightedText.substring(start, end);
      const after = highlightedText.substring(end);
      highlightedText = `${before}<mark class="${styles.highlight}">${match}</mark>${after}`;
    });

    return highlightedText;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <MessageSquare size={32} className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>Speaking Practice</h2>
            <p className={styles.subtitle}>
              Practice natural English conversations for work and daily life scenarios
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className={styles.historyButton}
        >
          {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <History size={20} style={{ marginLeft: '8px' }} />
          History ({history.length})
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <div className={styles.historyContainer}>
          <h3 className={styles.historyTitle}>Saved Conversations</h3>
          <div className={styles.historyList}>
            {history.map((session) => (
              <div
                key={session.id}
                className={styles.historyItem}
                onClick={() => handleLoadSession(session)}
              >
                <div className={styles.historyItemHeader}>
                  <div>
                    <span className={styles.historyName}>{session.conversation_name}</span>
                    <span className={styles.historyTopic}>{session.topic}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className={styles.deleteButton}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className={styles.historyMeta}>
                  {new Date(session.created_at).toLocaleDateString()} at{' '}
                  {new Date(session.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Format</label>
          <div className={styles.formatSelector}>
            <button
              type="button"
              className={`${styles.formatButton} ${speechFormat === 'speech' ? styles.formatButtonActive : ''}`}
              onClick={() => setSpeechFormat('speech')}
            >
              <span className={styles.formatIcon}>🎤</span>
              <span className={styles.formatLabel}>Single Speech</span>
              <span className={styles.formatDescription}>One-person monologue</span>
            </button>
            <button
              type="button"
              className={`${styles.formatButton} ${speechFormat === 'conversation' ? styles.formatButtonActive : ''}`}
              onClick={() => setSpeechFormat('conversation')}
            >
              <span className={styles.formatIcon}>💬</span>
              <span className={styles.formatLabel}>Two-Person Conversation</span>
              <span className={styles.formatDescription}>Dialogue between two people</span>
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Select a Topic</label>
          
          <div className={styles.topicSection}>
            <h3 className={styles.topicSectionTitle}>Work & Professional</h3>
            <div className={styles.topicGrid}>
              {WORK_TOPICS.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  className={`${styles.topicCard} ${selectedTopic === topic.id ? styles.topicCardActive : ''}`}
                  onClick={() => handleTopicChange(topic.id)}
                >
                  <div className={styles.topicLabel}>{topic.label}</div>
                  <div className={styles.topicDescription}>{topic.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.separator}>
            <div className={styles.separatorLine}></div>
            <span className={styles.separatorText}>Daily Life</span>
            <div className={styles.separatorLine}></div>
          </div>

          <div className={styles.topicSection}>
            <h3 className={styles.topicSectionTitle}>Daily Life & Social</h3>
            <div className={styles.topicGrid}>
              {DAILY_LIFE_TOPICS.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  className={`${styles.topicCard} ${selectedTopic === topic.id ? styles.topicCardActive : ''}`}
                  onClick={() => handleTopicChange(topic.id)}
                >
                  <div className={styles.topicLabel}>{topic.label}</div>
                  <div className={styles.topicDescription}>{topic.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Or Enter Custom Topic</label>
          <input
            type="text"
            className={styles.input}
            value={customTopic}
            onChange={(e) => handleCustomTopicChange(e.target.value)}
            placeholder="e.g., Explaining API architecture to non-technical stakeholders"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Conversation Name
            {generatingName && <span className={styles.generatingLabel}> (Generating...)</span>}
          </label>
          <input
            type="text"
            className={styles.input}
            value={conversationName}
            onChange={(e) => setConversationName(e.target.value)}
            placeholder="e.g., Q1 Customer Meeting, Sprint Planning Discussion (auto-generated if empty)"
            disabled={generatingName}
          />
          {conversationName && (
            <button
              type="button"
              onClick={() => {
                const topic = customTopic.trim() || (selectedTopic ? [...WORK_TOPICS, ...DAILY_LIFE_TOPICS].find(t => t.id === selectedTopic)?.label : '');
                if (topic) generateConversationName(topic);
              }}
              className={styles.regenerateButton}
              disabled={generatingName}
            >
              Regenerate Name
            </button>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading || (!selectedTopic && !customTopic.trim())}
          className={styles.submitButton}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} style={{ marginRight: '8px' }} />
              Generating Practice Content...
            </>
          ) : (
            <>
              <BookOpen size={20} style={{ marginRight: '8px' }} />
              Generate Practice
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={styles.resultsContainer}>
          <div className={styles.speechSection}>
            <div className={styles.sectionHeader}>
              <Volume2 size={24} />
              <h3 className={styles.sectionTitle}>
                {speechFormat === 'conversation' ? 'Practice Conversation' : 'Practice Speech'}
              </h3>
            </div>
            <div
              className={styles.speechContent}
              dangerouslySetInnerHTML={{
                __html: highlightText(
                  result.speech,
                  [...result.vocabulary, ...result.idioms]
                ),
              }}
            />
          </div>

          <div className={styles.learningSection}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeSection === 'vocab' ? styles.tabActive : ''}`}
                onClick={() => setActiveSection('vocab')}
              >
                Vocabulary ({result.vocabulary.length})
              </button>
              <button
                className={`${styles.tab} ${activeSection === 'idioms' ? styles.tabActive : ''}`}
                onClick={() => setActiveSection('idioms')}
              >
                Idioms ({result.idioms.length})
              </button>
              <button
                className={`${styles.tab} ${activeSection === 'grammar' ? styles.tabActive : ''}`}
                onClick={() => setActiveSection('grammar')}
              >
                Grammar ({result.grammar.length})
              </button>
              <button
                className={`${styles.tab} ${activeSection === 'patterns' ? styles.tabActive : ''}`}
                onClick={() => setActiveSection('patterns')}
              >
                Sentence Patterns ({result.sentencePatterns.length})
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeSection === 'vocab' && (
                <div className={styles.vocabList}>
                  {result.vocabulary.map((item, idx) => (
                    <div key={idx} className={styles.vocabItem}>
                      <div className={styles.vocabEnglish}>
                        <strong>{item.english}</strong>
                      </div>
                      <div className={styles.vocabVietnamese}>{item.vietnamese}</div>
                      {item.explanation && (
                        <div className={styles.vocabExplanation}>{item.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'idioms' && (
                <div className={styles.idiomList}>
                  {result.idioms.map((item, idx) => (
                    <div key={idx} className={styles.idiomItem}>
                      <div className={styles.idiomEnglish}>
                        <strong>{item.english}</strong>
                      </div>
                      <div className={styles.idiomVietnamese}>{item.vietnamese}</div>
                      <div className={styles.idiomUsage}>
                        <em>Usage: {item.usage}</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'grammar' && (
                <div className={styles.grammarList}>
                  {result.grammar.map((item, idx) => (
                    <div key={idx} className={styles.grammarItem}>
                      <div className={styles.grammarStructure}>
                        <strong>{item.structure}</strong>
                      </div>
                      <div className={styles.grammarExplanation}>{item.explanation}</div>
                      <div className={styles.grammarExamples}>
                        <strong>Examples:</strong>
                        <ul>
                          {item.examples.map((example, exIdx) => (
                            <li key={exIdx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'patterns' && (
                <div className={styles.patternList}>
                  {result.sentencePatterns.map((item, idx) => (
                    <div key={idx} className={styles.patternItem}>
                      <div className={styles.patternStructure}>
                        <strong>{item.pattern}</strong>
                      </div>
                      <div className={styles.patternExplanation}>{item.explanation}</div>
                      <div className={styles.patternExamples}>
                        <strong>Examples:</strong>
                        <ul>
                          {item.examples.map((example, exIdx) => (
                            <li key={exIdx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
