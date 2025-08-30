import { BaseProvider } from './base';

export class OpenAIProvider extends BaseProvider {
  id = 'openai';
  name = 'OpenAI';
  private apiKey = process.env.OPENAI_API_KEY || '';
  
  async *send(prompt: string, ctx: { signal?: AbortSignal }): AsyncGenerator<{ token: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
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
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.choices?.[0]?.delta?.content;
            if (token) yield { token };
          } catch {}
        }
      }
    }
  }
  
  estimateCost(inTok: number, outTok: number): number {
    return (inTok * 0.0005 + outTok * 0.0015) / 1000;
  }
}