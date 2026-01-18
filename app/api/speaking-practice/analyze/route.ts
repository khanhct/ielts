import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import db from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzeRequest {
  speech: string;
  conversationName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { speech, conversationName } = body;

    if (!speech || typeof speech !== 'string' || !speech.trim()) {
      return NextResponse.json(
        { error: 'Speech text is required' },
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

    const prompt = `You are an expert English communication coach. Analyze the following speech or conversation text and extract learning materials.

Speech/Conversation:
"${speech}"

Analyze this text and provide:

1. **Vocabulary (8-15 items)**:
   - Identify important words and phrases that are useful for learning
   - Provide English term and Vietnamese meaning
   - Add brief explanation of usage context if helpful
   - Focus on words that are commonly used by native speakers

2. **Idioms (5-10 items)**:
   - Identify idioms, expressions, and natural phrases used
   - Provide English idiom, Vietnamese meaning, and a usage example
   - Focus on idioms that sound natural in conversation

3. **Grammar (4-8 items)**:
   - Explain specific grammar structures used in the text
   - Focus on patterns that are common in spoken English
   - Provide structure name, explanation, and 2-3 example sentences
   - Examples: conditional sentences, passive voice, relative clauses, discourse markers, etc.

4. **Sentence Patterns (5-10 items)**:
   - Identify common sentence patterns/phrases used
   - Patterns like "I'd like to...", "What I'm thinking is...", "The way I see it..."
   - Provide pattern, explanation, and 2-3 example sentences

IMPORTANT:
- Extract items that actually appear in the provided text
- Provide accurate Vietnamese translations
- Focus on natural, conversational English patterns
- Be specific and practical

Format your response as JSON:
{
  "speech": "The original speech text (keep as provided)",
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
      temperature: 0.7,
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
    
    insertStmt.run(conversationName.trim(), 'Analyzed Speech', JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing speech:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze speech',
      },
      { status: 500 }
    );
  }
}
