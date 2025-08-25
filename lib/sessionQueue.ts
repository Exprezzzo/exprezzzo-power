// lib/sessionQueue.ts
// Enterprise-grade session queue with Bull, Redis, and priority management

import Bull, { Queue, Job, JobOptions } from 'bull';
import { Redis } from 'ioredis';
import { PlaygroundSession, BaseMessage, ModelId } from '@/types/ai-playground';

// Job types
export interface SessionJobData {
  sessionId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'merge' | 'branch' | 'export';
  payload?: any;
  priority?: number;
  retryCount?: number;
  userTier?: 'free' | 'pro' | 'enterprise';
}

export interface MessageProcessingJob {
  messageId: string;
  sessionId: string;
  content: string;
  modelId: ModelId;
  userId: string;
  settings?: any;
  priority?: number;
}

export interface ExportJobData {
  sessionId: string;
  userId: string;
  format: 'md' | 'pdf' | 'json';
  includeMetadata: boolean;
  isPublic: boolean;
  expiresAt?: Date;
}

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  family: 4,
};

export class SessionQueueManager {
  private sessionQueue: Queue<SessionJobData>;
  private messageQueue: Queue<MessageProcessingJob>;
  private exportQueue: Queue<ExportJobData>;
  private deadLetterQueue: Queue<any>;
  private redis: Redis;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(redisConfig);

    // Initialize queues with different priorities
    this.sessionQueue = new Bull<SessionJobData>('session-operations', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.messageQueue = new Bull<MessageProcessingJob>('message-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.exportQueue = new Bull<ExportJobData>('session-exports', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.deadLetterQueue = new Bull('dead-letter-queue', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: false, // Keep all dead letters
      },
    });

    this.setupJobProcessors();
    this.setupEventHandlers();
    this.setupHealthChecks();
  }

  /**
   * Add session operation to queue with priority handling
   */
  async addSessionJob(
    data: SessionJobData,
    options: Partial<JobOptions> = {}
  ): Promise<Job<SessionJobData>> {
    const priority = this.calculatePriority(data.userTier || 'free', data.action);
    
    const jobOptions: JobOptions = {
      priority,
      delay: options.delay || 0,
      attempts: options.attempts || (data.userTier === 'enterprise' ? 5 : 3),
      ...options,
    };

    // Add job metadata for tracking
    const enrichedData = {
      ...data,
      enqueuedAt: new Date(),
      priority,
      jobId: `session_${data.action}_${data.sessionId}_${Date.now()}`,
    };

    return this.sessionQueue.add('process-session-operation', enrichedData, jobOptions);
  }

  /**
   * Add message processing job with streaming support
   */
  async addMessageJob(
    data: MessageProcessingJob,
    options: Partial<JobOptions> = {}
  ): Promise<Job<MessageProcessingJob>> {
    const priority = this.calculateMessagePriority(data);
    
    const jobOptions: JobOptions = {
      priority,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      ...options,
    };

    const enrichedData = {
      ...data,
      enqueuedAt: new Date(),
      priority,
      jobId: `message_${data.messageId}_${Date.now()}`,
    };

    return this.messageQueue.add('process-message', enrichedData, jobOptions);
  }

  /**
   * Add export job with format-specific handling
   */
  async addExportJob(
    data: ExportJobData,
    options: Partial<JobOptions> = {}
  ): Promise<Job<ExportJobData>> {
    const priority = data.format === 'pdf' ? 5 : 10; // PDF exports are more resource intensive
    
    const jobOptions: JobOptions = {
      priority,
      delay: data.format === 'pdf' ? 1000 : 0, // Slight delay for PDF to batch similar requests
      attempts: 2,
      ...options,
    };

    const enrichedData = {
      ...data,
      enqueuedAt: new Date(),
      jobId: `export_${data.format}_${data.sessionId}_${Date.now()}`,
    };

    return this.exportQueue.add('process-export', enrichedData, jobOptions);
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats() {
    const [sessionStats, messageStats, exportStats, deadLetterStats] = await Promise.all([
      this.getQueueMetrics(this.sessionQueue),
      this.getQueueMetrics(this.messageQueue),
      this.getQueueMetrics(this.exportQueue),
      this.getQueueMetrics(this.deadLetterQueue),
    ]);

    return {
      session: sessionStats,
      message: messageStats,
      export: exportStats,
      deadLetter: deadLetterStats,
      timestamp: new Date(),
    };
  }

  /**
   * Priority queue for enterprise users
   */
  async addPriorityJob(data: SessionJobData, userTier: 'enterprise' | 'pro' = 'enterprise') {
    return this.addSessionJob(
      { ...data, userTier },
      { 
        priority: userTier === 'enterprise' ? 1 : 5,
        attempts: 5,
      }
    );
  }

  /**
   * Batch operations for multiple sessions
   */
  async addBatchJobs(jobs: SessionJobData[]): Promise<Job<SessionJobData>[]> {
    const jobPromises = jobs.map(jobData => 
      this.addSessionJob(jobData, { 
        priority: this.calculatePriority(jobData.userTier || 'free', jobData.action),
      })
    );

    return Promise.all(jobPromises);
  }

  /**
   * Retry failed jobs with exponential backoff
   */
  async retryFailedJobs(queueName: 'session' | 'message' | 'export' = 'session'): Promise<number> {
    const queue = this.getQueueByName(queueName);
    const failedJobs = await queue.getFailed();
    
    let retriedCount = 0;
    
    for (const job of failedJobs) {
      if (job.opts.attempts && job.attemptsMade < job.opts.attempts) {
        await job.retry();
        retriedCount++;
      } else {
        // Move to dead letter queue
        await this.moveToDeadLetterQueue(job);
      }
    }

    return retriedCount;
  }

  /**
   * Clean up old completed jobs
   */
  async cleanQueues(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const queues = [this.sessionQueue, this.messageQueue, this.exportQueue];
    
    await Promise.all(
      queues.map(queue => 
        queue.clean(olderThanMs, 'completed').then(() =>
          queue.clean(olderThanMs, 'failed')
        )
      )
    );
  }

  /**
   * Pause/Resume queues for maintenance
   */
  async pauseQueues(): Promise<void> {
    await Promise.all([
      this.sessionQueue.pause(),
      this.messageQueue.pause(),
      this.exportQueue.pause(),
    ]);
  }

  async resumeQueues(): Promise<void> {
    await Promise.all([
      this.sessionQueue.resume(),
      this.messageQueue.resume(),
      this.exportQueue.resume(),
    ]);
  }

  /**
   * Get job by ID across all queues
   */
  async getJob(jobId: string): Promise<Job | null> {
    const queues = [this.sessionQueue, this.messageQueue, this.exportQueue];
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) return job;
    }
    
    return null;
  }

  // Private methods

  private setupJobProcessors(): void {
    // Session operations processor
    this.sessionQueue.process('process-session-operation', 10, async (job: Job<SessionJobData>) => {
      const { sessionId, userId, action, payload } = job.data;
      
      try {
        switch (action) {
          case 'create':
            return await this.processSessionCreate(sessionId, userId, payload);
          case 'update':
            return await this.processSessionUpdate(sessionId, userId, payload);
          case 'delete':
            return await this.processSessionDelete(sessionId, userId);
          case 'merge':
            return await this.processSessionMerge(sessionId, payload.targetSessionId, userId);
          case 'branch':
            return await this.processSessionBranch(sessionId, payload.branchName, userId);
          default:
            throw new Error(`Unknown session action: ${action}`);
        }
      } catch (error) {
        console.error(`Session job failed:`, error);
        throw error;
      }
    });

    // Message processing processor
    this.messageQueue.process('process-message', 20, async (job: Job<MessageProcessingJob>) => {
      const { messageId, sessionId, content, modelId, userId, settings } = job.data;
      
      try {
        return await this.processMessage(messageId, sessionId, content, modelId, userId, settings);
      } catch (error) {
        console.error(`Message processing failed:`, error);
        throw error;
      }
    });

    // Export processor
    this.exportQueue.process('process-export', 5, async (job: Job<ExportJobData>) => {
      const { sessionId, userId, format, includeMetadata, isPublic, expiresAt } = job.data;
      
      try {
        return await this.processExport(sessionId, userId, format, {
          includeMetadata,
          isPublic,
          expiresAt,
        });
      } catch (error) {
        console.error(`Export job failed:`, error);
        throw error;
      }
    });
  }

  private setupEventHandlers(): void {
    // Session queue events
    this.sessionQueue.on('completed', (job, result) => {
      console.log(`Session job ${job.id} completed:`, result);
    });

    this.sessionQueue.on('failed', (job, error) => {
      console.error(`Session job ${job.id} failed:`, error);
      this.handleJobFailure(job, error);
    });

    // Message queue events
    this.messageQueue.on('completed', (job, result) => {
      console.log(`Message job ${job.id} completed`);
    });

    this.messageQueue.on('failed', (job, error) => {
      console.error(`Message job ${job.id} failed:`, error);
      this.handleJobFailure(job, error);
    });

    // Export queue events
    this.exportQueue.on('completed', (job, result) => {
      console.log(`Export job ${job.id} completed:`, result);
    });

    this.exportQueue.on('failed', (job, error) => {
      console.error(`Export job ${job.id} failed:`, error);
      this.handleJobFailure(job, error);
    });
  }

  private setupHealthChecks(): void {
    // Monitor queue health every 30 seconds
    setInterval(async () => {
      try {
        const stats = await this.getQueueStats();
        
        // Alert if any queue has too many waiting jobs
        if (stats.session.waiting > 100 || stats.message.waiting > 500) {
          console.warn('Queue backlog detected:', stats);
        }

        // Alert if dead letter queue is growing
        if (stats.deadLetter.waiting > 50) {
          console.error('High dead letter queue count:', stats.deadLetter.waiting);
        }
      } catch (error) {
        console.error('Queue health check failed:', error);
      }
    }, 30000);
  }

  private calculatePriority(userTier: string, action: string): number {
    const tierPriority = {
      enterprise: 1,
      pro: 5,
      free: 10,
    };

    const actionPriority = {
      delete: 1, // High priority for deletions
      create: 3,
      update: 5,
      merge: 7,
      branch: 8,
      export: 10, // Lower priority for exports
    };

    const basePriority = tierPriority[userTier as keyof typeof tierPriority] || 10;
    const actionModifier = actionPriority[action as keyof typeof actionPriority] || 5;

    return basePriority + actionModifier;
  }

  private calculateMessagePriority(data: MessageProcessingJob): number {
    // Higher priority for shorter messages (likely interactive)
    const lengthFactor = Math.min(data.content.length / 1000, 5);
    
    // Higher priority for certain models
    const modelPriority = {
      'gpt-4o': 2,
      'claude-3-5-sonnet': 3,
      'gpt-3.5-turbo': 5,
      'claude-3-haiku': 4,
    };

    const basePriority = data.priority || 10;
    const modelModifier = modelPriority[data.modelId as keyof typeof modelPriority] || 5;
    
    return Math.max(1, basePriority - lengthFactor + modelModifier);
  }

  private async getQueueMetrics(queue: Queue): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  private getQueueByName(name: string): Queue {
    switch (name) {
      case 'session':
        return this.sessionQueue;
      case 'message':
        return this.messageQueue;
      case 'export':
        return this.exportQueue;
      default:
        throw new Error(`Unknown queue name: ${name}`);
    }
  }

  private async moveToDeadLetterQueue(job: Job): Promise<void> {
    await this.deadLetterQueue.add('dead-letter', {
      originalQueue: job.queue.name,
      originalJobId: job.id,
      data: job.data,
      failedAt: new Date(),
      error: job.failedReason,
      attempts: job.attemptsMade,
    });
  }

  private async handleJobFailure(job: Job, error: Error): Promise<void> {
    // Log failure metrics
    const failureKey = `job_failures:${job.queue.name}:${new Date().toISOString().split('T')[0]}`;
    await this.redis.incr(failureKey);
    await this.redis.expire(failureKey, 86400); // 24 hours

    // If all retries exhausted, move to dead letter queue
    if (job.opts.attempts && job.attemptsMade >= job.opts.attempts) {
      await this.moveToDeadLetterQueue(job);
    }
  }

  // Placeholder processors (would integrate with actual session management)
  private async processSessionCreate(sessionId: string, userId: string, payload: any): Promise<any> {
    console.log(`Creating session ${sessionId} for user ${userId}`);
    // Implementation would call actual session service
    return { success: true, sessionId };
  }

  private async processSessionUpdate(sessionId: string, userId: string, payload: any): Promise<any> {
    console.log(`Updating session ${sessionId} for user ${userId}`);
    return { success: true, sessionId, updated: payload };
  }

  private async processSessionDelete(sessionId: string, userId: string): Promise<any> {
    console.log(`Deleting session ${sessionId} for user ${userId}`);
    return { success: true, sessionId, deleted: true };
  }

  private async processSessionMerge(sessionId: string, targetSessionId: string, userId: string): Promise<any> {
    console.log(`Merging session ${sessionId} into ${targetSessionId} for user ${userId}`);
    return { success: true, sourceSession: sessionId, targetSession: targetSessionId };
  }

  private async processSessionBranch(sessionId: string, branchName: string, userId: string): Promise<any> {
    console.log(`Branching session ${sessionId} as ${branchName} for user ${userId}`);
    return { success: true, originalSession: sessionId, newSession: `${sessionId}_${branchName}` };
  }

  private async processMessage(
    messageId: string,
    sessionId: string,
    content: string,
    modelId: ModelId,
    userId: string,
    settings?: any
  ): Promise<any> {
    console.log(`Processing message ${messageId} in session ${sessionId}`);
    // Implementation would call AI model APIs
    return { success: true, messageId, response: 'AI response here' };
  }

  private async processExport(
    sessionId: string,
    userId: string,
    format: string,
    options: any
  ): Promise<any> {
    console.log(`Exporting session ${sessionId} as ${format} for user ${userId}`);
    // Implementation would generate export files
    return { 
      success: true, 
      sessionId, 
      format, 
      url: `https://exports.exprezzzo.com/${sessionId}.${format}` 
    };
  }
}

// Export singleton instance
export const sessionQueueManager = new SessionQueueManager();

// Utility functions
export async function addSessionOperation(
  sessionId: string,
  userId: string,
  action: SessionJobData['action'],
  payload?: any,
  userTier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<Job<SessionJobData>> {
  return sessionQueueManager.addSessionJob({
    sessionId,
    userId,
    action,
    payload,
    userTier,
  });
}

export async function addMessageProcessing(
  messageId: string,
  sessionId: string,
  content: string,
  modelId: ModelId,
  userId: string,
  settings?: any
): Promise<Job<MessageProcessingJob>> {
  return sessionQueueManager.addMessageJob({
    messageId,
    sessionId,
    content,
    modelId,
    userId,
    settings,
  });
}

export async function addSessionExport(
  sessionId: string,
  userId: string,
  format: 'md' | 'pdf' | 'json',
  options: {
    includeMetadata?: boolean;
    isPublic?: boolean;
    expiresAt?: Date;
  } = {}
): Promise<Job<ExportJobData>> {
  return sessionQueueManager.addExportJob({
    sessionId,
    userId,
    format,
    includeMetadata: options.includeMetadata || false,
    isPublic: options.isPublic || false,
    expiresAt: options.expiresAt,
  });
}