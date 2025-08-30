import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('firebase-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // For production, verify token via API call instead of Firebase Admin SDK
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      const { role, uid } = await response.json();
      
      // Allow access and add user info to headers
      const nextResponse = NextResponse.next();
      nextResponse.headers.set('x-user-id', uid);
      nextResponse.headers.set('x-user-role', role || 'user');
      
      return nextResponse;
    } catch (error) {
      console.error('Auth verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};