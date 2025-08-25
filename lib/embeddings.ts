// Embedding utilities for context optimization
export interface EmbeddingChunk {
  id: string;
  content: string;
  embedding?: number[];
  tokens: number;
  relevanceScore?: number;
}

export interface EmbeddingConfig {
  provider: 'openai' | 'local' | 'mock';
  model: string;
  dimensions: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  provider: 'mock',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxTokens: 8192
};

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (this.config.provider === 'openai' && process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            input: text,
            model: this.config.model
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
      } catch (error) {
        console.error('OpenAI embedding error:', error);
        return this.generateMockEmbedding(text);
      }
    }

    return this.generateMockEmbedding(text);
  }

  private generateMockEmbedding(text: string): number[] {
    // Simple hash-based mock embedding for development
    const hash = this.simpleHash(text);
    const embedding = new Array(this.config.dimensions);
    
    for (let i = 0; i < this.config.dimensions; i++) {
      embedding[i] = ((hash * (i + 1)) % 1000) / 1000 - 0.5;
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async generateChunkEmbeddings(chunks: EmbeddingChunk[]): Promise<EmbeddingChunk[]> {
    const embeddings = await Promise.all(
      chunks.map(chunk => this.generateEmbedding(chunk.content))
    );

    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index]
    }));
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async findMostRelevant(
    query: string,
    chunks: EmbeddingChunk[],
    limit: number = 10
  ): Promise<EmbeddingChunk[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const scoredChunks = chunks.map(chunk => ({
      ...chunk,
      relevanceScore: chunk.embedding 
        ? this.calculateSimilarity(queryEmbedding, chunk.embedding)
        : 0
    }));

    return scoredChunks
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
  }
}

export const embeddingService = new EmbeddingService();