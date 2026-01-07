import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface WritingFixRequest {
  question: string
  questionImageBase64?: string
  answer: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WritingFixRequest = await request.json()
    const { question, questionImageBase64, answer } = body

    if ((!question || !question.trim()) && !questionImageBase64) {
      return NextResponse.json(
        { error: 'Missing required field: question (text or image)' },
        { status: 400 }
      )
    }

    if (!answer || !answer.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: answer' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const model = 'gpt-4o'

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
        text: `You are an expert IELTS writing examiner. Analyze the following IELTS writing task and provide detailed feedback.

${questionImageBase64 ? 'Question (see image below):' : `Question: ${question}`}

Student's Answer:
${answer}

Please provide:
1. An overall band score (0-9) with brief justification
2. A detailed list of all grammatical errors and typos found
3. For each error, provide:
   - The exact location/context where the error appears
   - Explanation of what the error is
   - A corrected version that maintains the original meaning

Format your response as JSON with the following structure:
{
  "score": 7.5,
  "scoreExplanation": "Brief explanation of the score",
  "errors": [
    {
      "location": "Sentence 2, word 5",
      "originalText": "The incorrect text here",
      "errorType": "grammar" or "typo" or "spelling",
      "explanation": "Detailed explanation of what is wrong",
      "correctedText": "The corrected text here"
    }
  ],
  "correctedAnswer": "The full corrected version of the answer with all errors fixed but meaning preserved"
}

Requirements:
- Be thorough and identify ALL errors (grammar, spelling, typos, punctuation)
- Provide clear explanations for each error
- Ensure corrected versions maintain the original meaning
- Order errors by their appearance in the text
- The correctedAnswer should be the complete fixed version
- Return ONLY valid JSON, no additional text`,
      },
    ]

    // Add question image if provided
    if (questionImageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${questionImageBase64}`,
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
      temperature: 0.3, // Lower temperature for more consistent error detection
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
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
        throw new Error('Failed to parse JSON response from OpenAI')
      }
    }

    // Validate response structure
    if (!result.score || !result.errors || !result.correctedAnswer) {
      throw new Error('Invalid response format from OpenAI')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fixing writing task:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to analyze writing task',
      },
      { status: 500 }
    )
  }
}

