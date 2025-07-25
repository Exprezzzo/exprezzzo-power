// app/api/chat/route.ts
// Real AI integration with streaming responses via Server-Sent Events (SSE).

import { NextRequest, NextResponse } from 'next/server';
import { streamChat, estimateTokens, getCustomerPrice } from '@/lib/ai-providers';

export const runtime = 'nodejs'; // Explicitly set to Node.js for AI SDKs

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json(); // Expect full messages array now

    if (!messages || messages.length === 0) {
      return new Response('Messages array required', { status: 400 });
    }

    const prompt = messages[messages.length - 1].content;
    console.log(`[AI Chat API] Received prompt: "${prompt}" for model: "${model}"`);

    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(messages, model)) {
            // Each chunk is an object { type: 'content', content: '...', model: '...' }
            // or { type: 'error', error: '...' }
            controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
        } catch (error) {
          console.error("Streaming error in API route:", error);
          controller.enqueue(textEncoder.encode(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : String(error) })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform', // Important for streaming
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}