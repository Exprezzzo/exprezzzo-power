// app/api/projects/[projectId]/context/route.ts
// Context priority hierarchy with smart truncation and compression

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { APIResponse } from '@/types/ai-playground';
import { generateEmbeddings, findSimilarContext } from '@/lib/embeddings';
import { summarizeContext } from '@/lib/contextOptimizer';

export const runtime = 'nodejs';

const MAX_CONTEXT_TOKENS = 200000;
const SUMMARIZATION_THRESHOLD = 180000;
const COMPRESSION_THRESHOLD = 160000;
const RELEVANCE_THRESHOLD = 0.7;

interface ContextItem {
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

interface AddContextRequest {
  content: string;
  type: ContextItem['type'];
  priority?: number;
  source: string;
  sessionId?: string;
  tags?: string[];
  autoOptimize?: boolean;
}

interface UpdateContextRequest {
  priority?: number;
  tags?: string[];
  content?: string;
}

interface ContextAnalysis {
  totalTokens: number;
  itemCount: number;
  needsOptimization: boolean;
  suggestions: Array<{
    type: 'summarize' | 'compress' | 'remove' | 'merge';
    items: string[];
    reason: string;
    tokensSaved: number;
  }>;
}

export async function GET(
  request: NextRequest, 
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    
    const includeEmbeddings = searchParams.get('includeEmbeddings') === 'true';
    const priorityMin = parseInt(searchParams.get('priorityMin') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const type = searchParams.get('type') as ContextItem['type'] | null;

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    let contextQuery = db.collection('projects')
      .doc(projectId)
      .collection('context')
      .where('priority', '>=', priorityMin)
      .orderBy('priority', 'desc')
      .limit(limit);

    if (type) {
      contextQuery = contextQuery.where('type', '==', type);
    }

    const snapshot = await contextQuery.get();
    const contextItems: ContextItem[] = [];
    let totalTokens = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const item: ContextItem = {
        id: doc.id,
        content: data.content,
        type: data.type,
        priority: data.priority,
        tokens: data.tokens,
        relevanceScore: data.relevanceScore,
        embedding: includeEmbeddings ? data.embedding : undefined,
        source: data.source,
        sessionId: data.sessionId,
        timestamp: data.timestamp.toDate(),
        tags: data.tags || [],
        compressed: data.compressed || false,
        originalLength: data.originalLength
      };

      contextItems.push(item);
      totalTokens += item.tokens;
    }

    // Generate context analysis
    const analysis: ContextAnalysis = await analyzeContext(contextItems, totalTokens);

    return NextResponse.json({
      success: true,
      data: {
        contextItems,
        totalTokens,
        maxTokens: MAX_CONTEXT_TOKENS,
        utilizationPercent: (totalTokens / MAX_CONTEXT_TOKENS) * 100,
        analysis
      },
      metadata: {
        requestId: `context_${projectId}_${Date.now()}`,
        timestamp: new Date(),
        itemCount: contextItems.length
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to fetch context:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_CONTEXT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch context'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body: AddContextRequest = await request.json();
    const { content, type, priority, source, sessionId, tags, autoOptimize } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Content is required' }
      } as APIResponse, { status: 400 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    const projectRef = db.collection('projects').doc(projectId);

    // Check project exists
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      } as APIResponse, { status: 404 });
    }

    const tokens = estimateTokens(content);
    const currentTokens = projectDoc.data()?.contextTokens || 0;

    // Check if adding this content would exceed limits
    if (currentTokens + tokens > MAX_CONTEXT_TOKENS) {
      if (autoOptimize) {
        // Automatically optimize context to make room
        await optimizeProjectContext(projectId, tokens);
      } else {
        return NextResponse.json({
          success: false,
          error: { 
            code: 'CONTEXT_LIMIT_EXCEEDED', 
            message: `Adding this content would exceed the ${MAX_CONTEXT_TOKENS} token limit` 
          }
        } as APIResponse, { status: 400 });
      }
    }

    // Generate embedding for semantic search
    const embedding = await generateEmbeddings(content);

    // Calculate relevance score based on existing context
    const relevanceScore = await calculateRelevanceScore(projectId, content, embedding);

    // Determine priority if not specified
    const finalPriority = priority ?? calculateAutoPriority(type, relevanceScore, source);

    // Create context item
    const contextRef = projectRef.collection('context').doc();
    const contextItem: Partial<ContextItem> = {
      content,
      type,
      priority: finalPriority,
      tokens,
      relevanceScore,
      embedding,
      source,
      sessionId,
      timestamp: new Date(),
      tags: tags || [],
      compressed: false
    };

    await contextRef.set(contextItem);

    // Update project token count
    await projectRef.update({
      contextTokens: FieldValue.increment(tokens),
      updatedAt: new Date()
    });

    // Check if summarization is needed
    const newTotal = currentTokens + tokens;
    if (newTotal >= SUMMARIZATION_THRESHOLD) {
      // Queue background summarization
      await queueContextSummarization(projectId);
    }

    const createdItem: ContextItem = {
      id: contextRef.id,
      ...contextItem
    } as ContextItem;

    return NextResponse.json({
      success: true,
      data: createdItem,
      metadata: {
        requestId: `add_context_${projectId}_${Date.now()}`,
        timestamp: new Date(),
        tokensAdded: tokens,
        totalTokens: newTotal
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to add context:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'ADD_CONTEXT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to add context'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const contextId = searchParams.get('contextId');

    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_CONTEXT_ID', message: 'Context ID is required' }
      } as APIResponse, { status: 400 });
    }

    const body: UpdateContextRequest = await request.json();

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    const contextRef = db.collection('projects')
      .doc(projectId)
      .collection('context')
      .doc(contextId);

    const contextDoc = await contextRef.get();
    if (!contextDoc.exists) {
      return NextResponse.json({
        success: false,
        error: { code: 'CONTEXT_NOT_FOUND', message: 'Context item not found' }
      } as APIResponse, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Handle content updates (recalculate tokens and embeddings)
    if (body.content && body.content !== contextDoc.data()?.content) {
      const oldTokens = contextDoc.data()?.tokens || 0;
      const newTokens = estimateTokens(body.content);
      const tokenDiff = newTokens - oldTokens;

      updateData.content = body.content;
      updateData.tokens = newTokens;
      updateData.embedding = await generateEmbeddings(body.content);

      // Update project token count
      await db.collection('projects').doc(projectId).update({
        contextTokens: FieldValue.increment(tokenDiff),
        updatedAt: new Date()
      });
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }

    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }

    await contextRef.update(updateData);

    const updatedDoc = await contextRef.get();
    const updatedItem: ContextItem = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as ContextItem;

    return NextResponse.json({
      success: true,
      data: updatedItem,
      metadata: {
        requestId: `update_context_${projectId}_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to update context:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_CONTEXT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update context'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const contextId = searchParams.get('contextId');
    const bulkDelete = searchParams.get('bulk') === 'true';

    if (!contextId && !bulkDelete) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_CONTEXT_ID', message: 'Context ID is required' }
      } as APIResponse, { status: 400 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);

    if (bulkDelete) {
      // Delete multiple context items by criteria
      const body = await request.json();
      const { contextIds, priority, type, olderThan } = body;

      const batch = db.batch();
      let query = db.collection('projects').doc(projectId).collection('context');

      if (contextIds && contextIds.length > 0) {
        // Delete specific IDs
        for (const id of contextIds) {
          const contextRef = db.collection('projects').doc(projectId).collection('context').doc(id);
          batch.delete(contextRef);
        }
      } else {
        // Delete by criteria
        if (priority !== undefined) {
          query = query.where('priority', '<=', priority);
        }
        if (type) {
          query = query.where('type', '==', type);
        }
        if (olderThan) {
          query = query.where('timestamp', '<', new Date(olderThan));
        }

        const snapshot = await query.get();
        let totalTokensRemoved = 0;

        snapshot.docs.forEach(doc => {
          totalTokensRemoved += doc.data().tokens || 0;
          batch.delete(doc.ref);
        });

        // Update project token count
        if (totalTokensRemoved > 0) {
          const projectRef = db.collection('projects').doc(projectId);
          batch.update(projectRef, {
            contextTokens: FieldValue.increment(-totalTokensRemoved),
            updatedAt: new Date()
          });
        }
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        data: { deleted: true, method: 'bulk' },
        metadata: {
          requestId: `bulk_delete_context_${projectId}_${Date.now()}`,
          timestamp: new Date()
        }
      } as APIResponse);

    } else {
      // Delete single context item
      const contextRef = db.collection('projects')
        .doc(projectId)
        .collection('context')
        .doc(contextId!);

      const contextDoc = await contextRef.get();
      if (!contextDoc.exists) {
        return NextResponse.json({
          success: false,
          error: { code: 'CONTEXT_NOT_FOUND', message: 'Context item not found' }
        } as APIResponse, { status: 404 });
      }

      const tokens = contextDoc.data()?.tokens || 0;

      await contextRef.delete();

      // Update project token count
      await db.collection('projects').doc(projectId).update({
        contextTokens: FieldValue.increment(-tokens),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        data: { deleted: true, tokensRemoved: tokens },
        metadata: {
          requestId: `delete_context_${projectId}_${Date.now()}`,
          timestamp: new Date()
        }
      } as APIResponse);
    }

  } catch (error) {
    console.error('Failed to delete context:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETE_CONTEXT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete context'
      }
    } as APIResponse, { status: 500 });
  }
}

// Helper functions
function estimateTokens(text: string): number {
  const words = text.split(/\s+/).length;
  const characters = text.length;
  return Math.ceil(Math.max(words * 1.3, characters / 3.5));
}

async function calculateRelevanceScore(
  projectId: string, 
  content: string, 
  embedding: number[]
): Promise<number> {
  try {
    const adminApp = getAdminApp();
    if (!adminApp) return 0.5;

    const db = getFirestore(adminApp);
    const recentContext = await db.collection('projects')
      .doc(projectId)
      .collection('context')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (recentContext.empty) return 0.8; // High relevance for first content

    // Find most similar context item
    let maxSimilarity = 0;
    for (const doc of recentContext.docs) {
      const contextEmbedding = doc.data().embedding;
      if (contextEmbedding) {
        const similarity = cosineSimilarity(embedding, contextEmbedding);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    return maxSimilarity;
  } catch (error) {
    console.error('Failed to calculate relevance:', error);
    return 0.5;
  }
}

function calculateAutoPriority(
  type: ContextItem['type'], 
  relevanceScore: number, 
  source: string
): number {
  let basePriority = 50;

  // Type-based priority
  switch (type) {
    case 'summary': basePriority = 90; break;
    case 'reference': basePriority = 80; break;
    case 'file': basePriority = 70; break;
    case 'message': basePriority = 60; break;
    case 'note': basePriority = 40; break;
  }

  // Relevance adjustment
  const relevanceBoost = (relevanceScore - 0.5) * 40; // -20 to +20

  // Source adjustment
  const sourceBoost = source === 'user' ? 10 : 0;

  return Math.max(0, Math.min(100, basePriority + relevanceBoost + sourceBoost));
}

async function analyzeContext(items: ContextItem[], totalTokens: number): Promise<ContextAnalysis> {
  const suggestions = [];

  if (totalTokens > COMPRESSION_THRESHOLD) {
    // Find low-priority items for removal
    const lowPriorityItems = items
      .filter(item => item.priority < 30)
      .sort((a, b) => a.priority - b.priority);

    if (lowPriorityItems.length > 0) {
      const tokensSaved = lowPriorityItems.slice(0, 5).reduce((sum, item) => sum + item.tokens, 0);
      suggestions.push({
        type: 'remove' as const,
        items: lowPriorityItems.slice(0, 5).map(item => item.id),
        reason: 'Low priority items consuming significant tokens',
        tokensSaved
      });
    }

    // Find similar items for merging
    const messageItems = items.filter(item => item.type === 'message');
    if (messageItems.length > 10) {
      suggestions.push({
        type: 'summarize' as const,
        items: messageItems.slice(-10).map(item => item.id),
        reason: 'Recent messages can be summarized',
        tokensSaved: Math.floor(messageItems.slice(-10).reduce((sum, item) => sum + item.tokens, 0) * 0.7)
      });
    }
  }

  return {
    totalTokens,
    itemCount: items.length,
    needsOptimization: totalTokens > SUMMARIZATION_THRESHOLD,
    suggestions
  };
}

async function optimizeProjectContext(projectId: string, tokensNeeded: number): Promise<void> {
  // Implementation for automatic context optimization
  const adminApp = getAdminApp();
  if (!adminApp) return;

  const db = getFirestore(adminApp);
  
  // Get low-priority items
  const lowPriorityQuery = await db.collection('projects')
    .doc(projectId)
    .collection('context')
    .where('priority', '<', 40)
    .orderBy('priority', 'asc')
    .limit(10)
    .get();

  const batch = db.batch();
  let tokensSaved = 0;

  for (const doc of lowPriorityQuery.docs) {
    const tokens = doc.data().tokens || 0;
    tokensSaved += tokens;
    batch.delete(doc.ref);

    if (tokensSaved >= tokensNeeded * 1.2) break; // Add 20% buffer
  }

  await batch.commit();

  // Update project token count
  await db.collection('projects').doc(projectId).update({
    contextTokens: FieldValue.increment(-tokensSaved)
  });
}

async function queueContextSummarization(projectId: string): Promise<void> {
  // Queue background job for context summarization
  // This would typically integrate with a job queue system
  console.log(`Queuing context summarization for project ${projectId}`);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}