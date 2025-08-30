export class CostTracker {
  private static instance: CostTracker;
  private costs: Map<string, number> = new Map();
  private sovereignSavings = 0; // 🏠 Track savings from sovereign usage
  
  static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }
  
  trackUsage(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);
    
    // 🏠 House Prep: Track sovereign savings
    if (provider === 'kani') {
      // Calculate what it would have cost with GPT-4
      const cloudCost = this.calculateCost('openai', 'gpt-4', inputTokens, outputTokens);
      this.sovereignSavings += cloudCost;
      console.log(`🏠 Saved ${cloudCost.toFixed(4)} by using sovereign model`);
    }
    
    const current = this.costs.get(provider) || 0;
    this.costs.set(provider, current + cost);
    
    console.log(`💰 Cost: ${cost.toFixed(4)} (${provider}/${model})`);
    return cost;
  }
  
  calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    // 🏠 Sovereign models are free
    if (provider === 'kani') return 0;
    
    // Cloud model pricing per 1M tokens
    const pricing: Record<string, { input: number; output: number }> = {
      'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
      'openai/gpt-4': { input: 30.00, output: 60.00 },
      'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
      'cohere/command': { input: 0.50, output: 1.50 },
      'replicate/llama-2-70b': { input: 0.65, output: 2.75 },
    };
    
    const key = `${provider}/${model}`;
    const rates = pricing[key] || { input: 1.00, output: 2.00 };
    
    return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  }
  
  getTotalCost(): number {
    return Array.from(this.costs.values()).reduce((sum, cost) => sum + cost, 0);
  }
  
  getSovereignSavings(): number {
    return this.sovereignSavings; // 🏠 House Prep
  }
  
  getMetrics() {
    return {
      totalCost: this.getTotalCost(),
      providerCosts: Object.fromEntries(this.costs),
      sovereignSavings: this.sovereignSavings, // 🏠
      savingsVsGPT4: this.calculateSavingsVsGPT4(),
    };
  }
  
  private calculateSavingsVsGPT4(): number {
    // Calculate Robin Hood savings
    const actualCost = this.getTotalCost();
    const estimatedGPT4Cost = actualCost * 2.5; // GPT-4 is ~2.5x more expensive
    return estimatedGPT4Cost - actualCost + this.sovereignSavings;
  }
}