export class ProviderRouter {
  private providers = ['openai', 'anthropic']; // Ordered priority, excluding kani
  
  async *routeRequest(prompt: string): AsyncGenerator<{ token: string }> {
    let lastError: Error | null = null;
    
    for (const providerId of this.providers) {
      try {
        console.log(`Attempting provider: ${providerId}`);
        
        // Mock provider calls - replace with actual implementations
        if (providerId === 'openai') {
          for (const word of prompt.split(' ')) {
            yield { token: word + ' ' };
            await new Promise(r => setTimeout(r, 50));
          }
          return;
        } else if (providerId === 'anthropic') {
          yield { token: 'Claude response: ' };
          for (const word of prompt.split(' ')) {
            yield { token: word + ' ' };
            await new Promise(r => setTimeout(r, 50));
          }
          return;
        }
        
      } catch (error) {
        console.error(`Provider ${providerId} failed:`, error);
        lastError = error as Error;
        continue; // Try next provider
      }
    }
    
    // All providers failed
    throw lastError || new Error('All providers unavailable');
  }
}