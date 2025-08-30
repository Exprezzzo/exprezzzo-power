import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;
    
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify caller is admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const callerToken = await auth.verifyIdToken(idToken);
    
    if (callerToken.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }
    
    // Set claims for target user
    const { targetUserId, claims } = await req.json();
    
    await auth.setCustomUserClaims(targetUserId, claims);
    
    return NextResponse.json({ 
      success: true,
      message: `Claims set for user ${targetUserId}`,
      claims
    });
  } catch (error) {
    console.error('Claims error:', error);
    return NextResponse.json({ error: 'Failed to set claims' }, { status: 500 });
  }
}