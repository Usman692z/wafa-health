import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile } from './firestore';
import type { UserProfile } from '@/types';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// ─── Setup invisible reCAPTCHA ────────────────────────────────
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      recaptchaVerifier = null;
    },
  });
  return recaptchaVerifier;
}

// ─── Send OTP ─────────────────────────────────────────────────
export async function sendOTP(phone: string, containerId = 'recaptcha-container'): Promise<void> {
  const verifier = setupRecaptcha(containerId);
  confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
}

// ─── Verify OTP ──────────────────────────────────────────────
export async function verifyOTP(code: string): Promise<User> {
  if (!confirmationResult) throw new Error('No OTP request found. Please request OTP first.');
  const result = await confirmationResult.confirm(code);
  return result.user;
}

// ─── Sign Out ────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Auth State Listener ──────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── Get or create profile ───────────────────────────────────
export async function getOrCreateProfile(
  user: User,
  role: 'patient' | 'doctor',
  additionalData?: Partial<UserProfile>
): Promise<UserProfile> {
  let profile = await getUserProfile(user.uid);

  if (!profile) {
    const base = {
      uid: user.uid,
      phone: user.phoneNumber || '',
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
