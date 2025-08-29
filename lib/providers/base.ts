export interface TokenChunk {
  content: string;
  model: string;
  timestamp: number;
}

export interface ProviderAdapter {
  id: string;
  send: (prompt: string, ctx: { model: string; signal?: AbortSignal }) => AsyncGenerator<{ token: string }>;
  estimateCost?: (inputTokens: number, outputTokens: number) => number;
  requiresKyc?: boolean;
}