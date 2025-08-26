import { NextRequest, NextResponse } from 'next/server';

// Robin Hood pricing calculator
function calculateCost(model: string, tokens: number): number {
  const rates: Record<string, number> = {
    'groq': 0.00001,        // Groq is super cheap
    'gpt-4o-mini': 0.00015, // OpenAI mini model
    'claude-3-haiku': 0.00025, // Anthropic's fast model
    'gemini-1.5-flash': 0.00035  // Google's flash model
  };
  
  return (rates[model] || 0.0001) * tokens;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    
    // For now, return a mock response
    // In production, this would call the actual AI providers
    const mockResponse = `I'm currently running on the ${model} model through the Robin Hood Protocol, which gives you 40% savings compared to direct API access. How can I help you today?`;
    
    // Simulate token count
    const tokens = mockResponse.length / 4; // Rough approximation
    const cost = calculateCost(model, tokens);
    
    return NextResponse.json({
      success: true,
      content: mockResponse,
      model,
      cost,
      tokens,
      cached: false
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
