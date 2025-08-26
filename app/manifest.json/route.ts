import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Exprezzzo Power',
    short_name: 'Exprezzzo',
    description: 'AI Power Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#8B5CF6',
    icons: [
      { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' }
    ],
  });
}