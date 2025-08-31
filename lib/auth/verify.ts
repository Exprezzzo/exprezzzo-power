// lib/auth/verify.ts
import { adminAuth } from './admin';
export async function verifyIdToken(idToken?: string) {
  if (!idToken) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    return decoded; // contains custom claims such as role
  } catch {
    return null;
  }
}