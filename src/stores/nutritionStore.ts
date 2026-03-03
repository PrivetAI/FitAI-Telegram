import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FoodEntry } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

interface NutritionState {
  entries: FoodEntry[];
  addEntry: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, partial: Partial<FoodEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntriesByDate: (date: string) => FoodEntry[];
  getTodayEntries: () => FoodEntry[];
  getTodayTotals: () => { calories: number; protein: number; fat: number; carbs: number };
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [...s.entries, { ...entry, id: genId(), createdAt: Date.now() }],
        })),
      updateEntry: (id, partial) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),
      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      getEntriesByDate: (date) => get().entries.filter((e) => e.date === date),
      getTodayEntries: () => get().entries.filter((e) => e.date === today()),
      getTodayTotals: () => {
        const t = get().entries.filter((e) => e.date === today());
        return {
          calories: t.reduce((s, e) => s + e.calories, 0),
          protein: t.reduce((s, e) => s + e.protein, 0),
          fat: t.reduce((s, e) => s + e.fat, 0),
          carbs: t.reduce((s, e) => s + e.carbs, 0),
        };
      },
    }),
    { name: 'fitai-nutrition' }
  )
);
