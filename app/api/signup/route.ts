// app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Using Firebase client-side auth for this route
import { doc, setDoc } from 'firebase/firestore'; // For Firestore client-side
import { auth, db } from '@/lib/firebase'; // Ensure auth and db are correctly imported from your client-side firebase config

// Removed: import { createClient } from '@supabase/supabase-js'; // This was causing the Module not found error

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json(); // Expect email, password, and optionally name

    // Basic validation (more robust validation should be done with Zod or similar)
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Create user with Firebase Auth (client-side SDK can be used in API routes for basic operations)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email, // Use email from userCredential for consistency
      displayName: name || user.email?.split('@')[0], // Use provided name or default
      createdAt: new Date().toISOString(),
      isPro: false, // Default to free plan
      plan: 'free' // Default plan
    }, { merge: true }); // Use merge to avoid overwriting other fields if document exists

    console.log(`User created via app/api/signup/route.ts: ${user.uid}`);

    return NextResponse.json({
      success: true,
      userId: user.uid,
      message: 'Account created successfully. Please log in.' // Indicate success and next step
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in app/api/signup/route.ts:', error);
    // Provide user-friendly error messages based on Firebase Auth error codes
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
      { status: 400 } // Use 400 for client-side input errors
    );
  }
}