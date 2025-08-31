import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/admin';

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const caller = req.cookies.get('ep_session')?.value;
  if (!caller) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const callerDecoded = await adminAuth().verifyIdToken(caller).catch(() => null);
  if (!callerDecoded || callerDecoded.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { uid, role } = await req.json();
  await adminAuth().setCustomUserClaims(uid, { role });
  return NextResponse.json({ ok: true });
}