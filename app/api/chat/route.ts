import { NextRequest } from 'next/server';
import { ProviderRouter } from '@/lib/providers/router';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const write = (text: string) => {
        controller.enqueue(encoder.encode(text));
      };
      
      const router = new ProviderRouter();
      let streamed = false;
      
      try {
        // Stream tokens from provider
        for await (const { token } of router.routeRequest(prompt)) {
          streamed = true;
          write(`data: ${token}\n\n`);
        }
        
        write(`data: [DONE]\n\n`);
        
      } catch (error) {
        console.error('All providers failed:', error);
        
        if (!streamed) {
          // Send error as JSON if no tokens were streamed
          write(`data: {"error":"All providers unavailable"}\n\n`);
        }
        
        write(`data: [DONE]\n\n`);
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}