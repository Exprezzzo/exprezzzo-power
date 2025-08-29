import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // EP-BG01-v1.0: Admin protection
  if (path.startsWith('/admin')) {
    const authToken = request.cookies.get('auth-token')
    const adminClaim = request.cookies.get('admin-claim')
    
    if (!authToken || adminClaim?.value !== 'true') {
      console.log('[AUDIT] Unauthorized admin access attempt:', {
        path,
        ip: request.ip,
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // Referral capture (existing functionality)
  const ref = request.nextUrl.searchParams.get('ref')
  if (ref) {
    const response = NextResponse.next()
    response.cookies.set('referral', ref, { 
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: true
    })
    return response
  }
  
  // EP-PF01-v1.0: Rate limiting for anonymous users
  const ip = request.ip || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const rateLimitKey = `${ip}-${ua}`
  
  // Simple in-memory rate limit (will be replaced with Redis/Firestore)
  // For now, just add headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Key', rateLimitKey)
  
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/chat', '/((?!_next/static|_next/image|favicon.ico).*)']
}
