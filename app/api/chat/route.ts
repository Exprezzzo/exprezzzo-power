import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, model } = await req.json();
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`event: start\ndata: ${JSON.stringify({ model, runId: Date.now() })}\n\n`)
        );
        
        const tokens = prompt.split(" ");
        for (const token of tokens) {
          await new Promise(r => setTimeout(r, 100));
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify({ content: token + " " })}\n\n`)
          );
        }
        
        controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      } catch (error) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

export async function GET() {
  return Response.json({ healthy: true, time: new Date().toISOString() });
}