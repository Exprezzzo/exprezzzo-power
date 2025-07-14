import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: body.prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return NextResponse.json({
      success: true,
      provider: 'groq',
      model: 'mixtral-8x7b',
      response: completion.choices[0]?.message?.content || 'No response',
      usage: {
        tokens: completion.usage?.total_tokens || 0,
        cost: (completion.usage?.total_tokens || 0) * 0.00001
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'API Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}