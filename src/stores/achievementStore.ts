import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementProgress, StreakData } from '../types/achievements';

function today() { return new Date().toISOString().slice(0, 10); }

interface AchievementState {
  progress: AchievementProgress[];
  streak: StreakData;
  // Actions
  setProgress: (achievementId: string, value: number) => void;
  unlockAchievement: (achievementId: string) => void;
  getProgress: (achievementId: string) => AchievementProgress;
  getUnlockedCount: () => number;
  getRecentUnlock: () => AchievementProgress | null;
  // Streak
  recordActivity: () => void;
  useStreakFreeze: () => boolean;
  addStreakFreeze: () => void;
  // Sync helpers
  setAllProgress: (p: AchievementProgress[]) => void;
  setStreak: (s: StreakData) => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      progress: [],
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezes: 0,
      },

      setProgress: (achievementId, value) =>
        set((s) => {
          const existing = s.progress.find((p) => p.achievementId === achievementId);
          if (existing) {
            return {
              progress: s.progress.map((p) =>
                p.achievementId === achievementId ? { ...p, progress: Math.max(p.progress, value) } : p
              ),
            };
          }
          return { progress: [...s.progress, { achievementId, progress: value }] };
        }),

      unlockAchievement: (achievementId) =>
        set((s) => ({
          progress: s.progress.map((p) =>
            p.achievementId === achievementId && !p.unlockedAt
              ? { ...p, unlockedAt: Date.now() }
              : p
          ),
        })),

      getProgress: (achievementId) => {
        return get().progress.find((p) => p.achievementId === achievementId) || { achievementId, progress: 0 };
      },

      getUnlockedCount: () => get().progress.filter((p) => p.unlockedAt).length,

      getRecentUnlock: () => {
        const unlocked = get().progress.filter((p) => p.unlockedAt);
        if (unlocked.length === 0) return null;
        return unlocked.reduce((a, b) => ((a.unlockedAt || 0) > (b.unlockedAt || 0) ? a : b));
      },

      recordActivity: () =>
        set((s) => {
          const t = today();
          const last = s.streak.lastActivityDate;
          if (last === t) return {}; // already recorded today

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);

          let newStreak: number;
          let freezes = s.streak.streakFreezes;

          if (last === yesterdayStr) {
            // Consecutive day
            newStreak = s.streak.currentStreak + 1;
          } else if (last) {
            // Check if 2 days ago (freeze opportunity)
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

            if (last === twoDaysAgoStr && freezes > 0) {
              // Use a freeze
              newStreak = s.streak.currentStreak + 2; // missed day + today
              freezes -= 1;
            } else {
              // Streak broken
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          return {
            streak: {
              currentStreak: newStreak,
              longestStreak: Math.max(s.streak.longestStreak, newStreak),
              lastActivityDate: t,
              streakFreezes: freezes,
            },
          };
        }),

      useStreakFreeze: () => {
        const s = get().streak;
        if (s.streakFreezes <= 0) return false;
        set((st) => ({
          streak: { ...st.streak, streakFreezes: st.streak.streakFreezes - 1 },
        }));
        return true;
      },

      addStreakFreeze: () =>
        set((s) => ({
          streak: { ...s.streak, streakFreezes: s.streak.streakFreezes + 1 },
        })),

      setAllProgress: (p) => set({ progress: p }),
      setStreak: (s) => set({ streak: s }),
    }),
    { name: 'fitai-achievements' }
  )
);
