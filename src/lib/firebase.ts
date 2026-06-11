import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

export type { User };
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

// ─── Your Firebase config ──────────────────────────────────────────────────────
// Replace these values with your own from the Firebase Console
// (Project Settings → General → Your apps → Web app → Config)

const firebaseConfig = {
  apiKey: "AIzaSyA8dw8ahBJ_HWnCfoNHGFtSborxzFpW6O0",
  authDomain: "novelwritingstudio.firebaseapp.com",
  projectId: "novelwritingstudio",
  storageBucket: "novelwritingstudio.firebasestorage.app",
  messagingSenderId: "307807587721",
  appId: "1:307807587721:web:94caaecbef164dfbc62558",
  measurementId: "G-KGYRPJKJD9",
};

// ─── Init ──────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<User> {
  await signInWithRedirect(auth, googleProvider);
  // Redirect means we navigate away — this promise never resolves normally.
  // The result is picked up by getRedirectResult on page reload.
  throw new Error('Redirecting to Google...');
}

export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    console.error('Redirect sign-in error:', err);
    return null;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth, db };

// ─── Firestore data helpers ────────────────────────────────────────────────────

/**
 * Build a user-scoped path: users/{uid}/{collection}
 */
function userPath(uid: string, ...segments: string[]): string {
  return `users/${uid}/${segments.join("/")}`;
}

// ─── Generic CRUD ──────────────────────────────────────────────────────────────

export async function fsGet<T = DocumentData>(
  uid: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  const snap = await getDoc(doc(db, userPath(uid, collectionName, docId)));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function fsGetAll<T = DocumentData>(
  uid: string,
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, userPath(uid, collectionName)), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function fsGetSub<T = DocumentData>(
  uid: string,
  parentPath: string,
  subCollection: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(
    collection(db, userPath(uid, parentPath), subCollection),
    ...constraints
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function fsCreate<T = DocumentData>(
  uid: string,
  collectionName: string,
  data: Record<string, unknown>
): Promise<T> {
  const colRef = collection(db, userPath(uid, collectionName));
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as T;
}

export async function fsSet<T = DocumentData>(
  uid: string,
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<T> {
  const d = doc(db, userPath(uid, collectionName, docId));
  await setDoc(d, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return { id: docId, ...data } as T;
}

export async function fsUpdate(
  uid: string,
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const d = doc(db, userPath(uid, collectionName, docId));
  await updateDoc(d, { ...data, updatedAt: serverTimestamp() });
}

export async function fsDelete(
  uid: string,
  collectionName: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, userPath(uid, collectionName, docId)));
}

export async function fsCreateSub<T = DocumentData>(
  uid: string,
  parentPath: string,
  subCollection: string,
  data: Record<string, unknown>
): Promise<T> {
  const colRef = collection(db, userPath(uid, parentPath), subCollection);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as T;
}

export async function fsUpdateSub(
  uid: string,
  parentPath: string,
  subCollection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const d = doc(db, userPath(uid, parentPath), subCollection, docId);
  await updateDoc(d, { ...data, updatedAt: serverTimestamp() });
}

export async function fsDeleteSub(
  uid: string,
  parentPath: string,
  subCollection: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, userPath(uid, parentPath), subCollection, docId));
}

// ─── Firestore Timestamp helpers ───────────────────────────────────────────────

import { Timestamp } from "firebase/firestore";

export function tsToISO(ts: Timestamp | null | undefined): string {
  return ts ? ts.toDate().toISOString() : new Date().toISOString();
}

export { Timestamp, serverTimestamp, where, orderBy, query as fsQuery, collection as fsCollection };