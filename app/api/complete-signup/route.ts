import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { persistAffiliate } from '@/lib/affiliate';
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
    const { idToken } = await req.json();
    
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Persist affiliate if present
    await persistAffiliate(userId);
    
    return NextResponse.json({ 
      success: true,
      userId,
      message: 'Signup completed with affiliate tracking'
    });
  } catch (error) {
    console.error('Signup completion error:', error);
    return NextResponse.json({ error: 'Failed to complete signup' }, { status: 500 });
  }
}