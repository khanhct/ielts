import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface WritingRequest {
  input: string // Text input
  imageBase64?: string // Base64 encoded image (optional)
  taskType: string // Task 1 or Task 2
  bands: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: WritingRequest = await request.json()
    const { input, imageBase64, taskType, bands } = body

    if (!input || !taskType || !bands || bands.length === 0) {
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

    const model = 'gpt-4o' // gpt-4o supports vision

    // Generate responses for each band separately
    const results = await Promise.all(
      bands.map(async (band) => {
        const isTask1 = taskType === '1'
        const taskDescription = isTask1
          ? 'Task 1 (Academic: describe graph/chart/diagram, or General: write a letter)'
          : 'Task 2 (essay writing)'

        // Build messages array
        const messages: any[] = [
          {
            role: 'system',
            content: 'You are an expert IELTS writing examiner. Always respond with valid JSON only, no additional text or markdown.',
          },
        ]

        // Build user message content
        const userContent: any[] = [
          {
            type: 'text',
            text: `You are an expert IELTS writing examiner. Generate a high-quality ${taskDescription} response for IELTS Writing that would score Band ${band}.

${isTask1 ? 'Task 1 Requirements:' : 'Task 2 Requirements:'}
${isTask1
  ? `- Describe the visual information accurately
- Highlight key features and trends
- Use appropriate vocabulary for describing data/processes
- Write at least 150 words`
  : `- Address all parts of the question
- Present a clear position
- Support ideas with relevant examples
- Use appropriate vocabulary and structures
- Write at least 250 words`}

Input: ${input}

Requirements:
1. Provide a natural, fluent response appropriate for Band ${band} level
2. Include advanced vocabulary (at least 10-15 words/phrases) that would impress examiners for Band ${band}
3. Include sophisticated grammatical structures (at least 8-10 structures) that demonstrate high-level English appropriate for Band ${band}
4. The response should be appropriate for ${taskDescription}
5. The complexity and sophistication should match Band ${band} expectations

Format your response as JSON with the following structure:
{
  "response": "The full writing response text in English",
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
- Structures are sophisticated (e.g., complex sentences, conditional clauses, passive voice, relative clauses, etc.) matching Band ${band} expectations
- All vocabulary and structures appear in the response text
- Vietnamese translations are accurate and clear
- Return ONLY valid JSON, no additional text`,
          },
        ]

        // Add image if provided
        if (imageBase64) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          })
        }

        messages.push({
          role: 'user',
          content: userContent,
        })

        const completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
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
        if (!result.response || !result.vocabulary || !result.structures) {
          throw new Error(`Invalid response format from OpenAI for Band ${band}`)
        }

        return {
          band,
          response: result.response,
          vocabulary: result.vocabulary,
          structures: result.structures,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error generating writing response:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate response',
      },
      { status: 500 }
    )
  }
}

