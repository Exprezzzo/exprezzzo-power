import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    version: '4.1.0',
    timestamp: new Date().toISOString()
  });
}
