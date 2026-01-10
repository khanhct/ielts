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

export async function PUT(request: Request) {
  try {
    const { id, name, content } = await request.json();
    
    if (!id || !name || !content) {
      return NextResponse.json({ error: 'ID, name, and content are required' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE lessons SET name = ?, content = ? WHERE id = ?');
    const result = stmt.run(name, content, id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ id, name, content });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

