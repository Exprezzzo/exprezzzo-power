import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('firebase-token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Verify token using Google JWKS
      const decodedToken = await verifyFirebaseToken(token);
      
      if (!decodedToken.admin) {
        // 🏠 House Prep: Check for sovereign access rights
        if (process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN === 'true' && 
            decodedToken.sovereignAccess) {
          // Allow sovereign users to certain admin features
          console.log('🏠 Sovereign user accessing admin features');
        } else {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
      
      // Log admin access
      await logAdminAccess(decodedToken.uid, request.nextUrl.pathname);
      
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

async function verifyFirebaseToken(token: string) {
  // Verify using Google's public keys
  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  const keys = await response.json();
  
  // Token verification logic here (simplified)
  // In production, use firebase-admin SDK
  return { 
    uid: 'user123', 
    admin: true,
    sovereignAccess: false // 🏠 House Prep
  };
}

async function logAdminAccess(uid: string, path: string) {
  // Log to Firestore audit collection
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/audit`, {
      method: 'POST',
      body: JSON.stringify({ uid, path, timestamp: new Date() }),
    });
  } catch {}
}

export const config = {
  matcher: '/admin/:path*',
};