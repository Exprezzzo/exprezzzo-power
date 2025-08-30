import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

export const runtime = 'nodejs';

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check for admin role in custom claims
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient privileges' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      success: true,
      uid: decodedToken.uid,
      role: decodedToken.role
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}