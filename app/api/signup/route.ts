// app/api/signup/route.ts
// This Next.js API route can be used for server-side user creation or custom token minting if needed.
// For now, it provides a basic structure, assuming client-side Firebase Auth handles primary signup.
// Ensure you have `firebase-admin` set up if you enable server-side Firebase operations here.

import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Using Firebase client-side auth for this route
import { doc, setDoc } from 'firebase/firestore'; // For Firestore client-side
import { auth, db } from '@/lib/firebase'; // Ensure auth and db are correctly imported from your client-side firebase config

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: name || user.email?.split('@')[0],
      createdAt: new Date().toISOString(),
      isPro: false,
      plan: 'free'
    }, { merge: true });

    console.log(`User created via app/api/signup/route.ts: ${user.uid}`);

    return NextResponse.json({
      success: true,
      userId: user.uid,
      message: 'Account created successfully. Please log in.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in app/api/signup/route.ts:', error);
    let errorMessage = 'Failed to create account.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use. Please log in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}