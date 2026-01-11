'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import styles from './FlashcardGame.module.css';

interface CardData {
  word: string;
  meaning: string;
}

interface FlashcardGameProps {
  lessonContent: string;
  lessonName: string;
  onClose: () => void;
}

interface GameCard {
  id: string;
  content: string;
  type: 'word' | 'meaning';
  pairId: number;
}

export default function FlashcardGame({ lessonContent, lessonName, onClose }: FlashcardGameProps) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedWord, setSelectedWord] = useState<GameCard | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<GameCard | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState(0);

  useEffect(() => {
    initGame();
  }, [lessonContent]);

  const initGame = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/lessons/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lessonContent }),
      });
      const data = await response.json();
      
      if (data.cards) {
        const gameCards: GameCard[] = [];
        data.cards.forEach((item: CardData, index: number) => {
          gameCards.push({
            id: `word-${index}`,
            content: item.word,
            type: 'word',
            pairId: index,
          });
          gameCards.push({
            id: `meaning-${index}`,
            content: item.meaning,
            type: 'meaning',
            pairId: index,
          });
        });
        
        setCards(gameCards);
        setMatchedIds(new Set());
        setErrorIds(new Set());
        setTries(0);
      }
    } catch (error) {
      console.error('Failed to init game:', error);
    } finally {
      setLoading(false);
    }
  };

  const shuffledWords = useMemo(() => 
    [...cards.filter(c => c.type === 'word')].sort(() => Math.random() - 0.5),
    [cards]
  );

  const shuffledMeanings = useMemo(() => 
    [...cards.filter(c => c.type === 'meaning')].sort(() => Math.random() - 0.5),
    [cards]
  );

  const handleCardClick = (card: GameCard) => {
    if (matchedIds.has(card.id) || errorIds.has(card.id)) return;

    if (card.type === 'word') {
      if (selectedWord?.id === card.id) {
        setSelectedWord(null);
      } else {
        setSelectedWord(card);
        checkMatch(card, selectedMeaning);
      }
    } else {
      if (selectedMeaning?.id === card.id) {
        setSelectedMeaning(null);
      } else {
        setSelectedMeaning(card);
        checkMatch(selectedWord, card);
      }
    }
  };

  const checkMatch = (word: GameCard | null, meaning: GameCard | null) => {
    if (!word || !meaning) return;

    setTries(prev => prev + 1);

    if (word.pairId === meaning.pairId) {
      // Match found
      setMatchedIds(prev => {
        const next = new Set(prev);
        next.add(word.id);
        next.add(meaning.id);
        return next;
      });
      setSelectedWord(null);
      setSelectedMeaning(null);
    } else {
      // Not a match
      setErrorIds(new Set([word.id, meaning.id]));
      setTimeout(() => {
        setErrorIds(new Set());
        setSelectedWord(null);
        setSelectedMeaning(null);
      }, 1000);
    }
  };

  const isGameOver = cards.length > 0 && matchedIds.size === cards.length;

  if (loading) {
    return (
      <div className={styles.gameContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={48} color="#6366f1" />
        <p style={{ marginTop: '1rem', color: '#6366f1', fontWeight: 600 }}>Generating game cards...</p>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.header}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vocabulary Match: {lessonName}</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Connect the words with their meanings</p>
        </div>
        <div className={styles.scoreBoard}>
          Tries: {tries}
        </div>
      </div>

      {isGameOver ? (
        <div className={styles.successOverlay}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 className={styles.successTitle}>Well Done!</h3>
          <p>You've matched all {cards.length / 2} pairs in {tries} tries.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className={styles.playAgainBtn} onClick={initGame}>
              <RefreshCw size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Play Again
            </button>
            <button className={styles.playAgainBtn} style={{ background: '#e5e7eb', color: '#374151' }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.column}>
            {shuffledWords.map(card => (
              <div
                key={card.id}
                className={`
                  ${styles.card} 
                  ${selectedWord?.id === card.id ? styles.selected : ''} 
                  ${matchedIds.has(card.id) ? styles.matched : ''}
                  ${errorIds.has(card.id) ? styles.error : ''}
                `}
                onClick={() => handleCardClick(card)}
              >
                {card.content}
              </div>
            ))}
          </div>
          <div className={styles.column}>
            {shuffledMeanings.map(card => (
              <div
                key={card.id}
                className={`
                  ${styles.card} 
                  ${selectedMeaning?.id === card.id ? styles.selected : ''} 
                  ${matchedIds.has(card.id) ? styles.matched : ''}
                  ${errorIds.has(card.id) ? styles.error : ''}
                `}
                onClick={() => handleCardClick(card)}
              >
                {card.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

