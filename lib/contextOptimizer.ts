// lib/contextOptimizer.ts
// Intelligent context pruning algorithms with relevance scoring and automatic summarization

import { ModelId } from '@/types/ai-playground';

export interface ContextItem {
  id: string;
  content: string;
  type: 'message' | 'file' | 'summary' | 'reference' | 'note';
  priority: number;
  tokens: number;
  relevanceScore?: number;
  embedding?: number[];
  source: string;
  sessionId?: string;
  timestamp: Date;
  tags?: string[];
  compressed?: boolean;
  originalLength?: number;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  tokensSaved: number;
  itemsAffected: number;
  actions: Array<{
    type: 'remove' | 'compress' | 'summarize' | 'merge';
    itemIds: string[];
    reason: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

export interface OptimizationResult {
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  compressionRatio: number;
  strategies: OptimizationStrategy[];
  optimizedItems: ContextItem[];
  summary: string;
}

const MAX_CONTEXT_TOKENS = 200000;
const IDEAL_CONTEXT_TOKENS = 150000;
const SUMMARIZATION_CHUNK_SIZE = 4000;
const MIN_RELEVANCE_SCORE = 0.3;
const RECENCY_DECAY_FACTOR = 0.1;

export class ContextOptimizer {
  private openaiApiKey?: string;
  private anthropicApiKey?: string;

  constructor(apiKeys?: { openai?: string; anthropic?: string }) {
    this.openaiApiKey = apiKeys?.openai;
    this.anthropicApiKey = apiKeys?.anthropic;
  }

  /**
   * Analyze context and generate optimization strategies
   */
  public async analyzeContext(items: ContextItem[]): Promise<OptimizationStrategy[]> {
    const strategies: OptimizationStrategy[] = [];
    const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0);

    if (totalTokens <= IDEAL_CONTEXT_TOKENS) {
      return strategies; // No optimization needed
    }

    // Strategy 1: Remove low-relevance items
    const lowRelevanceStrategy = this.generateLowRelevanceRemovalStrategy(items);
    if (lowRelevanceStrategy.tokensSaved > 0) {
      strategies.push(lowRelevanceStrategy);
    }

    // Strategy 2: Compress old messages
    const compressionStrategy = this.generateCompressionStrategy(items);
    if (compressionStrategy.tokensSaved > 0) {
      strategies.push(compressionStrategy);
    }

    // Strategy 3: Summarize conversation chunks
    const summarizationStrategy = this.generateSummarizationStrategy(items);
    if (summarizationStrategy.tokensSaved > 0) {
      strategies.push(summarizationStrategy);
    }

    // Strategy 4: Merge similar content
    const mergeStrategy = this.generateMergeStrategy(items);
    if (mergeStrategy.tokensSaved > 0) {
      strategies.push(mergeStrategy);
    }

    return strategies.sort((a, b) => b.tokensSaved - a.tokensSaved);
  }

  /**
   * Apply optimization strategies to context
   */
  public async optimizeContext(
    items: ContextItem[], 
    targetTokens: number = IDEAL_CONTEXT_TOKENS,
    strategies?: string[]
  ): Promise<OptimizationResult> {
    const originalTokens = items.reduce((sum, item) => sum + item.tokens, 0);
    const availableStrategies = await this.analyzeContext(items);
    
    let optimizedItems = [...items];
    let appliedStrategies: OptimizationStrategy[] = [];
    let currentTokens = originalTokens;

    // Apply strategies in order of effectiveness
    for (const strategy of availableStrategies) {
      if (currentTokens <= targetTokens) break;
      
      if (!strategies || strategies.includes(strategy.name)) {
        const result = await this.applyStrategy(optimizedItems, strategy);
        optimizedItems = result.items;
        currentTokens = optimizedItems.reduce((sum, item) => sum + item.tokens, 0);
        appliedStrategies.push({
          ...strategy,
          tokensSaved: originalTokens - currentTokens
        });
      }
    }

    const tokensSaved = originalTokens - currentTokens;
    const compressionRatio = currentTokens / originalTokens;

    return {
      originalTokens,
      optimizedTokens: currentTokens,
      tokensSaved,
      compressionRatio,
      strategies: appliedStrategies,
      optimizedItems,
      summary: this.generateOptimizationSummary(appliedStrategies, tokensSaved)
    };
  }

  /**
   * Smart context truncation that preserves important content
   */
  public smartTruncate(items: ContextItem[], maxTokens: number): ContextItem[] {
    // Sort by importance score (combination of priority, relevance, and recency)
    const scoredItems = items.map(item => ({
      ...item,
      importanceScore: this.calculateImportanceScore(item)
    })).sort((a, b) => b.importanceScore - a.importanceScore);

    const result: ContextItem[] = [];
    let currentTokens = 0;

    // Always include high-priority items first
    for (const item of scoredItems) {
      if (currentTokens + item.tokens <= maxTokens || item.priority >= 90) {
        result.push(item);
        currentTokens += item.tokens;
      } else if (currentTokens < maxTokens * 0.9) {
        // Try to compress the item if we have some room left
        const compressed = this.compressContent(item.content);
        const compressedTokens = this.estimateTokens(compressed);
        
        if (currentTokens + compressedTokens <= maxTokens) {
          result.push({
            ...item,
            content: compressed,
            tokens: compressedTokens,
            compressed: true,
            originalLength: item.tokens
          });
          currentTokens += compressedTokens;
        }
      }
    }

    return result;
  }

  /**
   * Generate relevance scores for context items based on query
   */
  public async generateRelevanceScores(
    items: ContextItem[],
    query: string,
    recentContext?: string[]
  ): Promise<ContextItem[]> {
    // Simple implementation - in production, you'd use embeddings
    const queryWords = this.extractKeywords(query.toLowerCase());
    const contextWords = recentContext 
      ? this.extractKeywords(recentContext.join(' ').toLowerCase())
      : [];

    return items.map(item => {
      const itemWords = this.extractKeywords(item.content.toLowerCase());
      
      // Calculate word overlap
      const queryOverlap = queryWords.filter(word => itemWords.includes(word)).length;
      const contextOverlap = contextWords.filter(word => itemWords.includes(word)).length;
      
      // Base relevance on overlap and item type
      let relevanceScore = (queryOverlap * 2 + contextOverlap) / (queryWords.length + contextWords.length + 1);
      
      // Boost certain types
      if (item.type === 'reference' || item.type === 'summary') {
        relevanceScore *= 1.3;
      }
      
      // Boost high-priority items
      relevanceScore *= (item.priority / 50);
      
      // Decay based on age
      const ageInHours = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60);
      const recencyMultiplier = Math.exp(-ageInHours * RECENCY_DECAY_FACTOR);
      relevanceScore *= recencyMultiplier;

      return {
        ...item,
        relevanceScore: Math.min(1, Math.max(0, relevanceScore))
      };
    });
  }

  /**
   * Summarize a chunk of context
   */
  public async summarizeContext(
    items: ContextItem[],
    modelId: ModelId = 'gpt-3.5-turbo'
  ): Promise<string> {
    const content = items.map(item => 
      `[${item.type.toUpperCase()}] ${item.content}`
    ).join('\n\n');

    const prompt = `Please provide a concise summary of the following context, preserving key information and decisions:

${content}

Summary:`;

    try {
      // This would call the actual model API
      const summary = await this.callModelForSummarization(prompt, modelId);
      return summary;
    } catch (error) {
      console.error('Summarization failed:', error);
      // Fallback: simple truncation with key points
      return this.extractKeyPoints(content);
    }
  }

  /**
   * Estimate token count for text
   */
  public estimateTokens(text: string): number {
    // More accurate estimation considering various text types
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    // Code and structured data tend to have more tokens per word
    const hasCode = /[{}();=<>]/.test(text);
    const hasStructuredData = /[:\[\]{}",]/.test(text);
    
    let multiplier = 1.3; // Base multiplier
    
    if (hasCode) multiplier += 0.2;
    if (hasStructuredData) multiplier += 0.1;
    
    // Use the more conservative estimate
    return Math.ceil(Math.max(words * multiplier, characters / 3.5));
  }

  /**
   * Count tokens in context items
   */
  public countTotalTokens(items: ContextItem[]): number {
    return items.reduce((total, item) => total + item.tokens, 0);
  }

  /**
   * Find duplicate or similar content
   */
  public findDuplicateContent(items: ContextItem[]): Array<{
    similarItems: string[];
    similarity: number;
    tokensSaved: number;
  }> {
    const duplicates: Array<{
      similarItems: string[];
      similarity: number;
      tokensSaved: number;
    }> = [];

    for (let i = 0; i < items.length - 1; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const similarity = this.calculateTextSimilarity(items[i].content, items[j].content);
        
        if (similarity > 0.8) {
          const smallerItem = items[i].tokens < items[j].tokens ? items[i] : items[j];
          duplicates.push({
            similarItems: [items[i].id, items[j].id],
            similarity,
            tokensSaved: smallerItem.tokens
          });
        }
      }
    }

    return duplicates.sort((a, b) => b.tokensSaved - a.tokensSaved);
  }

  // Private helper methods

  private generateLowRelevanceRemovalStrategy(items: ContextItem[]): OptimizationStrategy {
    const lowRelevanceItems = items.filter(item => 
      (item.relevanceScore ?? 0.5) < MIN_RELEVANCE_SCORE && 
      item.priority < 40 &&
      item.type !== 'reference'
    );

    const tokensSaved = lowRelevanceItems.reduce((sum, item) => sum + item.tokens, 0);

    return {
      name: 'low-relevance-removal',
      description: 'Remove items with low relevance scores',
      tokensSaved,
      itemsAffected: lowRelevanceItems.length,
      actions: [{
        type: 'remove',
        itemIds: lowRelevanceItems.map(item => item.id),
        reason: 'Low relevance score and priority',
        impact: 'low'
      }]
    };
  }

  private generateCompressionStrategy(items: ContextItem[]): OptimizationStrategy {
    const oldMessages = items.filter(item => {
      const ageInHours = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60);
      return item.type === 'message' && ageInHours > 24 && !item.compressed;
    });

    const tokensSaved = Math.floor(oldMessages.reduce((sum, item) => sum + item.tokens * 0.4, 0));

    return {
      name: 'message-compression',
      description: 'Compress old messages to save space',
      tokensSaved,
      itemsAffected: oldMessages.length,
      actions: [{
        type: 'compress',
        itemIds: oldMessages.map(item => item.id),
        reason: 'Messages older than 24 hours',
        impact: 'medium'
      }]
    };
  }

  private generateSummarizationStrategy(items: ContextItem[]): OptimizationStrategy {
    const messageGroups = this.groupMessagesBySession(items);
    const candidateGroups = messageGroups.filter(group => {
      const totalTokens = group.reduce((sum, item) => sum + item.tokens, 0);
      return totalTokens > SUMMARIZATION_CHUNK_SIZE && group.length > 5;
    });

    const tokensSaved = Math.floor(candidateGroups.reduce((sum, group) => 
      sum + group.reduce((groupSum, item) => groupSum + item.tokens, 0) * 0.7, 0
    ));

    const affectedItems = candidateGroups.flat();

    return {
      name: 'conversation-summarization',
      description: 'Summarize long conversation chunks',
      tokensSaved,
      itemsAffected: affectedItems.length,
      actions: [{
        type: 'summarize',
        itemIds: affectedItems.map(item => item.id),
        reason: 'Long conversation sequences',
        impact: 'high'
      }]
    };
  }

  private generateMergeStrategy(items: ContextItem[]): OptimizationStrategy {
    const duplicates = this.findDuplicateContent(items);
    const tokensSaved = duplicates.reduce((sum, dup) => sum + dup.tokensSaved, 0);

    return {
      name: 'duplicate-merging',
      description: 'Merge duplicate or very similar content',
      tokensSaved,
      itemsAffected: duplicates.length * 2,
      actions: duplicates.map(dup => ({
        type: 'merge' as const,
        itemIds: dup.similarItems,
        reason: `${Math.round(dup.similarity * 100)}% similarity`,
        impact: 'low' as const
      }))
    };
  }

  private async applyStrategy(items: ContextItem[], strategy: OptimizationStrategy): Promise<{
    items: ContextItem[];
    tokensSaved: number;
  }> {
    let optimizedItems = [...items];
    let totalTokensSaved = 0;

    for (const action of strategy.actions) {
      switch (action.type) {
        case 'remove':
          optimizedItems = optimizedItems.filter(item => !action.itemIds.includes(item.id));
          totalTokensSaved += action.itemIds.reduce((sum, id) => {
            const item = items.find(i => i.id === id);
            return sum + (item?.tokens || 0);
          }, 0);
          break;

        case 'compress':
          optimizedItems = optimizedItems.map(item => {
            if (action.itemIds.includes(item.id)) {
              const compressed = this.compressContent(item.content);
              const newTokens = this.estimateTokens(compressed);
              totalTokensSaved += item.tokens - newTokens;
              return {
                ...item,
                content: compressed,
                tokens: newTokens,
                compressed: true,
                originalLength: item.tokens
              };
            }
            return item;
          });
          break;

        case 'summarize':
          const itemsToSummarize = optimizedItems.filter(item => action.itemIds.includes(item.id));
          if (itemsToSummarize.length > 0) {
            const summary = await this.summarizeContext(itemsToSummarize);
            const summaryTokens = this.estimateTokens(summary);
            const originalTokens = itemsToSummarize.reduce((sum, item) => sum + item.tokens, 0);
            
            // Remove original items and add summary
            optimizedItems = optimizedItems.filter(item => !action.itemIds.includes(item.id));
            optimizedItems.push({
              id: `summary_${Date.now()}`,
              content: summary,
              type: 'summary',
              priority: 85,
              tokens: summaryTokens,
              source: 'optimizer',
              timestamp: new Date(),
              tags: ['auto-generated', 'summary'],
              compressed: false
            });
            
            totalTokensSaved += originalTokens - summaryTokens;
          }
          break;

        case 'merge':
          // Simple merge: keep the item with higher priority
          const itemsToMerge = optimizedItems.filter(item => action.itemIds.includes(item.id));
          if (itemsToMerge.length > 1) {
            const keepItem = itemsToMerge.reduce((best, current) => 
              current.priority > best.priority ? current : best
            );
            const mergedContent = itemsToMerge.map(item => item.content).join('\n---\n');
            const mergedTokens = this.estimateTokens(mergedContent);
            
            optimizedItems = optimizedItems.filter(item => !action.itemIds.includes(item.id));
            optimizedItems.push({
              ...keepItem,
              content: mergedContent,
              tokens: mergedTokens,
              tags: [...(keepItem.tags || []), 'merged']
            });
            
            const originalTokens = itemsToMerge.reduce((sum, item) => sum + item.tokens, 0);
            totalTokensSaved += originalTokens - mergedTokens;
          }
          break;
      }
    }

    return { items: optimizedItems, tokensSaved: totalTokensSaved };
  }

  private calculateImportanceScore(item: ContextItem): number {
    let score = item.priority / 100; // Base score from priority (0-1)
    
    // Relevance boost
    if (item.relevanceScore) {
      score *= (0.5 + item.relevanceScore);
    }
    
    // Type boost
    const typeMultipliers = {
      reference: 1.3,
      summary: 1.2,
      file: 1.1,
      note: 1.0,
      message: 0.9
    };
    score *= typeMultipliers[item.type] || 1.0;
    
    // Recency factor
    const ageInHours = (Date.now() - item.timestamp.getTime()) / (1000 * 60 * 60);
    const recencyMultiplier = Math.exp(-ageInHours * RECENCY_DECAY_FACTOR);
    score *= (0.7 + 0.3 * recencyMultiplier);
    
    return score;
  }

  private compressContent(content: string): string {
    // Simple compression: remove extra whitespace, shorten common phrases
    return content
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, 
               (match) => match.charAt(0)) // Common words to first letter
      .trim();
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'they', 'them', 'their', 'there', 'where',
      'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose'
    ]);
    return stopWords.has(word);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private groupMessagesBySession(items: ContextItem[]): ContextItem[][] {
    const groups = new Map<string, ContextItem[]>();
    
    items.filter(item => item.type === 'message').forEach(item => {
      const sessionId = item.sessionId || 'default';
      if (!groups.has(sessionId)) {
        groups.set(sessionId, []);
      }
      groups.get(sessionId)!.push(item);
    });
    
    return Array.from(groups.values());
  }

  private extractKeyPoints(content: string): string {
    // Extract sentences that seem important (contain keywords, questions, conclusions)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const importantSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('important') || 
             lower.includes('key') || 
             lower.includes('main') ||
             lower.includes('conclusion') ||
             lower.includes('result') ||
             lower.includes('because') ||
             lower.includes('therefore') ||
             sentence.includes('?');
    });

    return importantSentences.slice(0, 5).join('. ') + '.';
  }

  private generateOptimizationSummary(strategies: OptimizationStrategy[], tokensSaved: number): string {
    if (strategies.length === 0) return 'No optimization was needed.';
    
    const strategyDescriptions = strategies.map(s => 
      `${s.name.replace('-', ' ')}: ${s.tokensSaved} tokens saved`
    ).join(', ');
    
    return `Optimized context by ${tokensSaved} tokens using: ${strategyDescriptions}.`;
  }

  private async callModelForSummarization(prompt: string, modelId: ModelId): Promise<string> {
    // This would integrate with your actual model API
    // For now, return a placeholder
    return `[AI Summary of ${prompt.length} characters of content]`;
  }
}

// Export singleton instance
export const contextOptimizer = new ContextOptimizer({
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY
});

// Utility functions
export function createContextItem(
  content: string,
  type: ContextItem['type'],
  source: string,
  options?: Partial<Omit<ContextItem, 'id' | 'content' | 'type' | 'source' | 'timestamp' | 'tokens'>>
): ContextItem {
  return {
    id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    source,
    priority: options?.priority ?? 50,
    tokens: contextOptimizer.estimateTokens(content),
    relevanceScore: options?.relevanceScore,
    embedding: options?.embedding,
    sessionId: options?.sessionId,
    timestamp: new Date(),
    tags: options?.tags || [],
    compressed: false
  };
}

export function validateContextLimit(items: ContextItem[], maxTokens: number = MAX_CONTEXT_TOKENS): {
  withinLimit: boolean;
  currentTokens: number;
  excessTokens: number;
  utilizationPercent: number;
} {
  const currentTokens = contextOptimizer.countTotalTokens(items);
  const excessTokens = Math.max(0, currentTokens - maxTokens);
  const utilizationPercent = (currentTokens / maxTokens) * 100;

  return {
    withinLimit: currentTokens <= maxTokens,
    currentTokens,
    excessTokens,
    utilizationPercent
  };
}