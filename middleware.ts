// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/auth/verify';

const ADMIN_PATH = /^\/admin\//;

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // Affiliate capture (forward-only, keep behavior)
  const ref = req.nextUrl.searchParams.get('ref');
  if (ref) {
    const res = NextResponse.next();
    res.cookies.set('ep_ref', ref, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  // Session / admin gate
  if (ADMIN_PATH.test(url.pathname)) {
    const idToken = req.cookies.get('ep_session')?.value; // set by your login flow
    const decoded = await verifyIdToken(idToken);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon|icons|manifest).*)']
};