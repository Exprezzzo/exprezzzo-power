// app/api/figma/route.ts
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const FIGMA_KEY = process.env.FIGMA_API_KEY; // Your key from Vercel
  const FILE_ID = process.env.FIGMA_FILE_ID;   // Your file ID from Vercel

  const res = await fetch(
    `https://api.figma.com/v1/files/${FILE_ID}`,
    {
      headers: { 'X-Figma-Token': FIGMA_KEY }
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: 200 });
}