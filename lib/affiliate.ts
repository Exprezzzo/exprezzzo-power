import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

export async function persistAffiliate(userId: string) {
  const cookieStore = cookies();
  const refCode = cookieStore.get('ref')?.value;
  
  if (!refCode) return;
  
  try {
    const db = getFirestore();
    await db.collection('users').doc(userId).set({
      ref: refCode,
      refCapturedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log(`Affiliate ${refCode} persisted for user ${userId}`);
  } catch (error) {
    console.error('Failed to persist affiliate:', error);
  }
}