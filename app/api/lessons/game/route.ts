import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { lessonId, content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Lesson content is required' }, { status: 400 });
    }

    // Check if content is already JSON (from word-based vocabulary)
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word && parsed[0].meaning) {
        return NextResponse.json({ cards: parsed.map((item: any) => ({ word: item.word, meaning: item.meaning })) });
      }
    } catch (e) {
      // Not JSON, continue with AI generation
    }

    const prompt = `You are an IELTS expert. Based on the following lesson content, extract or generate 8 key vocabulary words or phrases and their Vietnamese meanings for a matching game.
    
    Content:
    ${content}
    
    Requirements:
    1. Select the most important and useful vocabulary for IELTS.
    2. Provide a clear, concise Vietnamese meaning for each.
    3. Format the response as a JSON object with a "cards" array.
    
    Format:
    {
      "cards": [
        {"word": "vocabulary 1", "meaning": "meaning 1"},
        ...
      ]
    }
    
    Return ONLY the JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert IELTS teacher. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error('No response from AI');

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Game data generation error:', error);
    return NextResponse.json({ error: 'Failed to generate game data' }, { status: 500 });
  }
}

