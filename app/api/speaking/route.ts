import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SpeakingRequest {
  question: string
  part: string
  bands: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: SpeakingRequest = await request.json()
    const { question, part, bands } = body

    if (!question || !part || !bands || bands.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Using the latest OpenAI model (supports JSON mode)
    // Latest models: 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'
    // Note: The url.parse() deprecation warning is from dependencies and can be safely ignored
    const model = 'gpt-4o' // Change to 'gpt-4-turbo' or 'gpt-3.5-turbo' if needed

    // Generate answers for each band separately
    const results = await Promise.all(
      bands.map(async (band) => {
        const prompt = `You are an expert IELTS speaking examiner. Generate a high-quality answer for IELTS Speaking Part ${part} that would score Band ${band}.

Question: ${question}

Requirements:
1. Provide a natural, fluent answer appropriate for Band ${band} level
2. Include advanced vocabulary (at least 8-10 words/phrases) that would impress examiners for Band ${band}
3. Include sophisticated grammatical structures (at least 5-6 structures) that demonstrate high-level English appropriate for Band ${band}
4. The answer should be appropriate for Part ${part} of the IELTS speaking test
5. The complexity and sophistication should match Band ${band} expectations

Format your response as JSON with the following structure:
{
  "answer": "The full answer text in English",
  "vocabulary": [
    {"english": "word or phrase", "vietnamese": "Vietnamese meaning"},
    ...
  ],
  "structures": [
    {"english": "grammatical structure", "vietnamese": "Vietnamese explanation"},
    ...
  ]
}

Make sure:
- Vocabulary items are impressive and appropriate for Band ${band} level
- Structures are sophisticated (e.g., complex sentences, conditional clauses, passive voice, etc.) matching Band ${band} expectations
- All vocabulary and structures appear in the answer text
- Vietnamese translations are accurate and clear
- Return ONLY valid JSON, no additional text`

        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert IELTS speaking examiner. Always respond with valid JSON only, no additional text or markdown.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        })

        const responseText = completion.choices[0]?.message?.content
        if (!responseText) {
          throw new Error(`No response from OpenAI for Band ${band}`)
        }

        // Parse JSON, with fallback to extract JSON from text if needed
        let result
        try {
          result = JSON.parse(responseText)
        } catch (parseError) {
          // Try to extract JSON from markdown code blocks or plain text
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0])
          } else {
            throw new Error(`Failed to parse JSON response from OpenAI for Band ${band}`)
          }
        }

        // Validate response structure
        if (!result.answer || !result.vocabulary || !result.structures) {
          throw new Error(`Invalid response format from OpenAI for Band ${band}`)
        }

        return {
          band,
          ...result,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error generating speaking answer:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate answer',
      },
      { status: 500 }
    )
  }
}

