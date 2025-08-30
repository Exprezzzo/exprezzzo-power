import { ProviderAdapter } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { KaniProvider } from './kani'; // 🏠 House Prep
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;
    
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

export class ProviderRouter {
  private providers: Map<string, ProviderAdapter> = new Map();
  private fallbackChain: string[] = [];
  private metrics: Map<string, { failures: number; lastFailure: Date }> = new Map();
  private db = getApps().length ? getFirestore() : null;
  
  constructor() {
    // 🚀 Launch Now: Core providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    
    // 🏠 House Prep: Sovereign provider (only if enabled)
    if (process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN === 'true') {
      this.providers.set('kani', new KaniProvider());
      this.fallbackChain = ['kani', 'openai', 'anthropic']; // Prefer sovereign
    } else {
      this.fallbackChain = ['openai', 'anthropic'];
    }
  }
  
  async *routeRequest(
    prompt: string, 
    preferredProvider?: string
  ): AsyncGenerator<{ token: string }> {
    const chain = preferredProvider 
      ? [preferredProvider, ...this.fallbackChain.filter(p => p !== preferredProvider)]
      : this.fallbackChain;
    
    for (const providerId of chain) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
        
        // Log if using sovereign model
        if (provider.isSovereign) {
          console.log('🏠 Using sovereign Kani model (zero API cost)');
        }
        
        yield* provider.send(prompt, { signal: controller.signal });
        
        clearTimeout(timeout);
        await this.logSuccess(providerId, provider.isSovereign);
        return;
        
      } catch (error) {
        await this.logFailure(providerId, error as Error);
        console.error(`Provider ${providerId} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All providers failed');
  }
  
  private async logSuccess(providerId: string, isSovereign: boolean = false) {
    try {
      if (!this.db) return;
      await this.db.collection('provider_metrics').add({
        provider: providerId,
        status: 'success',
        isSovereign, // 🏠 Track sovereign usage
        timestamp: new Date(),
      });
      this.metrics.delete(providerId);
    } catch {}
  }
  
  private async logFailure(providerId: string, error: Error) {
    try {
      const current = this.metrics.get(providerId) || { failures: 0, lastFailure: new Date() };
      current.failures++;
      current.lastFailure = new Date();
      this.metrics.set(providerId, current);
      
      if (!this.db) return;
      await this.db.collection('provider_metrics').add({
        provider: providerId,
        status: 'failure',
        error: error.message,
        timestamp: new Date(),
        consecutiveFailures: current.failures,
      });
    } catch {}
  }
  
  getHealthStatus() {
    return {
      providers: Array.from(this.providers.keys()),
      metrics: Object.fromEntries(this.metrics),
      sovereignEnabled: process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN === 'true', // 🏠
    };
  }
}