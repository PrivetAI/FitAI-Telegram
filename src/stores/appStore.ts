import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';

interface AppState {
  onboarded: boolean;
  profile: UserProfile | null;
  activeTab: string;
  setOnboarded: (v: boolean) => void;
  setProfile: (p: UserProfile) => void;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      profile: null,
      activeTab: 'dashboard',
      setOnboarded: (v) => set({ onboarded: v }),
      setProfile: (p) => set({ profile: p, onboarded: true }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: 'fitai-storage' }
  )
);
