import { NextRequest } from 'next/server';
import { ProviderRouter } from '@/lib/providers/router';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { messages, model, provider } = await req.json();
        const lastMessage = messages[messages.length - 1].content;
        
        const router = new ProviderRouter();
        let tokenCount = 0;
        
        // Send SSE headers
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        
        // Stream tokens
        for await (const { token } of router.routeRequest(lastMessage, provider)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          tokenCount++;
          
          // Heartbeat every 50 tokens
          if (tokenCount % 50 === 0) {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }
        }
        
        // Send completion
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}