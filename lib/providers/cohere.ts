import { BaseProvider } from './base';

export class CohereProvider extends BaseProvider {
  id = 'cohere';
  name = 'Cohere';
  private apiKey = process.env.COHERE_API_KEY || '';
  
  async *send(prompt: string, ctx: { signal?: AbortSignal }): AsyncGenerator<{ token: string }> {
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        message: prompt,
        stream: true,
      }),
      signal: ctx.signal,
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.event_type === 'text-generation' && data.text) {
              yield { token: data.text };
            }
          } catch {}
        }
      }
    }
  }
  
  estimateCost(inTok: number, outTok: number): number {
    return (inTok * 0.0005 + outTok * 0.0015) / 1000;
  }
}