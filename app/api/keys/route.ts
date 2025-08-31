import { NextRequest, NextResponse } from 'next/server';
import { generateKey } from '@/lib/keys';
import crypto from 'crypto';

// In-memory store for demo (use Firestore in production)
const keys = new Map<string, any>();

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  const userKeys = Array.from(keys.values()).filter(k => k.uid === uid);
  const items = userKeys.map(k => ({ 
    id: k.id, 
    label: k.label, 
    last4: k.last4,
    createdAt: k.createdAt 
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { uid, label } = await req.json();
  const { raw, hash } = generateKey();
  const id = crypto.randomUUID();
  
  keys.set(id, { 
    id, 
    uid, 
    label, 
    hash, 
    last4: raw.slice(-4), 
    createdAt: Date.now() 
  });
  
  return NextResponse.json({ id, key: raw }); // show once
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  keys.delete(id);
  return NextResponse.json({ ok: true });
}