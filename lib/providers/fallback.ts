// Intelligent provider fallback system
export class ProviderFallback {
  private providers: string[] = ['groq', 'openai', 'anthropic', 'gemini'];
  private failures: Map<string, number> = new Map();
  private lastReset: number = Date.now();
  private readonly resetInterval = 5 * 60 * 1000; // 5 minutes
  
  constructor(customOrder?: string[]) {
    if (customOrder) {
      this.providers = customOrder;
    }
  }
  
  // Get next provider to try
  getNextProvider(exclude: string[] = []): string | null {
    this.resetFailuresIfNeeded();
    
    const availableProviders = this.providers.filter(provider => 
      !exclude.includes(provider) && 
      this.getFailureCount(provider) < 3 // Max 3 failures before temporary exclusion
    );
    
    if (availableProviders.length === 0) {
      return null; // All providers exhausted
    }
    
    // Sort by failure count (ascending)
    availableProviders.sort((a, b) => 
      this.getFailureCount(a) - this.getFailureCount(b)
    );
    
    return availableProviders[0];
  }
  
  // Record a failure for a provider
  recordFailure(provider: string): void {
    const currentFailures = this.getFailureCount(provider);
    this.failures.set(provider, currentFailures + 1);
    console.warn(`Provider ${provider} failed. Total failures: ${currentFailures + 1}`);
  }
  
  // Record a success for a provider (optional - could be used to boost priority)
  recordSuccess(provider: string): void {
    // Reset failures on success
    this.failures.set(provider, 0);
    console.log(`Provider ${provider} succeeded. Failures reset.`);
  }
  
  // Get failure count for a provider
  private getFailureCount(provider: string): number {
    return this.failures.get(provider) || 0;
  }
  
  // Reset failure counts periodically
  private resetFailuresIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastReset > this.resetInterval) {
      console.log('Resetting provider failure counts');
      this.failures.clear();
      this.lastReset = now;
    }
  }
  
  // Get current provider status
  getProviderStatus(): Record<string, number> {
    this.resetFailuresIfNeeded();
    const status: Record<string, number> = {};
    
    for (const provider of this.providers) {
      status[provider] = this.getFailureCount(provider);
    }
    
    return status;
  }
  
  // Check if any providers are available
  hasAvailableProviders(): boolean {
    return this.providers.some(provider => this.getFailureCount(provider) < 3);
  }
}