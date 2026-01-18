import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'ielts.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vocal_learning_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_words TEXT NOT NULL,
    results_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS speaking_practice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    results_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Lesson {
  id?: number;
  name: string;
  content: string;
  created_at?: string;
}

export interface SpeakingPracticeSession {
  id?: number;
  conversation_name: string;
  topic: string;
  results_json: string;
  created_at?: string;
}

export default db;

