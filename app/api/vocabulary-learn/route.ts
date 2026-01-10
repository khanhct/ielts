import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import db from '@/lib/db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const history = db.prepare('SELECT * FROM vocal_learning_sessions ORDER BY created_at DESC').all()
    return NextResponse.json(history)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { words } = await request.json()

    if (!words || typeof words !== 'string') {
      return NextResponse.json({ error: 'Words are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const wordList = words.split(',').map(w => w.trim()).filter(w => w.length > 0)

    const prompt = `You are an expert English teacher. For each of the following words, provide a detailed breakdown in Vietnamese and English.
Words: ${wordList.join(', ')}

IMPORTANT REQUIREMENTS:
1. Identify the base verb form for each word (e.g., "contribution" -> verb is "contribute", "investigation" -> "investigate").
2. The "Verb Phrases" section MUST include:
   - The basic verb pattern (e.g., "investigate something", "contribute to something").
   - Common phrasal verbs and collocations (e.g., "carry out an investigation", "launch an investigation into").
3. Provide a detailed breakdown for each word.

Format the response as a JSON object with a key "results" containing an array of objects:
{
  "results": [
    {
      "word": "the input word",
      "word_type": "e.g., noun/verb/adjective",
      "pronunciation": "/.../",
      "meaning": "Vietnamese meaning",
      "related_verb": {
        "verb": "the base verb form (e.g., 'investigate')",
        "pronunciation": "/.../",
        "meaning": "meaning of the verb in Vietnamese"
      },
      "verb_phrases": [
        {"phrase": "verb pattern or collocation (e.g., 'investigate something')", "meaning": "meaning in Vietnamese"},
        {"phrase": "common phrase (e.g., 'carry out an investigation')", "meaning": "meaning in Vietnamese"},
        ...
      ],
      "synonyms": ["synonym 1", "synonym 2", ...]
    }
  ]
}

Example for 'contribution':
{
  "results": [
    {
      "word": "contribution",
      "word_type": "noun",
      "pronunciation": "/ˌkɒntrɪˈbjuːʃn/",
      "meaning": "sự đóng góp, sự góp phần",
      "related_verb": {
        "verb": "contribute",
        "pronunciation": "/kənˈtrɪbjuːt/",
        "meaning": "đóng góp, góp phần"
      },
      "verb_phrases": [
        {"phrase": "contribute to something", "meaning": "đóng góp vào cái gì"},
        {"phrase": "make a contribution to", "meaning": "đóng góp cho"},
        {"phrase": "contribution of A to B", "meaning": "sự đóng góp của A cho B"}
      ],
      "synonyms": ["donation", "offering", "input", "participation"]
    }
  ]
}

Return ONLY the JSON object.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert English teacher. Always respond with a valid JSON object containing a "results" array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    let results: any[] = []
    try {
      const parsed = JSON.parse(responseText.trim())
      results = parsed.results || []
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        results = parsed.results || []
      } else {
        throw new Error('Failed to parse OpenAI response')
      }
    }

    // Save as a single session
    const insertStmt = db.prepare(`
      INSERT INTO vocal_learning_sessions (input_words, results_json)
      VALUES (?, ?)
    `)

    insertStmt.run(words, JSON.stringify(results))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in vocabulary learn:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
    try {
      const { id } = await request.json()
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
      
      db.prepare('DELETE FROM vocal_learning_sessions WHERE id = ?').run(id)
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
