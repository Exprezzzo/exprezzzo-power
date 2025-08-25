import { NextRequest, NextResponse } from 'next/server';
import { Parser } from 'json2csv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const range = url.searchParams.get('range') || '7d';
    
    // Fetch analytics data
    const data = await fetchAnalyticsData(range);
    
    if (format === 'csv') {
      const fields = ['date', 'users', 'messages', 'models', 'cost', 'errors'];
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=analytics-${range}.csv`
        }
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

async function fetchAnalyticsData(range: string) {
  // In production, fetch from database
  return [
    { date: '2024-01-01', users: 100, messages: 1000, models: 'gpt-4', cost: 10.50, errors: 2 },
    { date: '2024-01-02', users: 120, messages: 1200, models: 'claude', cost: 12.30, errors: 1 }
  ];
}