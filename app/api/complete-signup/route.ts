import { NextRequest, NextResponse } from 'next/server';
import { upsertProfile } from '@/lib/persistence';

export async function POST(req: NextRequest) {
  const { uid } = await req.json();
  const ref = req.cookies.get('ep_ref')?.value;
  if (!uid) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  if (ref) await upsertProfile(uid, { ref, refCapturedAt: Date.now() }).catch(() => null);
  return NextResponse.json({ ok: true });
}