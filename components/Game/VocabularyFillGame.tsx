'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, X, RotateCcw } from 'lucide-react';
import styles from './VocabularyFillGame.module.css';

interface VocabularyItem {
  word: string;
  meaning: string;
}

interface VocabularyFillGameProps {
  vocabulary: VocabularyItem[];
  onClose: () => void;
}

type GameMode = 'vocab-to-meaning' | 'meaning-to-vocab';

export default function VocabularyFillGame({ vocabulary, onClose }: VocabularyFillGameProps) {
  const [gameMode, setGameMode] = useState<GameMode>('vocab-to-meaning');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);

  // Shuffle vocabulary for random order
  const shuffledVocab = useMemo(() => {
    if (!vocabulary || vocabulary.length === 0) return [];
    return [...vocabulary].sort(() => Math.random() - 0.5);
  }, [vocabulary]);

  const currentQuestion = shuffledVocab[currentIndex];
  const isVocabMode = gameMode === 'vocab-to-meaning';
  const progress = vocabulary.length > 0 ? ((answeredQuestions.size / vocabulary.length) * 100).toFixed(0) : 0;

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    setIsCorrect(null);
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    setIsChecking(true);
    try {
      const response = await fetch('/api/vocabulary-game/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: userAnswer.trim(),
          correctAnswer: isVocabMode ? currentQuestion.meaning : currentQuestion.word,
          question: isVocabMode ? currentQuestion.word : currentQuestion.meaning,
        }),
      });

      const data = await response.json();
      const correct = data.isCorrect || false;

      setIsCorrect(correct);
      setScore(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));

      if (correct) {
        setAnsweredQuestions(prev => new Set(prev).add(currentIndex));
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      setIsCorrect(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isChecking) {
      checkAnswer();
    }
  };

  const nextQuestion = () => {
    if (currentIndex < shuffledVocab.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsCorrect(null);
    } else {
      // Game finished
      setShowResult(true);
    }
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
    setScore({ correct: 0, total: 0 });
    setAnsweredQuestions(new Set());
    setShowResult(false);
  };

  const switchMode = () => {
    setGameMode(prev => prev === 'vocab-to-meaning' ? 'meaning-to-vocab' : 'vocab-to-meaning');
    resetGame();
  };

  if (showResult) {
    const percentage = score.total > 0 ? ((score.correct / score.total) * 100).toFixed(0) : 0;
    return (
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>Game Complete!</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.resultContainer}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 className={styles.resultTitle}>Your Score</h3>
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreNumber}>{score.correct} / {score.total}</div>
            <div className={styles.scorePercentage}>{percentage}%</div>
          </div>
          <div className={styles.resultActions}>
            <button className={styles.playAgainBtn} onClick={resetGame}>
              <RotateCcw size={18} style={{ marginRight: '8px' }} />
              Play Again
            </button>
            <button className={styles.switchModeBtn} onClick={switchMode}>
              Switch Mode
            </button>
            <button className={styles.closeGameBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className={styles.gameContainer}>
        <p>No vocabulary available for this game.</p>
        <button className={styles.closeGameBtn} onClick={onClose} style={{ marginTop: '1rem' }}>
          Close
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={styles.gameContainer}>
        <Loader2 className="animate-spin" size={48} color="#6366f1" />
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.header}>
        <div>
          <h2>Vocabulary Fill Game</h2>
          <div className={styles.modeSelector}>
            <button
              className={`${styles.modeBtn} ${isVocabMode ? styles.active : ''}`}
              onClick={() => gameMode !== 'vocab-to-meaning' && switchMode()}
            >
              Word → Meaning
            </button>
            <button
              className={`${styles.modeBtn} ${!isVocabMode ? styles.active : ''}`}
              onClick={() => gameMode !== 'meaning-to-vocab' && switchMode()}
            >
              Meaning → Word
            </button>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        <span className={styles.progressText}>
          {answeredQuestions.size} / {vocabulary.length} ({progress}%)
        </span>
      </div>

      <div className={styles.scoreBoard}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Correct:</span>
          <span className={styles.scoreValue}>{score.correct}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Total:</span>
          <span className={styles.scoreValue}>{score.total}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Accuracy:</span>
          <span className={styles.scoreValue}>
            {score.total > 0 ? ((score.correct / score.total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>

      <div className={styles.questionContainer}>
        <div className={styles.questionNumber}>
          Question {currentIndex + 1} of {vocabulary.length}
        </div>
        <div className={styles.questionCard}>
          <div className={styles.questionLabel}>
            {isVocabMode ? 'Word' : 'Meaning'}
          </div>
          <div className={styles.questionText}>
            {isVocabMode ? currentQuestion.word : currentQuestion.meaning}
          </div>
        </div>

        <div className={styles.answerSection}>
          <label className={styles.answerLabel}>
            {isVocabMode ? 'Enter the meaning' : 'Enter the word'}
          </label>
          <input
            type="text"
            className={`${styles.answerInput} ${isCorrect === true ? styles.correct : ''} ${isCorrect === false ? styles.incorrect : ''}`}
            value={userAnswer}
            onChange={handleAnswerChange}
            onKeyPress={handleKeyPress}
            placeholder={isVocabMode ? 'Type the meaning...' : 'Type the word...'}
            disabled={isChecking || isCorrect === true}
            autoFocus
          />
          {isCorrect === true && (
            <div className={styles.feedbackCorrect}>
              <CheckCircle2 size={20} />
              <span>Correct!</span>
            </div>
          )}
          {isCorrect === false && (
            <div className={styles.feedbackIncorrect}>
              <X size={20} />
              <span>Incorrect. The answer is: <strong>{isVocabMode ? currentQuestion.meaning : currentQuestion.word}</strong></span>
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.checkBtn}
            onClick={checkAnswer}
            disabled={!userAnswer.trim() || isChecking || isCorrect === true}
          >
            {isChecking ? (
              <>
                <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                Checking...
              </>
            ) : (
              'Check Answer'
            )}
          </button>
          {isCorrect !== null && (
            <button
              className={styles.nextBtn}
              onClick={nextQuestion}
            >
              {currentIndex < shuffledVocab.length - 1 ? 'Next Question' : 'Finish Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
