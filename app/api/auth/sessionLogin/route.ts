import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Create session cookie (5 days expiration)
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
    const result = await createSessionCookie(idToken, expiresIn);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('session', result.sessionCookie!, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}