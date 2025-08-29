import { NextRequest } from 'next/server'

// EP-FN01-v1.0: SSE Streaming implementation
export async function POST(req: NextRequest) {
  const { prompt, model } = await req.json()
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial event
        controller.enqueue(
          encoder.encode(`event: start\ndata: ${JSON.stringify({ model, runId: Date.now() })}\n\n`)
        )
        
        // Stream tokens (simulated for now, will be replaced with real provider)
        const response = `This is a response from ${model} model for: ${prompt}`
        const tokens = response.split(' ')
        
        for (const token of tokens) {
          await new Promise(resolve => setTimeout(resolve, 100))
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify({ content: token + ' ' })}\n\n`)
          )
        }
        
        // Send done event
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
      } catch (error) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// Health check endpoint
export async function GET() {
  return Response.json({ healthy: true, time: new Date().toISOString() })
}
