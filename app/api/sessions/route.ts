import { NextRequest, NextResponse } from 'next/server';
import { SessionQueueManager } from '@/lib/sessionQueue';
import { SessionJobData, SessionOperationType, AISession, SessionMetadata } from '@/types/ai-playground';
// Import MongoDB only when needed to avoid build issues
let MongoClient: any;
let Collection: any;

try {
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  Collection = mongodb.Collection;
} catch (error) {
  console.warn('MongoDB not available in build environment');
}

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'exprezzzo_sessions';

interface SessionDocument extends AISession {
  _id?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  metadata: SessionMetadata;
}

interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  filter?: 'active' | 'archived' | 'favorited' | 'shared';
  search?: string;
  tags?: string[];
}

interface BatchOperationRequest {
  sessionIds: string[];
  operation: 'delete' | 'archive' | 'favorite' | 'tag' | 'export';
  params?: Record<string, any>;
}

interface SessionForkRequest {
  sourceSessionId: string;
  forkPointIndex?: number;
  newTitle?: string;
  preserveMetadata?: boolean;
}

interface SessionMergeRequest {
  primarySessionId: string;
  secondarySessionId: string;
  mergeStrategy: 'append' | 'interleave' | 'selective';
  conflictResolution?: 'primary' | 'secondary' | 'manual';
}

class SessionManager {
  private client: MongoClient | null = null;
  private collection: Collection<SessionDocument> | null = null;
  private queueManager: SessionQueueManager;

  constructor() {
    this.queueManager = new SessionQueueManager();
  }

  private async connect() {
    if (!this.client) {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.collection = this.client.db(DB_NAME).collection<SessionDocument>('sessions');
      
      // Create indexes for performance
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      await this.collection.createIndex({ 'metadata.tags': 1 });
      await this.collection.createIndex({ title: 'text', 'messages.content': 'text' });
      await this.collection.createIndex({ 'metadata.status': 1 });
    }
  }

  async createSession(sessionData: Partial<AISession>, userId?: string): Promise<string> {
    await this.connect();
    
    const session: SessionDocument = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sessionData.title || 'New Session',
      messages: sessionData.messages || [],
      modelConfigs: sessionData.modelConfigs || [],
      settings: sessionData.settings || {
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: '',
        streamingEnabled: true
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        messageCount: sessionData.messages?.length || 0,
        tokenCount: 0,
        tags: sessionData.metadata?.tags || [],
        favorited: false,
        shared: false,
        visibility: 'private',
        parentSessionId: sessionData.metadata?.parentSessionId,
        forkHistory: sessionData.metadata?.forkHistory || [],
        ...sessionData.metadata
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId
    };

    await this.collection!.insertOne(session);
    
    // Queue for async processing (indexing, analytics)
    await this.queueManager.addSessionJob({
      sessionId: session.id,
      operation: 'create',
      priority: userId ? 1 : 10,
      data: session
    });

    return session.id;
  }

  async getSessions(query: PaginationQuery, userId?: string): Promise<{
    sessions: AISession[];
    total: number;
    page: number;
    pages: number;
  }> {
    await this.connect();

    const filter: any = {};
    if (userId) filter.userId = userId;
    
    // Apply filters
    if (query.filter) {
      switch (query.filter) {
        case 'active':
          filter['metadata.status'] = 'active';
          break;
        case 'archived':
          filter['metadata.status'] = 'archived';
          break;
        case 'favorited':
          filter['metadata.favorited'] = true;
          break;
        case 'shared':
          filter['metadata.shared'] = true;
          break;
      }
    }

    // Search functionality
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Tag filtering
    if (query.tags && query.tags.length > 0) {
      filter['metadata.tags'] = { $in: query.tags };
    }

    const sortField = query.sortBy || 'updatedAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (query.page - 1) * query.limit;
    
    const [sessions, total] = await Promise.all([
      this.collection!
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(query.limit)
        .toArray(),
      this.collection!.countDocuments(filter)
    ]);

    return {
      sessions: sessions.map(this.transformDocument),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit)
    };
  }

  async getSession(sessionId: string, userId?: string): Promise<AISession | null> {
    await this.connect();
    
    const filter: any = { id: sessionId };
    if (userId) filter.userId = userId;
    
    const session = await this.collection!.findOne(filter);
    return session ? this.transformDocument(session) : null;
  }

  async updateSession(sessionId: string, updates: Partial<AISession>, userId?: string): Promise<boolean> {
    await this.connect();
    
    const filter: any = { id: sessionId };
    if (userId) filter.userId = userId;
    
    const updateDoc = {
      ...updates,
      'metadata.updatedAt': new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection!.updateOne(filter, { $set: updateDoc });
    
    if (result.modifiedCount > 0) {
      // Queue for background processing
      await this.queueManager.addSessionJob({
        sessionId,
        operation: 'update',
        priority: userId ? 1 : 10,
        data: updates
      });
    }

    return result.modifiedCount > 0;
  }

  async deleteSession(sessionId: string, userId?: string): Promise<boolean> {
    await this.connect();
    
    const filter: any = { id: sessionId };
    if (userId) filter.userId = userId;
    
    const result = await this.collection!.deleteOne(filter);
    
    if (result.deletedCount > 0) {
      // Queue cleanup job
      await this.queueManager.addSessionJob({
        sessionId,
        operation: 'delete',
        priority: 1,
        data: { sessionId }
      });
    }

    return result.deletedCount > 0;
  }

  async forkSession(request: SessionForkRequest, userId?: string): Promise<string | null> {
    await this.connect();
    
    const sourceSession = await this.getSession(request.sourceSessionId, userId);
    if (!sourceSession) return null;

    const forkPoint = request.forkPointIndex ?? sourceSession.messages.length;
    const forkedMessages = sourceSession.messages.slice(0, forkPoint);

    const forkedSession: Partial<AISession> = {
      title: request.newTitle || `${sourceSession.title} (Fork)`,
      messages: forkedMessages,
      modelConfigs: sourceSession.modelConfigs,
      settings: { ...sourceSession.settings },
      metadata: {
        ...sourceSession.metadata,
        parentSessionId: sourceSession.id,
        forkHistory: [
          ...sourceSession.metadata.forkHistory,
          {
            sessionId: sourceSession.id,
            forkPoint,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const newSessionId = await this.createSession(forkedSession, userId);
    
    // Queue fork processing job
    await this.queueManager.addSessionJob({
      sessionId: newSessionId,
      operation: 'fork',
      priority: userId ? 1 : 5,
      data: {
        sourceSessionId: request.sourceSessionId,
        forkPoint,
        newSessionId
      }
    });

    return newSessionId;
  }

  async mergeSessions(request: SessionMergeRequest, userId?: string): Promise<string | null> {
    await this.connect();
    
    const [primary, secondary] = await Promise.all([
      this.getSession(request.primarySessionId, userId),
      this.getSession(request.secondarySessionId, userId)
    ]);

    if (!primary || !secondary) return null;

    let mergedMessages = [...primary.messages];

    switch (request.mergeStrategy) {
      case 'append':
        mergedMessages.push(...secondary.messages);
        break;
      
      case 'interleave':
        // Interleave by timestamp
        const allMessages = [...primary.messages, ...secondary.messages]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        mergedMessages = allMessages;
        break;
      
      case 'selective':
        // For now, default to append (would need UI for selective merge)
        mergedMessages.push(...secondary.messages);
        break;
    }

    const mergedSession: Partial<AISession> = {
      title: `${primary.title} + ${secondary.title}`,
      messages: mergedMessages,
      modelConfigs: [...primary.modelConfigs, ...secondary.modelConfigs],
      settings: { ...primary.settings },
      metadata: {
        ...primary.metadata,
        mergedSessions: [request.primarySessionId, request.secondarySessionId],
        updatedAt: new Date()
      }
    };

    const success = await this.updateSession(request.primarySessionId, mergedSession, userId);
    
    if (success) {
      // Queue merge processing job
      await this.queueManager.addSessionJob({
        sessionId: request.primarySessionId,
        operation: 'merge',
        priority: userId ? 1 : 5,
        data: request
      });
    }

    return success ? request.primarySessionId : null;
  }

  async batchOperation(request: BatchOperationRequest, userId?: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    await this.connect();
    
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const sessionId of request.sessionIds) {
      try {
        let success = false;
        
        switch (request.operation) {
          case 'delete':
            success = await this.deleteSession(sessionId, userId);
            break;
          
          case 'archive':
            success = await this.updateSession(sessionId, {
              metadata: { ...{}, status: 'archived' }
            }, userId);
            break;
          
          case 'favorite':
            success = await this.updateSession(sessionId, {
              metadata: { ...{}, favorited: request.params?.favorited ?? true }
            }, userId);
            break;
          
          case 'tag':
            if (request.params?.tags) {
              success = await this.updateSession(sessionId, {
                metadata: { ...{}, tags: request.params.tags }
              }, userId);
            }
            break;
          
          case 'export':
            // Queue export job
            await this.queueManager.addExportJob({
              sessionIds: [sessionId],
              format: request.params?.format || 'json',
              destination: request.params?.destination || 'download',
              priority: userId ? 1 : 10
            });
            success = true;
            break;
        }
        
        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to ${request.operation} session ${sessionId}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing session ${sessionId}: ${error}`);
      }
    }

    return results;
  }

  private transformDocument(doc: SessionDocument): AISession {
    const { _id, createdAt, updatedAt, userId, ...session } = doc;
    return session as AISession;
  }
}

const sessionManager = new SessionManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;
    
    if (body.operation === 'create') {
      const sessionId = await sessionManager.createSession(body.session, userId);
      return NextResponse.json({ sessionId, success: true });
    }
    
    if (body.operation === 'fork') {
      const sessionId = await sessionManager.forkSession(body as SessionForkRequest, userId);
      return NextResponse.json({ sessionId, success: !!sessionId });
    }
    
    if (body.operation === 'merge') {
      const sessionId = await sessionManager.mergeSessions(body as SessionMergeRequest, userId);
      return NextResponse.json({ sessionId, success: !!sessionId });
    }
    
    if (body.operation === 'batch') {
      const results = await sessionManager.batchOperation(body as BatchOperationRequest, userId);
      return NextResponse.json(results);
    }
    
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const userId = request.headers.get('x-user-id') || undefined;
    
    if (sessionId) {
      // Get single session
      const session = await sessionManager.getSession(sessionId, userId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json(session);
    } else {
      // Get sessions with pagination
      const query: PaginationQuery = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
        sortBy: searchParams.get('sortBy') as any || 'updatedAt',
        sortOrder: searchParams.get('sortOrder') as any || 'desc',
        filter: searchParams.get('filter') as any,
        search: searchParams.get('search') || undefined,
        tags: searchParams.get('tags')?.split(',') || undefined
      };
      
      const result = await sessionManager.getSessions(query, userId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const userId = request.headers.get('x-user-id') || undefined;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    const updates = await request.json();
    const success = await sessionManager.updateSession(sessionId, updates, userId);
    
    if (!success) {
      return NextResponse.json({ error: 'Session not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const userId = request.headers.get('x-user-id') || undefined;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    const success = await sessionManager.deleteSession(sessionId, userId);
    
    if (!success) {
      return NextResponse.json({ error: 'Session not found or delete failed' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}