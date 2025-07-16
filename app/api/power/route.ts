import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Try Groq with CURRENT model
    try {
      const Groq = (await import('groq-sdk')).default;
      
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || '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'
      });
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: body.prompt }],
        model: "llama3-8b-8192",  // ✅ CURRENT WORKING MODEL
        temperature: 0.5,
        max_tokens: 150
      });
      
      return NextResponse.json({
        success: true,
        provider: 'groq',
        model: 'llama3-8b',
        response: completion.choices[0]?.message?.content || 'No response',
        usage: {
          tokens: completion.usage?.total_tokens || 0,
          cost: (completion.usage?.total_tokens || 0) * 0.00001
        }
      });
      
    } catch (groqError: any) {
      // If Groq fails, use mock response
      return NextResponse.json({
        success: true,
        provider: 'demo',
        response: `Exprezzzo Power Demo: "${body.prompt}" - Real AI coming soon!`,
        error: groqError.message,
        note: 'Using demo mode due to API issue'
      });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}