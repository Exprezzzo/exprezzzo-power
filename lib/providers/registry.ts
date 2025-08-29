import { ProviderAdapter } from './base'

class ProviderRegistry {
  private providers = new Map<string, ProviderAdapter>()
  private circuitBreakers = new Map<string, { failures: number; lastFail: number }>()
  
  register(name: string, adapter: ProviderAdapter) {
    this.providers.set(name, adapter)
  }
  
  async getWithFallback(
    model: string,
    prompt: string,
    fallbackChain: string[] = []
  ): AsyncGenerator<any> {
    const primary = this.providers.get(model)
    
    if (!primary) {
      throw new Error(`Provider ${model} not found`)
    }
    
    // Check circuit breaker
    const breaker = this.circuitBreakers.get(model)
    if (breaker && breaker.failures >= 2) {
      const timeSinceLastFail = Date.now() - breaker.lastFail
      if (timeSinceLastFail < 5 * 60 * 1000) { // 5 minutes
        // Try fallback
        if (fallbackChain.length > 0) {
          return this.getWithFallback(fallbackChain[0], prompt, fallbackChain.slice(1))
        }
        throw new Error('All providers failed')
      }
    }
    
    try {
      return primary.send(prompt, model)
    } catch (error) {
      // Record failure
      const current = this.circuitBreakers.get(model) || { failures: 0, lastFail: 0 }
      this.circuitBreakers.set(model, {
        failures: current.failures + 1,
        lastFail: Date.now()
      })
      
      // Try fallback
      if (fallbackChain.length > 0) {
        return this.getWithFallback(fallbackChain[0], prompt, fallbackChain.slice(1))
      }
      
      throw error
    }
  }
}

export const registry = new ProviderRegistry()