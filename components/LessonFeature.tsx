'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, X, BookOpen, Clock, Edit2 } from 'lucide-react';
import styles from './LessonFeature.module.css';

interface Lesson {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

export default function LessonFeature() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLessons(data);
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) return;

    setIsLoading(true);
    try {
      const isEditing = editingLessonId !== null;
      const response = await fetch('/api/lessons', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingLessonId, 
          name, 
          content 
        }),
      });

      if (response.ok) {
        setName('');
        setContent('');
        setShowForm(false);
        setEditingLessonId(null);
        fetchLessons();
      }
    } catch (error) {
      console.error(`Failed to ${editingLessonId ? 'update' : 'create'} lesson:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setName(lesson.name);
    setContent(lesson.content);
    setEditingLessonId(lesson.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.title}>Lessons</h1>
        <button 
          className={styles.submitButton} 
          style={{ width: 'auto' }}
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingLessonId(null);
              setName('');
              setContent('');
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Cancel' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> New Lesson
            </span>
          )}
        </button>
      </div>

      {showForm && (
        <section className={styles.formSection}>
          <h2 className={styles.formTitle}>{editingLessonId ? 'Update Lesson' : 'Create New Lesson'}</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Lesson Name</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., IELTS Writing Task 1 Basics"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Content (Markdown)</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Lesson Title&#10;&#10;Use markdown to format your lesson..."
                required
              />
            </div>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editingLessonId ? 'Update Lesson' : 'Save Lesson')}
            </button>
          </form>
        </section>
      )}

      <div className={styles.lessonList}>
        {lessons.map((lesson) => (
          <div key={lesson.id} className={styles.lessonCard}>
            <h3 className={styles.lessonName}>{lesson.name}</h3>
            <div className={styles.lessonDate}>
              <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {new Date(lesson.created_at).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className={styles.viewButton}
                onClick={() => setSelectedLesson(lesson)}
              >
                <BookOpen size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Read
              </button>
              <button 
                className={styles.viewButton}
                style={{ color: '#059669' }}
                onClick={() => handleEdit(lesson)}
              >
                <Edit2 size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedLesson && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLesson(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedLesson(null)}>
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '1rem' }}>{selectedLesson.name}</h2>
            <div className={styles.markdown}>
              <ReactMarkdown>{selectedLesson.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

