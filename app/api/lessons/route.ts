import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const lessons = db.prepare('SELECT * FROM lessons ORDER BY created_at DESC').all();
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, content } = await request.json();
    
    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO lessons (name, content) VALUES (?, ?)');
    const result = stmt.run(name, content);

    return NextResponse.json({ id: result.lastInsertRowid, name, content });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}

