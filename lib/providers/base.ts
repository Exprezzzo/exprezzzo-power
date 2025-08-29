export interface TokenChunk {
  content: string
  model: string
  timestamp: number
}

export abstract class ProviderAdapter {
  abstract name: string
  abstract models: string[]
  
  abstract async *send(prompt: string, model: string): AsyncGenerator<TokenChunk>
  abstract calculateCost(tokens: number, model: string): number
  
  async healthCheck(): Promise<boolean> {
    try {
      const generator = this.send('test', this.models[0])
      await generator.next()
      return true
    } catch {
      return false
    }
  }
}