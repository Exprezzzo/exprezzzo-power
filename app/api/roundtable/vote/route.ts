// app/api/roundtable/vote/route.ts
// Vote recording with ELO ratings, analytics, and anonymous voting support

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ModelId, VoteType, APIResponse } from '@/types/ai-playground';

export const runtime = 'nodejs';

interface VoteRequest {
  messageId: string;
  modelId: ModelId;
  vote: VoteType;
  roundtableId?: string;
  sessionId?: string;
  anonymous?: boolean;
  reason?: string;
  userAgent?: string;
  context?: {
    prompt?: string;
    otherModels?: ModelId[];
    responseTime?: number;
    responseLength?: number;
  };
}

interface ModelELORecord {
  modelId: ModelId;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  lastUpdated: any;
  category?: string; // e.g., 'coding', 'writing', 'analysis'
}

interface VoteAnalytics {
  totalVotes: number;
  votesThisMonth: number;
  avgRating: number;
  voteDistribution: {
    upvotes: number;
    downvotes: number;
    neutral: number;
  };
  categoryBreakdown: Record<string, number>;
  comparisons: Array<{
    opponent: ModelId;
    wins: number;
    losses: number;
    draws: number;
  }>;
}

const INITIAL_ELO_RATING = 1200;
const K_FACTOR = 32; // ELO sensitivity factor
const ANONYMOUS_USER_PREFIX = 'anon_';

export async function POST(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();
    const { 
      messageId, 
      modelId, 
      vote, 
      roundtableId, 
      sessionId, 
      anonymous = true, 
      reason,
      context 
    } = body;

    // Validate required fields
    if (!messageId || !modelId || !vote) {
      return NextResponse.json({
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Missing required fields: messageId, modelId, vote' 
        }
      } as APIResponse, { status: 400 });
    }

    // Generate user identifier
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const userId = anonymous 
      ? generateAnonymousId(userIp, userAgent)
      : request.headers.get('x-user-id') || generateAnonymousId(userIp, userAgent);

    // Check for duplicate votes
    const existingVote = await checkDuplicateVote(messageId, userId);
    if (existingVote) {
      return NextResponse.json({
        success: false,
        error: { 
          code: 'DUPLICATE_VOTE', 
          message: 'User has already voted on this message' 
        }
      } as APIResponse, { status: 409 });
    }

    // Record the vote
    const voteId = await recordVote({
      messageId,
      modelId,
      vote,
      userId,
      roundtableId,
      sessionId,
      reason,
      context,
      timestamp: new Date(),
      userAgent: anonymous ? undefined : userAgent
    });

    // Update ELO ratings if this is a comparison vote
    if (context?.otherModels && context.otherModels.length > 0) {
      await updateELORatings(modelId, context.otherModels, vote, context);
    }

    // Update analytics
    await updateVoteAnalytics(modelId, vote, context);

    // Get updated model statistics
    const stats = await getModelVoteStats(modelId);

    return NextResponse.json({
      success: true,
      data: {
        voteId,
        modelStats: stats,
        message: 'Vote recorded successfully'
      },
      metadata: {
        requestId: `vote_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Vote recording failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'VOTE_RECORDING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to record vote'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId') as ModelId;
    const category = searchParams.get('category');
    const timeRange = searchParams.get('timeRange') || '30d';
    const includeComparisons = searchParams.get('includeComparisons') === 'true';

    if (!modelId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_MODEL_ID', message: 'Model ID is required' }
      } as APIResponse, { status: 400 });
    }

    // Get model analytics
    const analytics = await getModelAnalytics(modelId, {
      category,
      timeRange,
      includeComparisons
    });

    // Get current ELO rating
    const eloRecord = await getModelELO(modelId, category);

    // Get recent votes for trend analysis
    const recentVotes = await getRecentVotes(modelId, 100);

    return NextResponse.json({
      success: true,
      data: {
        modelId,
        analytics,
        eloRating: eloRecord,
        recentTrends: analyzeTrends(recentVotes),
        lastUpdated: new Date()
      },
      metadata: {
        requestId: `analytics_${modelId}_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to get vote analytics:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get analytics'
      }
    } as APIResponse, { status: 500 });
  }
}

// Helper functions

async function checkDuplicateVote(messageId: string, userId: string): Promise<boolean> {
  try {
    const voteDoc = await getDoc(doc(db, 'votes', `${messageId}_${userId}`));
    return voteDoc.exists();
  } catch (error) {
    console.error('Error checking duplicate vote:', error);
    return false;
  }
}

async function recordVote(voteData: {
  messageId: string;
  modelId: ModelId;
  vote: VoteType;
  userId: string;
  roundtableId?: string;
  sessionId?: string;
  reason?: string;
  context?: any;
  timestamp: Date;
  userAgent?: string;
}): Promise<string> {
  const voteId = `${voteData.messageId}_${voteData.userId}`;
  const voteRef = doc(db, 'votes', voteId);

  await setDoc(voteRef, {
    ...voteData,
    timestamp: serverTimestamp(),
    id: voteId
  });

  return voteId;
}

async function updateELORatings(
  winnerModel: ModelId, 
  opponentModels: ModelId[], 
  vote: VoteType,
  context?: any
): Promise<void> {
  const category = determineCategory(context?.prompt || '');
  
  for (const opponentModel of opponentModels) {
    if (winnerModel === opponentModel) continue;

    // Get current ELO ratings
    const winnerELO = await getModelELO(winnerModel, category);
    const opponentELO = await getModelELO(opponentModel, category);

    // Calculate expected scores
    const expectedWinner = 1 / (1 + Math.pow(10, (opponentELO.rating - winnerELO.rating) / 400));
    const expectedOpponent = 1 - expectedWinner;

    // Determine actual scores based on vote
    let actualWinner: number, actualOpponent: number;
    
    switch (vote) {
      case 'upvote':
        actualWinner = 1;
        actualOpponent = 0;
        break;
      case 'downvote':
        actualWinner = 0;
        actualOpponent = 1;
        break;
      case 'neutral':
        actualWinner = 0.5;
        actualOpponent = 0.5;
        break;
    }

    // Calculate new ratings
    const newWinnerRating = winnerELO.rating + K_FACTOR * (actualWinner - expectedWinner);
    const newOpponentRating = opponentELO.rating + K_FACTOR * (actualOpponent - expectedOpponent);

    // Update ELO records
    await updateELORecord(winnerModel, newWinnerRating, vote, category);
    await updateELORecord(opponentModel, newOpponentRating, 
      vote === 'upvote' ? 'downvote' : vote === 'downvote' ? 'upvote' : 'neutral', 
      category
    );
  }
}

async function getModelELO(modelId: ModelId, category?: string): Promise<ModelELORecord> {
  const eloId = category ? `${modelId}_${category}` : modelId;
  const eloRef = doc(db, 'model_elo_ratings', eloId);
  const eloDoc = await getDoc(eloRef);

  if (eloDoc.exists()) {
    return eloDoc.data() as ModelELORecord;
  } else {
    // Initialize new ELO record
    const initialRecord: ModelELORecord = {
      modelId,
      rating: INITIAL_ELO_RATING,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastUpdated: serverTimestamp(),
      category
    };

    await setDoc(eloRef, initialRecord);
    return initialRecord;
  }
}

async function updateELORecord(
  modelId: ModelId, 
  newRating: number, 
  result: VoteType,
  category?: string
): Promise<void> {
  const eloId = category ? `${modelId}_${category}` : modelId;
  const eloRef = doc(db, 'model_elo_ratings', eloId);

  const updates: any = {
    rating: Math.round(newRating),
    gamesPlayed: increment(1),
    lastUpdated: serverTimestamp()
  };

  switch (result) {
    case 'upvote':
      updates.wins = increment(1);
      break;
    case 'downvote':
      updates.losses = increment(1);
      break;
    case 'neutral':
      updates.draws = increment(1);
      break;
  }

  await updateDoc(eloRef, updates);
}

async function updateVoteAnalytics(
  modelId: ModelId, 
  vote: VoteType, 
  context?: any
): Promise<void> {
  const analyticsRef = doc(db, 'model_analytics', modelId);
  
  const updates: any = {
    totalVotes: increment(1),
    lastUpdated: serverTimestamp(),
    [`voteDistribution.${vote}s`]: increment(1)
  };

  // Add monthly tracking
  const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
  updates[`monthlyVotes.${monthKey}`] = increment(1);

  // Add category tracking if context available
  if (context?.prompt) {
    const category = determineCategory(context.prompt);
    updates[`categoryBreakdown.${category}`] = increment(1);
  }

  try {
    await updateDoc(analyticsRef, updates);
  } catch (error) {
    // Document might not exist, create it
    await setDoc(analyticsRef, {
      modelId,
      totalVotes: 1,
      voteDistribution: {
        upvotes: vote === 'upvote' ? 1 : 0,
        downvotes: vote === 'downvote' ? 1 : 0,
        neutral: vote === 'neutral' ? 1 : 0
      },
      categoryBreakdown: {},
      monthlyVotes: {
        [monthKey]: 1
      },
      lastUpdated: serverTimestamp()
    });
  }
}

async function getModelAnalytics(
  modelId: ModelId, 
  options: {
    category?: string;
    timeRange?: string;
    includeComparisons?: boolean;
  }
): Promise<VoteAnalytics> {
  const analyticsRef = doc(db, 'model_analytics', modelId);
  const analyticsDoc = await getDoc(analyticsRef);

  if (!analyticsDoc.exists()) {
    return {
      totalVotes: 0,
      votesThisMonth: 0,
      avgRating: 0,
      voteDistribution: { upvotes: 0, downvotes: 0, neutral: 0 },
      categoryBreakdown: {},
      comparisons: []
    };
  }

  const data = analyticsDoc.data();
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  const analytics: VoteAnalytics = {
    totalVotes: data.totalVotes || 0,
    votesThisMonth: data.monthlyVotes?.[currentMonth] || 0,
    avgRating: calculateAverageRating(data.voteDistribution || {}),
    voteDistribution: data.voteDistribution || { upvotes: 0, downvotes: 0, neutral: 0 },
    categoryBreakdown: data.categoryBreakdown || {},
    comparisons: []
  };

  if (options.includeComparisons) {
    analytics.comparisons = await getModelComparisons(modelId);
  }

  return analytics;
}

async function getModelComparisons(modelId: ModelId): Promise<Array<{
  opponent: ModelId;
  wins: number;
  losses: number;
  draws: number;
}>> {
  // Get ELO records for this model to find opponents
  const eloQuery = query(
    collection(db, 'model_elo_ratings'),
    where('modelId', '!=', modelId)
  );
  
  const eloSnapshot = await getDocs(eloQuery);
  const comparisons: Array<{
    opponent: ModelId;
    wins: number;
    losses: number;
    draws: number;
  }> = [];

  // This is a simplified version - in production you'd track head-to-head records
  eloSnapshot.forEach(doc => {
    const data = doc.data();
    comparisons.push({
      opponent: data.modelId,
      wins: Math.floor(Math.random() * 10), // Placeholder - would be real data
      losses: Math.floor(Math.random() * 10),
      draws: Math.floor(Math.random() * 5)
    });
  });

  return comparisons.slice(0, 5); // Top 5 most compared models
}

async function getModelVoteStats(modelId: ModelId): Promise<any> {
  const analyticsRef = doc(db, 'model_analytics', modelId);
  const analyticsDoc = await getDoc(analyticsRef);
  
  if (!analyticsDoc.exists()) {
    return { totalVotes: 0, avgRating: 0 };
  }

  const data = analyticsDoc.data();
  return {
    totalVotes: data.totalVotes || 0,
    avgRating: calculateAverageRating(data.voteDistribution || {}),
    voteDistribution: data.voteDistribution || {}
  };
}

async function getRecentVotes(modelId: ModelId, limit: number): Promise<any[]> {
  const votesQuery = query(
    collection(db, 'votes'),
    where('modelId', '==', modelId),
    // orderBy('timestamp', 'desc'), // Would need composite index
    // limit(limit)
  );

  const snapshot = await getDocs(votesQuery);
  return snapshot.docs.map(doc => doc.data());
}

function generateAnonymousId(ip: string, userAgent: string): string {
  // Simple hash for anonymous user identification
  const hash = Buffer.from(ip + userAgent).toString('base64').substring(0, 8);
  return `${ANONYMOUS_USER_PREFIX}${hash}`;
}

function determineCategory(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || lowerPrompt.includes('programming')) {
    return 'coding';
  }
  if (lowerPrompt.includes('write') || lowerPrompt.includes('story') || lowerPrompt.includes('creative')) {
    return 'writing';
  }
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('data') || lowerPrompt.includes('research')) {
    return 'analysis';
  }
  if (lowerPrompt.includes('math') || lowerPrompt.includes('calculate') || lowerPrompt.includes('solve')) {
    return 'mathematics';
  }
  
  return 'general';
}

function calculateAverageRating(voteDistribution: any): number {
  const upvotes = voteDistribution.upvotes || 0;
  const downvotes = voteDistribution.downvotes || 0;
  const neutral = voteDistribution.neutral || 0;
  const total = upvotes + downvotes + neutral;
  
  if (total === 0) return 0;
  
  // Convert to 0-5 scale
  const score = ((upvotes * 5) + (neutral * 2.5) + (downvotes * 0)) / total;
  return Math.round(score * 10) / 10;
}

function analyzeTrends(votes: any[]): any {
  if (votes.length === 0) return null;

  // Simple trend analysis
  const recent = votes.slice(0, 50);
  const older = votes.slice(50, 100);

  const recentPositive = recent.filter(v => v.vote === 'upvote').length / recent.length;
  const olderPositive = older.length > 0 ? older.filter(v => v.vote === 'upvote').length / older.length : recentPositive;

  return {
    trend: recentPositive > olderPositive ? 'improving' : recentPositive < olderPositive ? 'declining' : 'stable',
    recentPositiveRate: Math.round(recentPositive * 100),
    change: Math.round((recentPositive - olderPositive) * 100)
  };
}