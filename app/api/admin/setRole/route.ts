import { NextRequest, NextResponse } from 'next/server';
import { setAdminRole, verifySessionCookie } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { uid, isAdmin = true } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify session and check if current user is admin
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const sessionResult = await verifySessionCookie(sessionCookie);
    if (!sessionResult.success || !sessionResult.decodedClaims) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    if (!sessionResult.decodedClaims.admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Set admin role for the target user
    const result = await setAdminRole(uid, isAdmin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${uid} ${isAdmin ? 'granted' : 'revoked'} admin privileges` 
    });

  } catch (error) {
    console.error('Set admin role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}