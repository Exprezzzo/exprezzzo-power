import { Redis } from '@upstash/redis';
import { AISession, AIMessage, SessionMetadata } from '@/types/ai-playground';

interface CacheEntry<T> {
  data: T;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  totalSize: number;
  hitRate: number;
}

interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // seconds
  maxSize: number; // bytes
  enableCompression: boolean;
  enableMetrics: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
}

const DEFAULT_CONFIG: CacheConfig = {
  maxEntries: 10000,
  defaultTTL: 3600, // 1 hour
  maxSize: 100 * 1024 * 1024, // 100MB
  enableCompression: true,
  enableMetrics: true,
  evictionPolicy: 'lru'
};

export class SessionCache {
  private redis: Redis;
  private config: CacheConfig;
  private metrics: CacheStats;
  private compressionEnabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.redis = Redis.fromEnv();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0
    };
    this.compressionEnabled = this.config.enableCompression;
  }

  private getCacheKey(type: string, id: string): string {
    return `session_cache:${type}:${id}`;
  }

  private getMetadataKey(type: string, id: string): string {
    return `session_meta:${type}:${id}`;
  }

  private getIndexKey(): string {
    return 'session_cache:index';
  }

  private async compress(data: string): Promise<string> {
    if (!this.compressionEnabled) return data;
    
    // Simple compression using built-in methods
    // In production, consider using libraries like pako for better compression
    try {
      return Buffer.from(data).toString('base64');
    } catch {
      return data;
    }
  }

  private async decompress(data: string): Promise<string> {
    if (!this.compressionEnabled) return data;
    
    try {
      return Buffer.from(data, 'base64').toString('utf-8');
    } catch {
      return data;
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async updateMetrics(hit: boolean, evicted: boolean = false) {
    if (!this.config.enableMetrics) return;
    
    if (hit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    
    if (evicted) {
      this.metrics.evictions++;
    }
    
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    
    // Store metrics in Redis for persistence across instances
    await this.redis.hmset('session_cache:metrics', this.metrics);
  }

  private async updateAccessMetadata(type: string, id: string) {
    const metaKey = this.getMetadataKey(type, id);
    const now = Date.now();
    
    await this.redis.hincrby(metaKey, 'accessCount', 1);
    await this.redis.hset(metaKey, 'lastAccessed', now);
    
    // Update LRU index
    await this.redis.zadd(this.getIndexKey(), { score: now, member: `${type}:${id}` });
  }

  private async shouldEvict(): Promise<boolean> {
    const currentEntries = await this.redis.zcard(this.getIndexKey());
    return currentEntries >= this.config.maxEntries;
  }

  private async evictLRU(count: number = 1): Promise<number> {
    const indexKey = this.getIndexKey();
    
    // Get least recently used items
    const toEvict = await this.redis.zrange(indexKey, 0, count - 1);
    let evicted = 0;
    
    for (const item of toEvict) {
      const [type, id] = item.toString().split(':', 2);
      const cacheKey = this.getCacheKey(type, id);
      const metaKey = this.getMetadataKey(type, id);
      
      // Remove from cache
      await Promise.all([
        this.redis.del(cacheKey),
        this.redis.del(metaKey),
        this.redis.zrem(indexKey, item)
      ]);
      
      evicted++;
    }
    
    await this.updateMetrics(false, evicted > 0);
    return evicted;
  }

  private async evictLFU(count: number = 1): Promise<number> {
    // Get all items and their access counts
    const indexKey = this.getIndexKey();
    const allItems = await this.redis.zrange(indexKey, 0, -1);
    
    const itemsWithCounts = await Promise.all(
      allItems.map(async (item) => {
        const [type, id] = item.toString().split(':', 2);
        const metaKey = this.getMetadataKey(type, id);
        const accessCount = await this.redis.hget(metaKey, 'accessCount') || 0;
        return { item, accessCount: parseInt(accessCount.toString()) };
      })
    );
    
    // Sort by access count (ascending for LFU)
    itemsWithCounts.sort((a, b) => a.accessCount - b.accessCount);
    
    let evicted = 0;
    for (let i = 0; i < Math.min(count, itemsWithCounts.length); i++) {
      const { item } = itemsWithCounts[i];
      const [type, id] = item.toString().split(':', 2);
      const cacheKey = this.getCacheKey(type, id);
      const metaKey = this.getMetadataKey(type, id);
      
      await Promise.all([
        this.redis.del(cacheKey),
        this.redis.del(metaKey),
        this.redis.zrem(indexKey, item)
      ]);
      
      evicted++;
    }
    
    await this.updateMetrics(false, evicted > 0);
    return evicted;
  }

  private async evictExpired(): Promise<number> {
    const now = Date.now();
    const indexKey = this.getIndexKey();
    const allItems = await this.redis.zrange(indexKey, 0, -1);
    
    let evicted = 0;
    
    for (const item of allItems) {
      const [type, id] = item.toString().split(':', 2);
      const metaKey = this.getMetadataKey(type, id);
      const metadata = await this.redis.hmget(metaKey, 'createdAt', 'ttl');
      
      if (metadata.createdAt && metadata.ttl) {
        const createdAt = parseInt(metadata.createdAt.toString());
        const ttl = parseInt(metadata.ttl.toString()) * 1000; // Convert to ms
        
        if (now - createdAt > ttl) {
          const cacheKey = this.getCacheKey(type, id);
          
          await Promise.all([
            this.redis.del(cacheKey),
            this.redis.del(metaKey),
            this.redis.zrem(indexKey, item)
          ]);
          
          evicted++;
        }
      }
    }
    
    if (evicted > 0) {
      await this.updateMetrics(false, true);
    }
    
    return evicted;
  }

  private async performEviction(): Promise<void> {
    // First, evict expired items
    await this.evictExpired();
    
    // Check if we still need to evict more
    if (await this.shouldEvict()) {
      const evictCount = Math.ceil(this.config.maxEntries * 0.1); // Evict 10%
      
      switch (this.config.evictionPolicy) {
        case 'lru':
          await this.evictLRU(evictCount);
          break;
        case 'lfu':
          await this.evictLFU(evictCount);
          break;
        case 'ttl':
          // TTL-based eviction already handled by evictExpired
          break;
      }
    }
  }

  async getSession(sessionId: string): Promise<AISession | null> {
    const cacheKey = this.getCacheKey('session', sessionId);
    
    try {
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        await this.updateAccessMetadata('session', sessionId);
        await this.updateMetrics(true);
        
        const decompressed = await this.decompress(cached.toString());
        return JSON.parse(decompressed);
      }
      
      await this.updateMetrics(false);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      await this.updateMetrics(false);
      return null;
    }
  }

  async setSession(session: AISession, ttl?: number): Promise<boolean> {
    const cacheKey = this.getCacheKey('session', session.id);
    const metaKey = this.getMetadataKey('session', session.id);
    const now = Date.now();
    const sessionTTL = ttl || this.config.defaultTTL;
    
    try {
      // Check if eviction is needed
      if (await this.shouldEvict()) {
        await this.performEviction();
      }
      
      const sessionData = JSON.stringify(session);
      const compressed = await this.compress(sessionData);
      const size = this.calculateSize(session);
      
      // Store session data
      await this.redis.setex(cacheKey, sessionTTL, compressed);
      
      // Store metadata
      await this.redis.hmset(metaKey, {
        createdAt: now,
        lastAccessed: now,
        ttl: sessionTTL,
        size: size,
        accessCount: 0
      });
      
      // Update index
      await this.redis.zadd(this.getIndexKey(), { score: now, member: `session:${session.id}` });
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async getMessages(sessionId: string, limit?: number, offset?: number): Promise<AIMessage[]> {
    const cacheKey = this.getCacheKey('messages', sessionId);
    
    try {
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        await this.updateAccessMetadata('messages', sessionId);
        await this.updateMetrics(true);
        
        const decompressed = await this.decompress(cached.toString());
        let messages: AIMessage[] = JSON.parse(decompressed);
        
        // Apply pagination if specified
        if (offset !== undefined || limit !== undefined) {
          const start = offset || 0;
          const end = limit ? start + limit : messages.length;
          messages = messages.slice(start, end);
        }
        
        return messages;
      }
      
      await this.updateMetrics(false);
      return [];
    } catch (error) {
      console.error('Cache get messages error:', error);
      await this.updateMetrics(false);
      return [];
    }
  }

  async setMessages(sessionId: string, messages: AIMessage[], ttl?: number): Promise<boolean> {
    const cacheKey = this.getCacheKey('messages', sessionId);
    const metaKey = this.getMetadataKey('messages', sessionId);
    const now = Date.now();
    const messagesTTL = ttl || this.config.defaultTTL;
    
    try {
      if (await this.shouldEvict()) {
        await this.performEviction();
      }
      
      const messagesData = JSON.stringify(messages);
      const compressed = await this.compress(messagesData);
      const size = this.calculateSize(messages);
      
      await this.redis.setex(cacheKey, messagesTTL, compressed);
      
      await this.redis.hmset(metaKey, {
        createdAt: now,
        lastAccessed: now,
        ttl: messagesTTL,
        size: size,
        accessCount: 0
      });
      
      await this.redis.zadd(this.getIndexKey(), { score: now, member: `messages:${sessionId}` });
      
      return true;
    } catch (error) {
      console.error('Cache set messages error:', error);
      return false;
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionKey = this.getCacheKey('session', sessionId);
      const messagesKey = this.getCacheKey('messages', sessionId);
      const sessionMetaKey = this.getMetadataKey('session', sessionId);
      const messagesMetaKey = this.getMetadataKey('messages', sessionId);
      const indexKey = this.getIndexKey();
      
      await Promise.all([
        this.redis.del(sessionKey),
        this.redis.del(messagesKey),
        this.redis.del(sessionMetaKey),
        this.redis.del(messagesMetaKey),
        this.redis.zrem(indexKey, `session:${sessionId}`),
        this.redis.zrem(indexKey, `messages:${sessionId}`)
      ]);
      
      return true;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return 0;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      this.metrics = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0
      };
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    if (!this.config.enableMetrics) {
      return this.metrics;
    }
    
    try {
      // Get updated metrics from Redis
      const redisMetrics = await this.redis.hmget('session_cache:metrics', 
        'hits', 'misses', 'evictions', 'totalEntries', 'totalSize', 'hitRate'
      );
      
      return {
        hits: parseInt(redisMetrics.hits?.toString() || '0'),
        misses: parseInt(redisMetrics.misses?.toString() || '0'),
        evictions: parseInt(redisMetrics.evictions?.toString() || '0'),
        totalEntries: parseInt(redisMetrics.totalEntries?.toString() || '0'),
        totalSize: parseInt(redisMetrics.totalSize?.toString() || '0'),
        hitRate: parseFloat(redisMetrics.hitRate?.toString() || '0')
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return this.metrics;
    }
  }

  async warmup(sessionIds: string[]): Promise<void> {
    // Pre-load frequently accessed sessions
    const promises = sessionIds.map(async (sessionId) => {
      try {
        // This would typically fetch from the database and populate cache
        // For now, we just ensure the cache entry exists
        const exists = await this.redis.exists(this.getCacheKey('session', sessionId));
        if (!exists) {
          console.log(`Cache miss during warmup for session: ${sessionId}`);
        }
      } catch (error) {
        console.error(`Warmup error for session ${sessionId}:`, error);
      }
    });
    
    await Promise.all(promises);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    details: any;
  }> {
    const start = Date.now();
    
    try {
      // Test basic operations
      const testKey = 'health_check_test';
      const testData = { test: true, timestamp: start };
      
      await this.redis.set(testKey, JSON.stringify(testData), { ex: 60 });
      const retrieved = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const latency = Date.now() - start;
      const stats = await this.getStats();
      
      const status = latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy';
      
      return {
        status,
        latency,
        details: {
          stats,
          config: this.config,
          testPassed: retrieved !== null
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Singleton instance
let cacheInstance: SessionCache | null = null;

export function getSessionCache(config?: Partial<CacheConfig>): SessionCache {
  if (!cacheInstance) {
    cacheInstance = new SessionCache(config);
  }
  return cacheInstance;
}

// Helper functions
export async function cacheSession(session: AISession, ttl?: number): Promise<boolean> {
  const cache = getSessionCache();
  return cache.setSession(session, ttl);
}

export async function getCachedSession(sessionId: string): Promise<AISession | null> {
  const cache = getSessionCache();
  return cache.getSession(sessionId);
}

export async function invalidateSessionCache(sessionId: string): Promise<boolean> {
  const cache = getSessionCache();
  return cache.invalidateSession(sessionId);
}