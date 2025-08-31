import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/auth/verify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 })
    }

    const decodedToken = await verifyIdToken(idToken)
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user'
      }
    })

    // Set HTTP-only cookie for session management
    response.cookies.set('ep_session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear session cookie
  response.cookies.set('ep_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}