// app/api/playground/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { allAIProviders, type AIChatMessage, type StreamOptions } from '@/lib/ai-providers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages, provider, temperature, maxTokens, streaming = true } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    console.log(`[Playground API] Request for provider: ${provider}`);
    console.log(`[Playground API] Available providers: ${allAIProviders.map(p => p.id).join(', ')}`);

    const selectedProvider = allAIProviders.find(p => p.id === provider);
    if (!selectedProvider) {
      return NextResponse.json({ 
        error: `Provider "${provider}" not found. Available: ${allAIProviders.map(p => p.id).join(', ')}` 
      }, { status: 404 });
    }

    const options: StreamOptions = {
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1000
    };

    if (streaming) {
      // Return Server-Sent Events stream
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            console.log(`[Playground API] Starting stream with ${selectedProvider.name}`);
            
            for await (const chunk of selectedProvider.streamChatCompletion(messages as AIChatMessage[], options)) {
              const data = JSON.stringify({ content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            console.log(`[Playground API] Stream completed for ${selectedProvider.name}`);
          } catch (error: any) {
            console.error(`[Playground API] Stream error:`, error);
            const errorData = JSON.stringify({ error: error.message });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Return complete response
      let fullContent = '';
      try {
        for await (const chunk of selectedProvider.streamChatCompletion(messages as AIChatMessage[], options)) {
          fullContent += chunk;
        }
        return NextResponse.json({ content: fullContent });
      } catch (error: any) {
        console.error(`[Playground API] Error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('[Playground API] Request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}