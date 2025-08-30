/**
 * 🏠 HOUSE PREP: Kani Sovereign LLM Provider
 * This is a placeholder for EXPRESSO LLM HOUSE integration
 * Will connect to local sovereign model when HOUSE is deployed
 * Currently returns stub responses - activate with NEXT_PUBLIC_ENABLE_SOVEREIGN=true
 */

import { BaseProvider } from './base';

export class KaniProvider extends BaseProvider {
  id = 'kani';
  name = 'Kani (Sovereign LLM)';
  isSovereign = true; // Local model, no API costs
  
  async *send(prompt: string, ctx: { signal?: AbortSignal }): AsyncGenerator<{ token: string }> {
    // 🏠 Future: Connect to local EXPRESSO LLM HOUSE endpoint
    // For now, return a stub response
    const stubResponse = '[🏠 HOUSE PREP: Sovereign Kani model will process locally when EXPRESSO LLM HOUSE is deployed]';
    
    for (const char of stubResponse) {
      yield { token: char };
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming
    }
  }
  
  async healthCheck(): Promise<boolean> {
    // 🏠 Future: Check if HOUSE server is running
    // For now, return false unless explicitly testing
    return process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN === 'true' && 
           process.env.NODE_ENV === 'development';
  }
  
  estimateCost(): number {
    return 0; // Sovereign models have zero API cost
  }
}