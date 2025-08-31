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

    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user',
      verified: true
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
  }
}