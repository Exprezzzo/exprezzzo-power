/**
 * 🏠 HOUSE PREP: EXPRESSO LLM HOUSE Connector
 * This service will handle communication with the sovereign LLM House
 * Currently stubbed - will be activated when HOUSE is deployed
 */

import { getSovereignConfig, isSovereignMode } from '@/lib/flags';

export class HouseConnector {
  private static instance: HouseConnector;
  private config = getSovereignConfig();
  private isConnected = false;
  
  private constructor() {
    if (isSovereignMode()) {
      this.initialize();
    }
  }
  
  static getInstance(): HouseConnector {
    if (!HouseConnector.instance) {
      HouseConnector.instance = new HouseConnector();
    }
    return HouseConnector.instance;
  }
  
  private async initialize() {
    if (!this.config) return;
    
    try {
      // 🏠 Future: Establish WebSocket connection to HOUSE
      console.log('🏠 HOUSE PREP: Ready for sovereign LLM connection');
      console.log(`  Endpoint: ${this.config.endpoint}`);
      console.log(`  Model: ${this.config.model}`);
      
      // Test connection (will fail until HOUSE is running)
      const response = await fetch(`${this.config.endpoint}/health`, {
        signal: AbortSignal.timeout(1000),
      }).catch(() => null);
      
      this.isConnected = response?.ok || false;
      
      if (this.isConnected) {
        console.log('🏠 Connected to EXPRESSO LLM HOUSE!');
      } else {
        console.log('🏠 HOUSE not yet deployed (normal for launch)');
      }
    } catch (error) {
      console.log('🏠 HOUSE connection deferred until deployment');
    }
  }
  
  async query(prompt: string): Promise<AsyncGenerator<string>> {
    if (!this.isConnected || !this.config) {
      // Return stub response
      return this.stubResponse();
    }
    
    // 🏠 Future: Stream from HOUSE WebSocket
    return this.streamFromHouse(prompt);
  }
  
  private async *stubResponse(): AsyncGenerator<string> {
    yield "🏠 [HOUSE PREP: Sovereign model will be available when EXPRESSO LLM HOUSE is deployed]";
  }
  
  private async *streamFromHouse(prompt: string): AsyncGenerator<string> {
    // 🏠 Future implementation
    const response = await fetch(`${this.config!.endpoint}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        max_tokens: this.config!.maxTokens,
        temperature: this.config!.temperature,
        stream: true,
      }),
    });
    
    // Stream response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) throw new Error('No response from HOUSE');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  }
  
  getStatus() {
    return {
      mode: isSovereignMode() ? 'sovereign' : 'cloud',
      connected: this.isConnected,
      endpoint: this.config?.endpoint || 'not configured',
      model: this.config?.model || 'not configured',
    };
  }
}