import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebase/admin';

// Edge runtime for streaming
export const runtime = 'nodejs';
export const maxDuration = 60;

// AI Provider configurations
const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-70b-versatile',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
    }),
  },
};

// Provider selection with fallback
function selectProvider(requestedModel: string) {
  const providerOrder = ['groq', 'openai', 'anthropic', 'gemini'];
  
  // Try requested provider first
  if (requestedModel && AI_PROVIDERS[requestedModel as keyof typeof AI_PROVIDERS]) {
    const provider = AI_PROVIDERS[requestedModel as keyof typeof AI_PROVIDERS];
    if (provider.apiKey) {
      return provider;
    }
  }
  
  // Fallback to first available provider
  for (const providerId of providerOrder) {
    const provider = AI_PROVIDERS[providerId as keyof typeof AI_PROVIDERS];
    if (provider.apiKey) {
      console.log(`Using ${provider.name} as provider`);
      return provider;
    }
  }
  
  throw new Error('No AI providers configured. Please add API keys to environment variables.');
}

// Format messages for different providers
function formatMessages(messages: any[], provider: any) {
  if (provider.id === 'anthropic') {
    return {
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      model: provider.model,
      max_tokens: 1000,
      stream: true
    };
  }
  
  if (provider.id === 'gemini') {
    return {
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };
  }
  
  // OpenAI format (also works for Groq)
  return {
    model: provider.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model: requestedModel, temperature = 0.7, maxTokens = 1000, userId = 'anonymous' } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Select provider with fallback
    const selectedProvider = selectProvider(requestedModel);
    
    // Build request URL
    let apiUrl = selectedProvider.baseUrl;
    if (selectedProvider.id === 'gemini') {
      apiUrl = `${apiUrl}/models/${selectedProvider.model}:streamGenerateContent?key=${selectedProvider.apiKey}`;
    } else if (selectedProvider.id === 'anthropic') {
      apiUrl = `${apiUrl}/messages`;
    } else {
      apiUrl = `${apiUrl}/chat/completions`;
    }

    // Format request body
    const requestBody = formatMessages(messages, selectedProvider);
    
    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: selectedProvider.headers(selectedProvider.apiKey || ''),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`${selectedProvider.name} API error:`, error);
      
      // Try fallback provider
      const fallbackProvider = selectProvider('openai');
      if (fallbackProvider.id !== selectedProvider.id) {
        console.log(`Falling back to ${fallbackProvider.name}`);
        return POST(request); // Retry with fallback
      }
      
      return NextResponse.json({ 
        error: `API request failed: ${error}`,
        provider: selectedProvider.name 
      }, { status: response.status });
    }

    // Handle streaming response
    if (!response.body) {
      return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    // Track usage in Firestore (non-blocking)
    const adminDb = getAdminDb();
    if (adminDb && userId !== 'anonymous') {
      adminDb.collection('users').doc(userId).set({
        lastActivity: new Date().toISOString(),
        chatCount: FieldValue.increment(1),
        [`modelUsage.${selectedProvider.id}.count`]: FieldValue.increment(1),
      }, { merge: true }).catch(console.error);
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const json = JSON.parse(data);
                let content = '';
                
                // Extract content based on provider
                if (selectedProvider.id === 'anthropic') {
                  content = json.delta?.text || '';
                } else if (selectedProvider.id === 'gemini') {
                  content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  content = json.choices?.[0]?.delta?.content || '';
                }
                
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}