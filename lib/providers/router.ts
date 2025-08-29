import { ProviderAdapter } from "./base";
import { OpenAIAdapter } from "./openai";
import { DeepSeekAdapter } from "./deepseek";

export class ProviderRouter {
  private providers = new Map<string, ProviderAdapter>();
  private circuitBreakers = new Map<string, { failures: number; lastFail: number }>();
  
  constructor() {
    this.providers.set("openai", new OpenAIAdapter());
    this.providers.set("deepseek", new DeepSeekAdapter());
  }
  
  async *route(model: string, prompt: string, fallbackChain: string[] = []): AsyncGenerator<{ token: string }> {
    const provider = this.providers.get(model.split("/")[0]);
    if (!provider) throw new Error(`Provider ${model} not found`);
    
    const breaker = this.circuitBreakers.get(provider.id);
    if (breaker && breaker.failures >= 2 && Date.now() - breaker.lastFail < 300000) {
      if (fallbackChain.length > 0) {
        yield* this.route(fallbackChain[0], prompt, fallbackChain.slice(1));
        return;
      }
      throw new Error("All providers failed");
    }
    
    try {
      yield* provider.send(prompt, { model });
    } catch (error) {
      const current = this.circuitBreakers.get(provider.id) || { failures: 0, lastFail: 0 };
      this.circuitBreakers.set(provider.id, {
        failures: current.failures + 1,
        lastFail: Date.now()
      });
      
      if (fallbackChain.length > 0) {
        yield* this.route(fallbackChain[0], prompt, fallbackChain.slice(1));
      } else {
        throw error;
      }
    }
  }
}

export const router = new ProviderRouter();