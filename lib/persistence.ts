import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

function clientApp() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getApp();
}
const db = getFirestore(clientApp());

export async function logRun(uid: string|undefined, payload: any) {
  return addDoc(collection(db, 'runs'), {
    uid: uid || null,
    payload,
    createdAt: serverTimestamp()
  });
}

export async function saveWinner(runId: string, model: string) {
  const ref = doc(db, 'runs', runId);
  await updateDoc(ref, { winner: model, decidedAt: serverTimestamp() });
}

export async function upsertProfile(uid: string, data: Record<string, any>) {
  const ref = doc(db, 'profiles', uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}