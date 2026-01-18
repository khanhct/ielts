import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PracticeRequest {
  topic: string;
  conversationName?: string;
  format?: 'speech' | 'conversation';
}

export async function GET() {
  try {
    const sessions = db.prepare('SELECT * FROM speaking_practice_sessions ORDER BY created_at DESC').all();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PracticeRequest = await request.json();
    const { topic, conversationName } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!conversationName || typeof conversationName !== 'string' || !conversationName.trim()) {
      return NextResponse.json(
        { error: 'Conversation name is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const format = body.format || 'speech';
    const isConversation = format === 'conversation';
    const formatDescription = isConversation 
      ? 'two-person conversation/dialogue' 
      : 'single-person speech/monologue';
    const formatInstructions = isConversation
      ? `- Create a natural dialogue between two people (Person A and Person B)
   - Use dialogue format with clear speaker labels (e.g., "Person A:", "Person B:")
   - Make it a realistic back-and-forth conversation
   - Include natural interruptions, agreements, and responses
   - Each person should speak multiple times (6-10 exchanges total)
   - Should sound like a real conversation between native speakers
   - Total length: 200-300 words`
      : `- Create a natural, conversational speech that a software engineer would use in this scenario
   - Use NATIVE SPEAKER communication style (not formal/academic)
   - Include natural phrases, casual transitions, and authentic expressions
   - Make it practical and realistic for work situations
   - Should sound like how native speakers actually talk in meetings/discussions
   - Total length: 200-300 words`;

    const prompt = `You are an expert English communication coach specializing in helping software engineers communicate naturally with native English speakers in professional settings.

The user wants to practice speaking English for this work scenario: "${topic}"

Generate a comprehensive practice ${formatDescription} and learning materials following these requirements:

1. **${isConversation ? 'Conversation' : 'Speech'} (200-300 words)**: 
   ${formatInstructions}

2. **Vocabulary (8-12 items)**:
   - Include professional vocabulary relevant to the topic
   - Focus on words/phrases commonly used in tech/work contexts
   - Provide English term and Vietnamese meaning
   - Add brief explanation of usage context if helpful

3. **Idioms (5-8 items)**:
   - Include common idioms and expressions native speakers use in professional settings
   - Provide English idiom, Vietnamese meaning, and a usage example in context
   - Focus on idioms that sound natural in work conversations

4. **Grammar (4-6 items)**:
   - Explain specific grammar structures used in the speech
   - Focus on patterns that are common in spoken English but might be confusing
   - Provide structure name, explanation, and 2-3 example sentences
   - Examples: conditional sentences, passive voice, relative clauses, etc.

5. **Sentence Patterns (5-7 items)**:
   - Common sentence patterns/phrases native speakers use in work contexts
   - Patterns like "I'd like to...", "What I'm thinking is...", "The way I see it..."
   - Provide pattern, explanation, and 2-3 example sentences

IMPORTANT STYLE REQUIREMENTS:
- Use NATURAL, CONVERSATIONAL English (not formal IELTS style)
- Include discourse markers: "Well...", "Actually...", "You know...", "I mean..."
- Use contractions: "I'm", "we're", "don't", "can't"
- Include natural fillers and transitions
- Sound like real workplace conversations, not academic presentations

Format your response as JSON:
{
  "speech": "The full ${isConversation ? 'conversation/dialogue' : 'speech'} text (200-300 words) in natural conversational style${isConversation ? '. Use dialogue format with Person A: and Person B: labels for each speaker' : ''}",
  "vocabulary": [
    {
      "english": "word or phrase",
      "vietnamese": "Vietnamese meaning",
      "explanation": "Brief context explanation (optional)"
    }
  ],
  "idioms": [
    {
      "english": "idiom or expression",
      "vietnamese": "Vietnamese meaning",
      "usage": "Example sentence showing how to use it"
    }
  ],
  "grammar": [
    {
      "structure": "Grammar structure name",
      "explanation": "Explanation in Vietnamese",
      "examples": ["Example 1", "Example 2", "Example 3"]
    }
  ],
  "sentencePatterns": [
    {
      "pattern": "Sentence pattern",
      "explanation": "Explanation in Vietnamese",
      "examples": ["Example 1", "Example 2", "Example 3"]
    }
  ]
}

Return ONLY valid JSON, no additional text or markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert English communication coach. Always respond with valid JSON only, no additional text or markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON, with fallback to extract JSON from text if needed
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response from OpenAI');
      }
    }

    // Validate response structure
    if (!result.speech || !result.vocabulary || !result.idioms || !result.grammar || !result.sentencePatterns) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Save to database
    const insertStmt = db.prepare(`
      INSERT INTO speaking_practice_sessions (conversation_name, topic, results_json)
      VALUES (?, ?, ?)
    `);
    
    insertStmt.run(conversationName.trim(), topic.trim(), JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating speaking practice:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate practice content',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    db.prepare('DELETE FROM speaking_practice_sessions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
