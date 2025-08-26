import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Exprezzzo Power - Robin Hood v3.2 Active'
  });
}
