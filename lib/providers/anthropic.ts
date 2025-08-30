import { BaseProvider } from './base';

export class AnthropicProvider extends BaseProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  private apiKey = process.env.ANTHROPIC_API_KEY || '';
  
  async *send(prompt: string, ctx: { signal?: AbortSignal }): AsyncGenerator<{ token: string }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 2048,
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
            if (data.type === 'content_block_delta') {
              const token = data.delta?.text;
              if (token) yield { token };
            }
          } catch {}
        }
      }
    }
  }
  
  estimateCost(inTok: number, outTok: number): number {
    return (inTok * 0.00025 + outTok * 0.00125) / 1000;
  }
}