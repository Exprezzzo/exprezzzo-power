import { NextRequest, NextResponse } from 'next/server';
import { AISession } from '@/types/ai-playground';
import crypto from 'crypto';
// Import MongoDB and bcrypt only when needed to avoid build issues
let MongoClient: any;
let Collection: any;
let bcrypt: any;

try {
  const mongodb = require('mongodb');
  MongoClient = mongodb.MongoClient;
  Collection = mongodb.Collection;
} catch (error) {
  console.warn('MongoDB not available in build environment');
}

try {
  bcrypt = require('bcrypt');
} catch (error) {
  console.warn('bcrypt not available in build environment');
}

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'exprezzzo_shares';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface ShareRequest {
  sessionId: string;
  expiresIn?: number; // hours
  password?: string;
  allowComments?: boolean;
  allowDownload?: boolean;
  trackViews?: boolean;
  customSlug?: string;
  description?: string;
}

interface ShareDocument {
  shareId: string;
  sessionId: string;
  shareUrl: string;
  createdAt: Date;
  expiresAt: Date;
  passwordHash?: string;
  allowComments: boolean;
  allowDownload: boolean;
  trackViews: boolean;
  customSlug?: string;
  description?: string;
  isActive: boolean;
  
  // Analytics
  viewCount: number;
  uniqueViewers: string[];
  lastViewed?: Date;
  referrers: { [key: string]: number };
  countries: { [key: string]: number };
  devices: { [key: string]: number };
  
  // User info
  userId?: string;
  creatorName?: string;
}

interface ShareView {
  shareId: string;
  viewedAt: Date;
  ipHash: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  sessionDuration?: number;
}

class ShareManager {
  private client: MongoClient | null = null;
  private sharesCollection: Collection<ShareDocument> | null = null;
  private viewsCollection: Collection<ShareView> | null = null;
  private sessionsCollection: Collection | null = null;

  constructor() {}

  private async connect() {
    if (!this.client) {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      
      const db = this.client.db(DB_NAME);
      this.sharesCollection = db.collection<ShareDocument>('shares');
      this.viewsCollection = db.collection<ShareView>('views');
      this.sessionsCollection = this.client.db('exprezzzo_sessions').collection('sessions');
      
      // Create indexes
      await this.sharesCollection.createIndex({ shareId: 1 }, { unique: true });
      await this.sharesCollection.createIndex({ sessionId: 1 });
      await this.sharesCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await this.sharesCollection.createIndex({ customSlug: 1 }, { unique: true, sparse: true });
      
      await this.viewsCollection.createIndex({ shareId: 1 });
      await this.viewsCollection.createIndex({ viewedAt: -1 });
      await this.viewsCollection.createIndex({ ipHash: 1 });
    }
  }

  private generateShareId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateSlug(): string {
    const adjectives = ['amazing', 'brilliant', 'clever', 'dynamic', 'elegant', 'fantastic', 'genius', 'inspired'];
    const nouns = ['chat', 'conversation', 'discussion', 'exchange', 'dialogue', 'session', 'talk', 'interaction'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    
    return `${adj}-${noun}-${num}`;
  }

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default_salt').digest('hex');
  }

  private getClientInfo(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const referrer = request.headers.get('referer');
    
    // Simple device detection
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';
    
    // Simple browser detection
    let browser = 'unknown';
    if (/chrome/i.test(userAgent)) browser = 'chrome';
    else if (/firefox/i.test(userAgent)) browser = 'firefox';
    else if (/safari/i.test(userAgent)) browser = 'safari';
    else if (/edge/i.test(userAgent)) browser = 'edge';
    
    return {
      ip,
      ipHash: this.hashIp(ip),
      userAgent,
      referrer,
      device,
      browser
    };
  }

  async createShare(shareRequest: ShareRequest, userId?: string): Promise<{
    shareId: string;
    shareUrl: string;
    expiresAt: Date;
  }> {
    await this.connect();
    
    // Verify session exists and user has access
    const filter: any = { id: shareRequest.sessionId };
    if (userId) filter.userId = userId;
    
    const session = await this.sessionsCollection!.findOne(filter);
    if (!session) {
      throw new Error('Session not found or access denied');
    }

    const shareId = this.generateShareId();
    const customSlug = shareRequest.customSlug || this.generateSlug();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (shareRequest.expiresIn || 72)); // Default 3 days
    
    let passwordHash: string | undefined;
    if (shareRequest.password) {
      passwordHash = await this.hashPassword(shareRequest.password);
    }

    const shareDoc: ShareDocument = {
      shareId,
      sessionId: shareRequest.sessionId,
      shareUrl: `${BASE_URL}/share/${customSlug}`,
      createdAt: new Date(),
      expiresAt,
      passwordHash,
      allowComments: shareRequest.allowComments ?? true,
      allowDownload: shareRequest.allowDownload ?? false,
      trackViews: shareRequest.trackViews ?? true,
      customSlug,
      description: shareRequest.description,
      isActive: true,
      
      viewCount: 0,
      uniqueViewers: [],
      referrers: {},
      countries: {},
      devices: {},
      
      userId,
      creatorName: session.title || 'Anonymous'
    };

    try {
      await this.sharesCollection!.insertOne(shareDoc);
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - try with different slug
        shareDoc.customSlug = this.generateSlug();
        shareDoc.shareUrl = `${BASE_URL}/share/${shareDoc.customSlug}`;
        await this.sharesCollection!.insertOne(shareDoc);
      } else {
        throw error;
      }
    }

    return {
      shareId,
      shareUrl: shareDoc.shareUrl,
      expiresAt
    };
  }

  async getShare(identifier: string, password?: string): Promise<{
    share: ShareDocument;
    session: AISession;
  } | null> {
    await this.connect();
    
    // Find by shareId or customSlug
    const share = await this.sharesCollection!.findOne({
      $or: [
        { shareId: identifier },
        { customSlug: identifier }
      ],
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!share) return null;

    // Check password if required
    if (share.passwordHash && !password) {
      throw new Error('Password required');
    }

    if (share.passwordHash && password) {
      const isValid = await this.verifyPassword(password, share.passwordHash);
      if (!isValid) {
        throw new Error('Invalid password');
      }
    }

    // Get session data
    const session = await this.sessionsCollection!.findOne({ id: share.sessionId });
    if (!session) return null;

    return {
      share,
      session: this.transformSessionDocument(session)
    };
  }

  async trackView(shareId: string, request: NextRequest): Promise<void> {
    await this.connect();
    
    const share = await this.sharesCollection!.findOne({ shareId, isActive: true });
    if (!share || !share.trackViews) return;

    const clientInfo = this.getClientInfo(request);
    
    // Record detailed view
    const view: ShareView = {
      shareId,
      viewedAt: new Date(),
      ipHash: clientInfo.ipHash,
      userAgent: clientInfo.userAgent,
      referrer: clientInfo.referrer,
      device: clientInfo.device,
      browser: clientInfo.browser
    };

    await this.viewsCollection!.insertOne(view);

    // Update share analytics
    const isUniqueViewer = !share.uniqueViewers.includes(clientInfo.ipHash);
    
    const updateDoc: any = {
      $inc: { viewCount: 1 },
      $set: { lastViewed: new Date() }
    };

    if (isUniqueViewer) {
      updateDoc.$addToSet = { uniqueViewers: clientInfo.ipHash };
    }

    // Update referrer stats
    if (clientInfo.referrer) {
      const referrerDomain = new URL(clientInfo.referrer).hostname;
      updateDoc.$inc[`referrers.${referrerDomain}`] = 1;
    }

    // Update device stats
    if (clientInfo.device) {
      updateDoc.$inc[`devices.${clientInfo.device}`] = 1;
    }

    await this.sharesCollection!.updateOne(
      { shareId },
      updateDoc
    );
  }

  async getShareAnalytics(shareId: string, userId?: string): Promise<{
    share: ShareDocument;
    analytics: {
      totalViews: number;
      uniqueViews: number;
      avgSessionTime: number;
      topReferrers: Array<{ domain: string; count: number }>;
      deviceBreakdown: Array<{ device: string; count: number }>;
      viewsOverTime: Array<{ date: string; views: number }>;
    };
  } | null> {
    await this.connect();

    const share = await this.sharesCollection!.findOne({
      shareId,
      ...(userId && { userId })
    });

    if (!share) return null;

    // Get view analytics
    const views = await this.viewsCollection!.find({ shareId }).toArray();
    
    const totalViews = views.length;
    const uniqueViews = share.uniqueViewers.length;
    
    // Calculate average session time (placeholder - would need more tracking)
    const avgSessionTime = 0;

    // Top referrers
    const topReferrers = Object.entries(share.referrers)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device breakdown
    const deviceBreakdown = Object.entries(share.devices)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Views over time (last 30 days)
    const viewsOverTime = this.calculateViewsOverTime(views);

    return {
      share,
      analytics: {
        totalViews,
        uniqueViews,
        avgSessionTime,
        topReferrers,
        deviceBreakdown,
        viewsOverTime
      }
    };
  }

  private calculateViewsOverTime(views: ShareView[]): Array<{ date: string; views: number }> {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const viewsByDate: { [key: string]: number } = {};
    
    views.forEach(view => {
      const date = new Date(view.viewedAt).toISOString().split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    return last30Days.map(date => ({
      date,
      views: viewsByDate[date] || 0
    }));
  }

  async updateShare(shareId: string, updates: Partial<ShareDocument>, userId?: string): Promise<boolean> {
    await this.connect();
    
    const filter: any = { shareId };
    if (userId) filter.userId = userId;
    
    const result = await this.sharesCollection!.updateOne(filter, { $set: updates });
    return result.modifiedCount > 0;
  }

  async deleteShare(shareId: string, userId?: string): Promise<boolean> {
    await this.connect();
    
    const filter: any = { shareId };
    if (userId) filter.userId = userId;
    
    const result = await this.sharesCollection!.updateOne(
      filter,
      { $set: { isActive: false } }
    );
    
    return result.modifiedCount > 0;
  }

  async getUserShares(userId: string, page: number = 1, limit: number = 20): Promise<{
    shares: ShareDocument[];
    total: number;
  }> {
    await this.connect();
    
    const skip = (page - 1) * limit;
    
    const [shares, total] = await Promise.all([
      this.sharesCollection!
        .find({ userId, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.sharesCollection!.countDocuments({ userId, isActive: true })
    ]);

    return { shares, total };
  }

  private transformSessionDocument(doc: any): AISession {
    const { _id, createdAt, updatedAt, userId, ...session } = doc;
    return session as AISession;
  }
}

const shareManager = new ShareManager();

export async function POST(request: NextRequest) {
  try {
    const shareRequest: ShareRequest = await request.json();
    const userId = request.headers.get('x-user-id') || undefined;

    if (!shareRequest.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await shareManager.createShare(shareRequest, userId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Share creation error:', error);
    
    if (error instanceof Error && error.message === 'Session not found or access denied') {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');
    const password = searchParams.get('password');
    const analytics = searchParams.get('analytics') === 'true';
    const userId = request.headers.get('x-user-id') || undefined;

    if (!shareId) {
      // Get user's shares
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      
      const result = await shareManager.getUserShares(userId, page, limit);
      return NextResponse.json(result);
    }

    if (analytics) {
      // Get share analytics
      const result = await shareManager.getShareAnalytics(shareId, userId);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Share not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result);
    } else {
      // Get share content
      try {
        const result = await shareManager.getShare(shareId, password || undefined);
        
        if (!result) {
          return NextResponse.json(
            { error: 'Share not found or expired' },
            { status: 404 }
          );
        }
        
        // Track the view
        await shareManager.trackView(shareId, request);
        
        return NextResponse.json(result);
      } catch (error) {
        if (error instanceof Error && error.message === 'Password required') {
          return NextResponse.json(
            { error: 'Password required', requiresPassword: true },
            { status: 401 }
          );
        }
        
        if (error instanceof Error && error.message === 'Invalid password') {
          return NextResponse.json(
            { error: 'Invalid password' },
            { status: 401 }
          );
        }
        
        throw error;
      }
    }
  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');
    const userId = request.headers.get('x-user-id') || undefined;

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const success = await shareManager.updateShare(shareId, updates, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Share not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share update error:', error);
    return NextResponse.json(
      { error: 'Failed to update share' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');
    const userId = request.headers.get('x-user-id') || undefined;

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const success = await shareManager.deleteShare(shareId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Share not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}