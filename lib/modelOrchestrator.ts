// lib/modelOrchestrator.ts
// Intelligent AI model orchestration with fallback, health monitoring, and smart routing

import { 
  ModelId, 
  ModelConfig, 
  ModelHealthStatus, 
  QueryComplexity, 
  OrchestrationConfig,
  DEFAULT_FALLBACK_CHAIN,
  MODEL_CONFIGS
} from '@/types/ai-playground';

export class ModelOrchestrator {
  private healthStatus: Map<ModelId, ModelHealthStatus> = new Map();
  private config: OrchestrationConfig;
  private lastHealthCheck: Date = new Date();

  constructor(config?: Partial<OrchestrationConfig>) {
    this.config = {
      fallbackEnabled: true,
      fallbackChain: DEFAULT_FALLBACK_CHAIN,
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000, // 1 minute
      failureThreshold: 3,
      ...config
    };

    // Initialize health status for all models
    Object.keys(MODEL_CONFIGS).forEach(modelId => {
      this.healthStatus.set(modelId as ModelId, {
        modelId: modelId as ModelId,
        status: 'online',
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date(),
      });
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Analyze query complexity and recommend optimal model
   */
  public analyzeQueryComplexity(prompt: string, context?: string[]): QueryComplexity {
    const text = [prompt, ...(context || [])].join(' ');
    const words = text.split(/\s+/);
    const length = words.length;

    // Analyze various complexity factors
    const factors = {
      length: Math.min(length / 100, 1), // 0-1 based on length
      technicalTerms: this.countTechnicalTerms(text) / length,
      codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
      multipleQuestions: (text.match(/\?/g) || []).length,
      reasoning: this.detectReasoningKeywords(text) / length,
      creativity: this.detectCreativityKeywords(text) / length,
    };

    // Calculate overall complexity score (0-100)
    const score = Math.round(
      (factors.length * 20) +
      (factors.technicalTerms * 25) +
      (factors.codeBlocks * 15) +
      (factors.multipleQuestions * 10) +
      (factors.reasoning * 20) +
      (factors.creativity * 10)
    );

    // Recommend model based on complexity and availability
    const recommendedModel = this.selectOptimalModel(score, factors);
    const fallbackChain = this.buildFallbackChain(recommendedModel);

    return {
      score: Math.min(score, 100),
      factors,
      recommendedModel,
      fallbackChain
    };
  }

  /**
   * Execute a request with intelligent fallback
   */
  public async executeWithFallback<T>(
    request: () => Promise<T>,
    modelId: ModelId,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      fallbackEnabled?: boolean;
    }
  ): Promise<{ result: T; modelUsed: ModelId; attempts: number; totalTime: number }> {
    const startTime = Date.now();
    const maxRetries = options?.maxRetries ?? this.config.retryAttempts;
    const retryDelay = options?.retryDelay ?? this.config.retryDelay;
    const fallbackEnabled = options?.fallbackEnabled ?? this.config.fallbackEnabled;

    let currentModel = modelId;
    let attempts = 0;
    let lastError: Error | null = null;

    // Build execution chain: primary model + fallbacks
    const executionChain = [currentModel];
    if (fallbackEnabled) {
      const fallbackChain = this.buildFallbackChain(currentModel);
      executionChain.push(...fallbackChain.filter(m => m !== currentModel));
    }

    for (const model of executionChain) {
      // Check if model is healthy before attempting
      if (!this.isModelHealthy(model)) {
        console.warn(`Skipping unhealthy model: ${model}`);
        continue;
      }

      for (let retry = 0; retry < maxRetries; retry++) {
        attempts++;
        
        try {
          console.log(`Attempting request with ${model} (attempt ${retry + 1}/${maxRetries})`);
          
          const result = await this.executeWithTimeout(request, model, 30000); // 30s timeout
          
          // Record successful execution
          this.recordSuccess(model, Date.now() - startTime);
          
          return {
            result,
            modelUsed: model,
            attempts,
            totalTime: Date.now() - startTime
          };

        } catch (error) {
          lastError = error as Error;
          console.error(`Request failed with ${model}:`, error);
          
          // Record failure
          this.recordFailure(model, error as Error);
          
          // Wait before retry (exponential backoff)
          if (retry < maxRetries - 1) {
            await this.delay(retryDelay * Math.pow(2, retry));
          }
        }
      }
      
      console.log(`All retries exhausted for ${model}, trying next model`);
    }

    // All models failed
    throw new Error(
      `All models failed after ${attempts} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Get current health status for all models
   */
  public getHealthStatus(): ModelHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get healthy models sorted by preference
   */
  public getHealthyModels(): ModelId[] {
    return Array.from(this.healthStatus.entries())
      .filter(([_, status]) => status.status === 'online')
      .sort(([_, a], [__, b]) => a.responseTime - b.responseTime)
      .map(([modelId, _]) => modelId);
  }

  /**
   * Force health check for all models
   */
  public async performHealthCheck(): Promise<void> {
    const checkPromises = Array.from(this.healthStatus.keys()).map(
      modelId => this.checkModelHealth(modelId)
    );

    await Promise.allSettled(checkPromises);
    this.lastHealthCheck = new Date();
  }

  private selectOptimalModel(complexityScore: number, factors: QueryComplexity['factors']): ModelId {
    const healthyModels = this.getHealthyModels();
    
    if (healthyModels.length === 0) {
      console.warn('No healthy models available, using fallback');
      return DEFAULT_FALLBACK_CHAIN[0];
    }

    // High complexity: use most capable models
    if (complexityScore > 70) {
      for (const model of ['gpt-4o', 'claude-3-5-sonnet', 'claude-3-opus']) {
        if (healthyModels.includes(model as ModelId)) {
          return model as ModelId;
        }
      }
    }

    // Code-heavy: prefer GPT models
    if (factors.codeBlocks > 0 || factors.technicalTerms > 0.1) {
      for (const model of ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']) {
        if (healthyModels.includes(model as ModelId)) {
          return model as ModelId;
        }
      }
    }

    // Creative tasks: prefer Claude
    if (factors.creativity > 0.1) {
      for (const model of ['claude-3-5-sonnet', 'claude-3-opus']) {
        if (healthyModels.includes(model as ModelId)) {
          return model as ModelId;
        }
      }
    }

    // Speed-focused: prefer fast models
    if (complexityScore < 30) {
      for (const model of ['gpt-4o-mini', 'claude-3-haiku', 'gemini-flash']) {
        if (healthyModels.includes(model as ModelId)) {
          return model as ModelId;
        }
      }
    }

    // Default: return the healthiest model
    return healthyModels[0];
  }

  private buildFallbackChain(primaryModel: ModelId): ModelId[] {
    const chain = [...this.config.fallbackChain];
    
    // Remove primary model from chain and add it to the front
    const filtered = chain.filter(m => m !== primaryModel);
    return [primaryModel, ...filtered];
  }

  private isModelHealthy(modelId: ModelId): boolean {
    const status = this.healthStatus.get(modelId);
    return status ? status.status === 'online' : false;
  }

  private async checkModelHealth(modelId: ModelId): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate health check with a lightweight request
      const testPrompt = "Hello";
      const response = await this.makeHealthCheckRequest(modelId, testPrompt);
      
      const responseTime = Date.now() - startTime;
      
      this.healthStatus.set(modelId, {
        ...this.healthStatus.get(modelId)!,
        status: 'online',
        responseTime,
        lastChecked: new Date(),
        errorRate: Math.max(0, (this.healthStatus.get(modelId)?.errorRate || 0) - 0.1)
      });

    } catch (error) {
      console.error(`Health check failed for ${modelId}:`, error);
      
      const currentStatus = this.healthStatus.get(modelId)!;
      const newErrorRate = currentStatus.errorRate + 0.2;
      
      this.healthStatus.set(modelId, {
        ...currentStatus,
        status: newErrorRate > 0.5 ? 'offline' : 'degraded',
        errorRate: Math.min(1, newErrorRate),
        lastChecked: new Date(),
      });
    }
  }

  private async makeHealthCheckRequest(modelId: ModelId, prompt: string): Promise<any> {
    // This would make an actual API call to test the model
    // For now, simulate with a delay
    await this.delay(100 + Math.random() * 200);
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Simulated health check failure');
    }
    
    return { content: 'OK' };
  }

  private recordSuccess(modelId: ModelId, responseTime: number): void {
    const status = this.healthStatus.get(modelId);
    if (status) {
      this.healthStatus.set(modelId, {
        ...status,
        responseTime: (status.responseTime * 0.8) + (responseTime * 0.2), // Moving average
        errorRate: Math.max(0, status.errorRate - 0.1),
        status: 'online'
      });
    }
  }

  private recordFailure(modelId: ModelId, error: Error): void {
    const status = this.healthStatus.get(modelId);
    if (status) {
      const newErrorRate = Math.min(1, status.errorRate + 0.2);
      this.healthStatus.set(modelId, {
        ...status,
        errorRate: newErrorRate,
        status: newErrorRate > 0.5 ? 'offline' : 'degraded'
      });
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>, 
    modelId: ModelId, 
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms for ${modelId}`)), timeout)
      )
    ]);
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      if (Date.now() - this.lastHealthCheck.getTime() > this.config.healthCheckInterval) {
        try {
          await this.performHealthCheck();
        } catch (error) {
          console.error('Health check cycle failed:', error);
        }
      }
    }, this.config.healthCheckInterval);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private countTechnicalTerms(text: string): number {
    const technicalTerms = [
      'algorithm', 'function', 'variable', 'array', 'object', 'class', 'method',
      'api', 'database', 'query', 'server', 'client', 'framework', 'library',
      'component', 'module', 'package', 'dependency', 'npm', 'git', 'repo',
      'docker', 'kubernetes', 'aws', 'cloud', 'microservice', 'authentication',
      'authorization', 'encryption', 'hash', 'token', 'jwt', 'oauth', 'ssl',
      'http', 'https', 'rest', 'graphql', 'websocket', 'json', 'xml', 'yaml',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'cache'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => technicalTerms.includes(word)).length;
  }

  private detectReasoningKeywords(text: string): number {
    const reasoningKeywords = [
      'analyze', 'compare', 'evaluate', 'explain', 'why', 'how', 'because',
      'therefore', 'however', 'although', 'consider', 'examine', 'investigate',
      'determine', 'conclude', 'infer', 'deduce', 'reasoning', 'logic',
      'cause', 'effect', 'relationship', 'pattern', 'trend', 'correlation'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => reasoningKeywords.some(keyword => word.includes(keyword))).length;
  }

  private detectCreativityKeywords(text: string): number {
    const creativityKeywords = [
      'create', 'generate', 'design', 'imagine', 'invent', 'brainstorm',
      'creative', 'original', 'unique', 'innovative', 'artistic', 'story',
      'narrative', 'poem', 'write', 'compose', 'draft', 'craft', 'build',
      'make', 'develop', 'conceive', 'envision', 'dream', 'fantasy'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => creativityKeywords.some(keyword => word.includes(keyword))).length;
  }
}

// Singleton instance
export const modelOrchestrator = new ModelOrchestrator();

// Helper functions for common operations
export async function executeWithIntelligentRouting(
  prompt: string,
  context?: string[],
  options?: {
    preferredModel?: ModelId;
    fallbackEnabled?: boolean;
    maxRetries?: number;
  }
): Promise<{ result: any; modelUsed: ModelId; complexity: QueryComplexity; attempts: number }> {
  // Analyze query complexity
  const complexity = modelOrchestrator.analyzeQueryComplexity(prompt, context);
  
  // Use preferred model or recommended model
  const targetModel = options?.preferredModel || complexity.recommendedModel;
  
  // Create a mock request function (replace with actual API call)
  const request = async () => {
    // This would be replaced with actual model API call
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return { content: `Response from ${targetModel}` };
  };

  const result = await modelOrchestrator.executeWithFallback(
    request,
    targetModel,
    {
      maxRetries: options?.maxRetries,
      fallbackEnabled: options?.fallbackEnabled,
    }
  );

  return {
    ...result,
    complexity
  };
}

export function getModelRecommendation(prompt: string, context?: string[]): {
  recommended: ModelId;
  alternatives: ModelId[];
  reasoning: string;
} {
  const complexity = modelOrchestrator.analyzeQueryComplexity(prompt, context);
  const healthy = modelOrchestrator.getHealthyModels();
  
  let reasoning = `Based on complexity score ${complexity.score}/100: `;
  
  if (complexity.score > 70) {
    reasoning += 'High complexity detected, recommending most capable models.';
  } else if (complexity.factors.codeBlocks > 0) {
    reasoning += 'Code blocks detected, recommending coding-optimized models.';
  } else if (complexity.factors.creativity > 0.1) {
    reasoning += 'Creative task detected, recommending creative-optimized models.';
  } else {
    reasoning += 'Standard task, recommending balanced models.';
  }

  return {
    recommended: complexity.recommendedModel,
    alternatives: complexity.fallbackChain.filter(m => 
      m !== complexity.recommendedModel && healthy.includes(m)
    ).slice(0, 3),
    reasoning
  };
}

export { ModelOrchestrator };