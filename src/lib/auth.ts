import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { auth, firebaseConfig } from './firebase';
import { getUserProfile, createUserProfile } from './firestore';
import type { UserProfile } from '@/types';

// ─── Login ────────────────────────────────────────────────────
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// ─── Patient Register ─────────────────────────────────────────
export async function registerWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result.user;
}

// ─── Admin creates doctor (secondary app so admin stays signed in) ──
export async function createDoctorAccount(email: string, tempPassword: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `doctor-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const result = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
    const uid = result.user.uid;
    await sendPasswordResetEmail(secondaryAuth, email);
    await deleteApp(secondaryApp);
    return uid;
  } catch (err) {
    await deleteApp(secondaryApp);
    throw err;
  }
}

// ─── Sign Out ────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Auth State Listener ──────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Get or create profile after registration ─────────────────
export async function getOrCreateProfile(
  user: User,
  role: 'patient' | 'doctor',
  additionalData?: Partial<UserProfile>
): Promise<UserProfile> {
  let profile = await getUserProfile(user.uid);

  if (!profile) {
    const base = {
      uid: user.uid,
      email: user.email || '',
      phone: '',
      role,
      isBlocked: false,
      preferredLanguage: 'en' as const,
      name: additionalData?.name || user.displayName || 'User',
      ...additionalData,
    };
    await createUserProfile(base as UserProfile);
    profile = await getUserProfile(user.uid);
  }

  return profile!;
}
