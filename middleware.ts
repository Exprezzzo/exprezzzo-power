// middleware.ts  
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Simple admin gate - check for session cookie existence
  // Real verification happens in API routes with Node.js runtime
  if (ADMIN_PATH.test(url.pathname)) {
    const sessionCookie = req.cookies.get('ep_session')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon|icons|manifest).*)']
};