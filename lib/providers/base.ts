export interface ProviderAdapter {
  id: string;
  name: string;
  send: (prompt: string, ctx: { signal?: AbortSignal }) => AsyncGenerator<{ token: string }>;
  estimateCost?: (inTok: number, outTok: number) => number;
  requiresKyc?: boolean;
  healthCheck: () => Promise<boolean>;
  isSovereign?: boolean; // 🏠 House Prep: Flag for local models
}

export abstract class BaseProvider implements ProviderAdapter {
  abstract id: string;
  abstract name: string;
  abstract send(prompt: string, ctx: { signal?: AbortSignal }): AsyncGenerator<{ token: string }>;
  isSovereign = false; // Default to cloud-based
  
  async healthCheck(): Promise<boolean> {
    try {
      const testGen = this.send("test", { signal: AbortSignal.timeout(5000) });
      await testGen.next();
      return true;
    } catch {
      return false;
    }
  }
  
  estimateCost(inTok: number, outTok: number): number {
    // Sovereign models have zero API cost
    if (this.isSovereign) return 0;
    return (inTok * 0.001 + outTok * 0.002) / 1000; // Default pricing
  }
}