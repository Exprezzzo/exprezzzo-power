import { NextRequest, NextResponse } from 'next/server';

interface Metrics {
  totalUsers: number;
  activeNow: number;
  avgResponseTime: number;
  totalMessages: number;
  modelUsage: Array<{ name: string; value: number; color: string }>;
  costToday: number;
  errorRate: number;
  satisfaction: number;
  hourlyActivity: Array<{ hour: string; messages: number }>;
  topModels: Array<{ model: string; requests: number; avgTime: number }>;
}

export async function GET(req: NextRequest) {
  try {
    // In production, fetch from database/analytics service
    const metrics: Metrics = {
      totalUsers: 1247,
      activeNow: 89,
      avgResponseTime: 187,
      totalMessages: 45678,
      modelUsage: [
        { name: 'GPT-4', value: 45, color: '#FFD700' },
        { name: 'Claude', value: 30, color: '#FF6B6B' },
        { name: 'Gemini', value: 20, color: '#4ECDC4' },
        { name: 'Groq', value: 5, color: '#45B7D1' }
      ],
      costToday: 42.58,
      errorRate: 0.02,
      satisfaction: 4.7,
      hourlyActivity: generateHourlyActivity(),
      topModels: [
        { model: 'gpt-4o', requests: 2341, avgTime: 145 },
        { model: 'claude-3-5-sonnet', requests: 1876, avgTime: 203 },
        { model: 'gemini-pro', requests: 987, avgTime: 89 }
      ]
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

function generateHourlyActivity() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    messages: Math.floor(Math.random() * 500) + 100
  }));
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    
    // Log analytics event
    console.log('Analytics event:', event);
    
    // In production, send to analytics service
    // await sendToMixpanel(event);
    // await sendToSegment(event);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}