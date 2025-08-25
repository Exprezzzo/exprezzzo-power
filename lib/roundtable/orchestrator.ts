// lib/roundtable/orchestrator.ts
// Parallel model execution with response deduplication and timing synchronization

import { ModelId, RoundtableResponse, SessionSettings } from '@/types/ai-playground';

export interface RoundtableExecution {
  id: string;
  models: ModelId[];
  prompt: string;
  settings: SessionSettings;
  startTime: number;
  responses: Map<ModelId, RoundtableResponse>;
  status: Map<ModelId, 'pending' | 'executing' | 'streaming' | 'completed' | 'error'>;
  metadata: {
    totalCost: number;
    totalLatency: number;
    duplicateResponses: Array<{
      models: ModelId[];
      similarity: number;
    }>;
    consensus: {
      level: number; // 0-100%
      agreementType: 'unanimous' | 'majority' | 'split' | 'diverse';
    };
  };
}

export interface OptimizationStrategy {
  costOptimization: boolean;
  timeoutSeconds: number;
  maxConcurrency: number;
  priorityModels: ModelId[];
  fallbackChain: boolean;
  deduplicationThreshold: number;
}

export class RoundtableOrchestrator {
  private activeExecutions: Map<string, RoundtableExecution> = new Map();
  private modelQueues: Map<ModelId, Array<() => Promise<void>>> = new Map();
  private concurrencyLimits: Map<ModelId, number> = new Map();
  private activeTasks: Map<ModelId, number> = new Map();

  constructor() {
    // Initialize concurrency limits per model
    this.initializeConcurrencyLimits();
  }

  /**
   * Execute roundtable with parallel model calls
   */
  async executeRoundtable(
    prompt: string,
    models: ModelId[],
    settings: SessionSettings,
    strategy: Partial<OptimizationStrategy> = {},
    onProgress?: (update: RoundtableProgressUpdate) => void
  ): Promise<RoundtableExecution> {
    const executionId = this.generateExecutionId();
    const optimizationStrategy: OptimizationStrategy = {
      costOptimization: false,
      timeoutSeconds: 30,
      maxConcurrency: 6,
      priorityModels: [],
      fallbackChain: true,
      deduplicationThreshold: 0.85,
      ...strategy
    };

    const execution: RoundtableExecution = {
      id: executionId,
      models,
      prompt,
      settings,
      startTime: Date.now(),
      responses: new Map(),
      status: new Map(),
      metadata: {
        totalCost: 0,
        totalLatency: 0,
        duplicateResponses: [],
        consensus: {
          level: 0,
          agreementType: 'diverse'
        }
      }
    };

    // Initialize status for all models
    models.forEach(model => {
      execution.status.set(model, 'pending');
    });

    this.activeExecutions.set(executionId, execution);

    try {
      // Execute models in parallel with smart orchestration
      await this.executeModelsInParallel(
        execution, 
        optimizationStrategy, 
        onProgress
      );

      // Post-process results
      await this.postProcessResults(execution, optimizationStrategy);

      return execution;
    } catch (error) {
      console.error(`Roundtable execution ${executionId} failed:`, error);
      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute models in parallel with concurrency control
   */
  private async executeModelsInParallel(
    execution: RoundtableExecution,
    strategy: OptimizationStrategy,
    onProgress?: (update: RoundtableProgressUpdate) => void
  ): Promise<void> {
    const { models, prompt, settings } = execution;
    
    // Organize models by priority
    const priorityModels = strategy.priorityModels.filter(m => models.includes(m));
    const regularModels = models.filter(m => !strategy.priorityModels.includes(m));
    
    // Execute priority models first if cost optimization is enabled
    const executionOrder = strategy.costOptimization 
      ? [...priorityModels, ...regularModels]
      : this.shuffleArray([...models]); // Random order for fairness

    // Create execution promises with concurrency control
    const executionPromises = executionOrder.map(async (modelId, index) => {
      // Wait for slot availability
      await this.waitForModelSlot(modelId);
      
      try {
        execution.status.set(modelId, 'executing');
        onProgress?.({
          type: 'model_start',
          executionId: execution.id,
          modelId,
          progress: (index / models.length) * 100
        });

        const response = await this.executeModel(
          modelId,
          prompt,
          settings,
          strategy.timeoutSeconds * 1000,
          (chunk) => {
            execution.status.set(modelId, 'streaming');
            onProgress?.({
              type: 'model_streaming',
              executionId: execution.id,
              modelId,
              content: chunk,
              progress: ((index + 0.5) / models.length) * 100
            });
          }
        );

        execution.responses.set(modelId, response);
        execution.status.set(modelId, 'completed');
        execution.metadata.totalCost += response.metadata?.cost || 0;
        execution.metadata.totalLatency = Math.max(
          execution.metadata.totalLatency, 
          Date.now() - execution.startTime
        );

        onProgress?.({
          type: 'model_complete',
          executionId: execution.id,
          modelId,
          response,
          progress: ((index + 1) / models.length) * 100
        });

        // Early termination optimization
        if (strategy.costOptimization && this.shouldTerminateEarly(execution)) {
          this.cancelRemainingModels(execution, executionOrder.slice(index + 1));
        }

      } catch (error) {
        console.error(`Model ${modelId} failed:`, error);
        execution.status.set(modelId, 'error');
        
        onProgress?.({
          type: 'model_error',
          executionId: execution.id,
          modelId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Attempt fallback if enabled
        if (strategy.fallbackChain) {
          await this.attemptFallback(execution, modelId, prompt, settings);
        }
      } finally {
        this.releaseModelSlot(modelId);
      }
    });

    // Wait for all models to complete (or fail)
    await Promise.allSettled(executionPromises);
  }

  /**
   * Execute a single model with streaming support
   */
  private async executeModel(
    modelId: ModelId,
    prompt: string,
    settings: SessionSettings,
    timeoutMs: number,
    onChunk?: (chunk: string) => void
  ): Promise<RoundtableResponse> {
    const startTime = Date.now();
    const messageId = `msg_${modelId}_${startTime}`;

    // Prepare request payload
    const requestPayload = {
      messages: [
        ...(settings.systemPrompt ? [{ role: 'system', content: settings.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      settings: {
        ...settings,
        streaming: true
      },
      preferredModel: modelId
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`Model ${modelId} API call failed: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let metadata = {};

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'chunk' && data.content) {
                    content += data.content;
                    onChunk?.(data.content);
                  } else if (data.type === 'metadata') {
                    metadata = data.metadata || {};
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming chunk:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      const responseTime = Date.now() - startTime;
      
      return {
        messageId,
        modelId,
        content,
        metadata: {
          tokens: this.estimateTokens(content),
          cost: this.calculateCost(modelId, content),
          latency: responseTime,
          finishReason: 'stop',
          requestId: messageId,
          cached: false,
          ...metadata
        }
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Model ${modelId} timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Post-process results for deduplication and consensus analysis
   */
  private async postProcessResults(
    execution: RoundtableExecution,
    strategy: OptimizationStrategy
  ): Promise<void> {
    const responses = Array.from(execution.responses.values());
    
    if (responses.length === 0) return;

    // Detect duplicate responses
    execution.metadata.duplicateResponses = this.detectDuplicateResponses(
      responses, 
      strategy.deduplicationThreshold
    );

    // Calculate consensus
    execution.metadata.consensus = this.calculateConsensus(responses);

    // Rank responses by quality
    this.rankResponses(execution);
  }

  /**
   * Detect duplicate or highly similar responses
   */
  private detectDuplicateResponses(
    responses: RoundtableResponse[], 
    threshold: number
  ): Array<{ models: ModelId[]; similarity: number }> {
    const duplicates: Array<{ models: ModelId[]; similarity: number }> = [];
    const processed = new Set<string>();

    for (let i = 0; i < responses.length - 1; i++) {
      if (processed.has(responses[i].modelId)) continue;

      const similarModels = [responses[i].modelId];
      let maxSimilarity = 0;

      for (let j = i + 1; j < responses.length; j++) {
        if (processed.has(responses[j].modelId)) continue;

        const similarity = this.calculateSimilarity(
          responses[i].content, 
          responses[j].content
        );

        if (similarity >= threshold) {
          similarModels.push(responses[j].modelId);
          processed.add(responses[j].modelId);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }

      if (similarModels.length > 1) {
        duplicates.push({
          models: similarModels,
          similarity: maxSimilarity
        });
        processed.add(responses[i].modelId);
      }
    }

    return duplicates;
  }

  /**
   * Calculate consensus level among responses
   */
  private calculateConsensus(responses: RoundtableResponse[]): {
    level: number;
    agreementType: 'unanimous' | 'majority' | 'split' | 'diverse';
  } {
    if (responses.length <= 1) {
      return { level: 100, agreementType: 'unanimous' };
    }

    // Calculate pairwise similarities
    const similarities: number[] = [];
    for (let i = 0; i < responses.length - 1; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similarities.push(
          this.calculateSimilarity(responses[i].content, responses[j].content)
        );
      }
    }

    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const consensusLevel = Math.round(avgSimilarity * 100);

    let agreementType: 'unanimous' | 'majority' | 'split' | 'diverse';
    if (consensusLevel >= 90) agreementType = 'unanimous';
    else if (consensusLevel >= 70) agreementType = 'majority';
    else if (consensusLevel >= 40) agreementType = 'split';
    else agreementType = 'diverse';

    return { level: consensusLevel, agreementType };
  }

  /**
   * Rank responses by quality metrics
   */
  private rankResponses(execution: RoundtableExecution): void {
    const responses = Array.from(execution.responses.values());
    
    // Calculate quality scores
    const scoredResponses = responses.map(response => ({
      ...response,
      qualityScore: this.calculateQualityScore(response, execution.prompt)
    }));

    // Sort by quality score
    scoredResponses.sort((a, b) => b.qualityScore - a.qualityScore);

    // Update responses with rankings
    scoredResponses.forEach((response, index) => {
      const originalResponse = execution.responses.get(response.modelId);
      if (originalResponse) {
        originalResponse.ranking = index + 1;
        execution.responses.set(response.modelId, originalResponse);
      }
    });
  }

  /**
   * Calculate quality score for a response
   */
  private calculateQualityScore(response: RoundtableResponse, prompt: string): number {
    let score = 50; // Base score

    // Length factor (not too short, not too long)
    const wordCount = response.content.split(/\s+/).length;
    if (wordCount > 20 && wordCount < 500) score += 10;
    if (wordCount > 100 && wordCount < 300) score += 5; // Sweet spot

    // Relevance factor (keyword matching)
    const promptWords = this.extractKeywords(prompt.toLowerCase());
    const responseWords = this.extractKeywords(response.content.toLowerCase());
    const relevanceScore = this.calculateRelevance(promptWords, responseWords);
    score += relevanceScore * 20;

    // Structure factor
    if (response.content.includes('\n-') || response.content.includes('\n*')) score += 5;
    if (response.content.includes('\n\n')) score += 3;

    // Code quality (if applicable)
    if (response.content.includes('```')) score += 10;

    // Penalize generic responses
    if (this.isGenericResponse(response.content)) score -= 15;

    // Response time factor (faster is better, but not at the cost of quality)
    const responseTime = response.metadata?.latency || 5000;
    if (responseTime < 2000) score += 5;
    else if (responseTime > 10000) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate text similarity using Jaccard index
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1.toLowerCase()));
    const words2 = new Set(this.extractKeywords(text2.toLowerCase()));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Helper methods
  private generateExecutionId(): string {
    return `roundtable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeConcurrencyLimits(): void {
    const limits: Record<ModelId, number> = {
      'gpt-4o': 3,
      'gpt-4o-mini': 5,
      'gpt-3.5-turbo': 10,
      'claude-3-5-sonnet': 2,
      'claude-3-opus': 1,
      'claude-3-haiku': 5,
      'gemini-pro': 4,
      'gemini-flash': 6,
      'mixtral-8x7b': 3,
      'llama-3.1-70b': 2
    };

    Object.entries(limits).forEach(([modelId, limit]) => {
      this.concurrencyLimits.set(modelId as ModelId, limit);
      this.activeTasks.set(modelId as ModelId, 0);
    });
  }

  private async waitForModelSlot(modelId: ModelId): Promise<void> {
    const limit = this.concurrencyLimits.get(modelId) || 1;
    
    while ((this.activeTasks.get(modelId) || 0) >= limit) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.activeTasks.set(modelId, (this.activeTasks.get(modelId) || 0) + 1);
  }

  private releaseModelSlot(modelId: ModelId): void {
    const current = this.activeTasks.get(modelId) || 0;
    this.activeTasks.set(modelId, Math.max(0, current - 1));
  }

  private shouldTerminateEarly(execution: RoundtableExecution): boolean {
    const completedResponses = Array.from(execution.responses.values());
    if (completedResponses.length < 2) return false;

    // Check if we have strong consensus already
    const consensus = this.calculateConsensus(completedResponses);
    return consensus.level >= 85 && completedResponses.length >= 3;
  }

  private cancelRemainingModels(execution: RoundtableExecution, remainingModels: ModelId[]): void {
    remainingModels.forEach(modelId => {
      execution.status.set(modelId, 'error');
    });
  }

  private async attemptFallback(
    execution: RoundtableExecution,
    failedModel: ModelId,
    prompt: string,
    settings: SessionSettings
  ): Promise<void> {
    // Simple fallback strategy - could be made more sophisticated
    const fallbackMap: Partial<Record<ModelId, ModelId>> = {
      'gpt-4o': 'gpt-3.5-turbo',
      'claude-3-opus': 'claude-3-5-sonnet',
      'claude-3-5-sonnet': 'claude-3-haiku',
      'gemini-pro': 'gemini-flash'
    };

    const fallbackModel = fallbackMap[failedModel];
    if (fallbackModel && !execution.responses.has(fallbackModel)) {
      try {
        const response = await this.executeModel(fallbackModel, prompt, settings, 15000);
        execution.responses.set(fallbackModel, response);
        execution.status.set(fallbackModel, 'completed');
      } catch (error) {
        console.error(`Fallback model ${fallbackModel} also failed:`, error);
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private extractKeywords(text: string): string[] {
    return text
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
      'that', 'these', 'those'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  private calculateRelevance(promptWords: string[], responseWords: string[]): number {
    if (promptWords.length === 0) return 0;
    
    const matches = promptWords.filter(word => responseWords.includes(word));
    return matches.length / promptWords.length;
  }

  private isGenericResponse(content: string): boolean {
    const genericPhrases = [
      'i cannot', 'i am not able', 'i don\'t have', 'sorry',
      'as an ai', 'i am an ai', 'artificial intelligence'
    ];
    
    const lowerContent = content.toLowerCase();
    return genericPhrases.some(phrase => lowerContent.includes(phrase));
  }

  private estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }

  private calculateCost(modelId: ModelId, content: string): number {
    const tokens = this.estimateTokens(content);
    const costPer1k = {
      'gpt-4o': 0.015,
      'gpt-4o-mini': 0.00015,
      'gpt-3.5-turbo': 0.001,
      'claude-3-5-sonnet': 0.015,
      'claude-3-opus': 0.015,
      'claude-3-haiku': 0.00025,
      'gemini-pro': 0.0005,
      'gemini-flash': 0.0001,
      'mixtral-8x7b': 0.0008,
      'llama-3.1-70b': 0.0008,
    }[modelId] || 0.001;

    return (tokens / 1000) * costPer1k;
  }
}

// Progress update types
export interface RoundtableProgressUpdate {
  type: 'model_start' | 'model_streaming' | 'model_complete' | 'model_error' | 'execution_complete';
  executionId: string;
  modelId?: ModelId;
  content?: string;
  response?: RoundtableResponse;
  error?: string;
  progress: number;
}

// Export singleton instance
export const roundtableOrchestrator = new RoundtableOrchestrator();