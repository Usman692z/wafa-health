'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useAuth() {
  const { firebaseUser, profile, isLoading, setFirebaseUser, setProfile, setLoading, clearAuth } =
    useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const p = await getUserProfile(user.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { firebaseUser, profile, isLoading, isAuthenticated: !!firebaseUser && !!profile };
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.push(`/${profile.role}/dashboard`);
      }
    }
  }, [isLoading, isAuthenticated, profile, allowedRoles]);

  return { profile, isLoading };
}
