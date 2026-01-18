import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateNameRequest {
  topic: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateNameRequest = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback to simple name generation
      const simpleName = `${topic} - ${new Date().toLocaleDateString()}`;
      return NextResponse.json({ name: simpleName });
    }

    const prompt = `Generate a concise, professional conversation name for a speaking practice session about: "${topic}"

Requirements:
- Keep it short (3-8 words maximum)
- Make it descriptive and professional
- Include context if relevant (e.g., "Q1 Customer Meeting", "Sprint Planning Discussion")
- Use title case
- Be specific to the topic

Examples:
- Topic: "Customer Meeting" → "Q1 Customer Meeting - Product Demo"
- Topic: "Team Discussion" → "Sprint Planning Team Discussion"
- Topic: "Technical Explanation" → "API Architecture Explanation Session"
- Topic: "Problem Solving" → "Bug Resolution Discussion"

Return ONLY the conversation name, no additional text or explanation.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Return only the conversation name, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (responseText) {
        // Clean up any quotes or extra formatting
        const cleanName = responseText.replace(/^["']|["']$/g, '').trim();
        return NextResponse.json({ name: cleanName || `${topic} - ${new Date().toLocaleDateString()}` });
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }

    // Fallback
    const fallbackName = `${topic} - ${new Date().toLocaleDateString()}`;
    return NextResponse.json({ name: fallbackName });
  } catch (error) {
    console.error('Error generating conversation name:', error);
    // Use topic from outer scope or fallback
    const fallbackTopic = topic || 'Practice Session';
    const fallbackName = `${fallbackTopic} - ${new Date().toLocaleDateString()}`;
    return NextResponse.json({ name: fallbackName });
  }
}
