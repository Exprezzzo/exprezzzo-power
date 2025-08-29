export interface ProviderAdapter {
  id: string;
  send: (prompt: string, ctx: { model: string; signal?: AbortSignal }) => AsyncGenerator<{ token: string }>;
  estimateCost?: (i: number, o: number) => number;
  requiresKyc?: boolean;
}

export class ProviderRouter {
  private providers = new Map<string, ProviderAdapter>();
  private breakers = new Map<string, { failures: number; lastFail: number }>();

  async *route(model: string, prompt: string, fallback: string[] = []): AsyncGenerator<{ token: string }> {
    const providerId = model.split("/")[0];
    const provider = this.providers.get(providerId);
    
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    
    const breaker = this.breakers.get(providerId);
    if (breaker && breaker.failures >= 2 && Date.now() - breaker.lastFail < 300000) {
      if (fallback.length > 0) yield* this.route(fallback[0], prompt, fallback.slice(1));
      else throw new Error("All providers failed");
    }
    
    try {
      yield* provider.send(prompt, { model });
    } catch (error) {
      this.breakers.set(providerId, {
        failures: (this.breakers.get(providerId)?.failures || 0) + 1,
        lastFail: Date.now()
      });
      
      if (fallback.length > 0) yield* this.route(fallback[0], prompt, fallback.slice(1));
      else throw error;
    }
  }
}

export const router = new ProviderRouter();