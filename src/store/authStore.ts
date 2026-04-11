import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import type { User } from 'firebase/auth';

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      profile: null,
      isLoading: true,
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ firebaseUser: null, profile: null, isLoading: false }),
    }),
    {
      name: 'wafa-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
