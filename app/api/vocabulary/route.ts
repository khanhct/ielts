import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VocabularyRequest {
  topic: string
  taskType: 'speaking' | 'writing'
}

export async function POST(request: NextRequest) {
  try {
    const body: VocabularyRequest = await request.json()
    const { topic, taskType } = body

    if (!topic || !taskType) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and taskType' },
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

    const isSpeaking = taskType === 'speaking'
    const taskDescription = isSpeaking ? 'IELTS Speaking' : 'IELTS Writing'
    
    const speakingGuidance = `For IELTS Speaking, focus on:
- Conversational phrases and expressions
- Discourse markers (e.g., "Well, I think...", "To be honest...", "Actually...")
- Idiomatic expressions and natural phrases
- Collocations commonly used in spoken English
- Phrases for expressing opinions, agreeing, disagreeing
- Phrases for describing experiences and giving examples`

    const writingGuidance = `For IELTS Writing, focus on:
- Academic and formal phrases
- Linking words and transition phrases
- Formal expressions for essays and reports
- Academic vocabulary and collocations
- Phrases for introducing ideas, contrasting, concluding
- Formal structures for Task 1 (describing data) or Task 2 (essay writing)`

    const taskGuidance = isSpeaking ? speakingGuidance : writingGuidance
    const vocabStyle = isSpeaking ? 'Conversational and suitable for spoken English' : 'Formal and suitable for academic writing'
    const structureStyle = isSpeaking 
      ? 'Natural structures for speaking (e.g., "I\'d say that...", "What I mean is...")' 
      : 'Sophisticated structures for writing (e.g., "It is widely believed that...", "Not only... but also...")'

    const prompt = `You are an expert IELTS teacher. Generate comprehensive PHRASES and IDIOMS specifically for ${taskDescription} related to the topic: "${topic}"

${taskGuidance}

Requirements:
1. Provide 20-25 useful PHRASES/IDIOMS (not just single words) that are:
   - Specifically related to the topic "${topic}"
   - Appropriate for ${taskDescription}
   - Natural and impressive for Band 7-9
   - ${vocabStyle}
   - Include complete phrases, idioms, collocations, and expressions related to "${topic}"

2. Provide 15-20 additional PHRASES/IDIOMS that are:
   - Also specifically related to the topic "${topic}"
   - Useful for ${taskDescription}
   - ${vocabStyle}
   - Different from the first set (provide variety)
   - Include idioms, phrasal verbs, collocations, and expressions related to "${topic}"

Format your response as JSON with the following structure:
{
  "vocabulary": [
    {
      "english": "phrase or idiom related to ${topic} (e.g., 'carbon footprint', 'renewable energy', 'climate change')",
      "vietnamese": "Vietnamese meaning/translation of the phrase",
      "example": "Example sentence using this phrase in context related to ${topic}"
    }
  ],
  "structures": [
    {
      "english": "phrase or idiom related to ${topic} (e.g., 'sustainable development', 'green technology', 'environmental impact')",
      "vietnamese": "Vietnamese meaning/translation of the phrase",
      "example": "Example sentence using this phrase in context related to ${topic}"
    }
  ]
}

IMPORTANT:
- BOTH sections should contain PHRASES/IDIOMS related to the topic "${topic}"
- Focus on topic-specific vocabulary, not general grammatical structures
- All phrases/idioms must be relevant to "${topic}"
- Provide variety - don't repeat similar phrases
- Examples should demonstrate practical usage related to "${topic}"
- Return ONLY valid JSON, no additional text`

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS teacher. Always respond with valid JSON only, no additional text or markdown.',
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
    if (!result.vocabulary || !result.structures) {
      throw new Error('Invalid response format from OpenAI')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating vocabulary:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate vocabulary',
      },
      { status: 500 }
    )
  }
}

