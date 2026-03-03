import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Supplement, SupplementLog } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

interface SupplementState {
  supplements: Supplement[];
  logs: SupplementLog[];
  addSupplement: (s: Omit<Supplement, 'id' | 'active'>) => void;
  updateSupplement: (id: string, partial: Partial<Supplement>) => void;
  deleteSupplement: (id: string) => void;
  toggleTaken: (supplementId: string, date?: string) => void;
  isTaken: (supplementId: string, date?: string) => boolean;
  getTodayChecklist: () => Array<Supplement & { taken: boolean }>;
}

export const useSupplementStore = create<SupplementState>()(
  persist(
    (set, get) => ({
      supplements: [],
      logs: [],
      addSupplement: (s) =>
        set((st) => ({ supplements: [...st.supplements, { ...s, id: genId(), active: true }] })),
      updateSupplement: (id, partial) =>
        set((st) => ({
          supplements: st.supplements.map((s) => (s.id === id ? { ...s, ...partial } : s)),
        })),
      deleteSupplement: (id) =>
        set((st) => ({ supplements: st.supplements.filter((s) => s.id !== id) })),
      toggleTaken: (supplementId, date) => {
        const d = date || today();
        set((st) => {
          const existing = st.logs.find((l) => l.supplementId === supplementId && l.date === d);
          if (existing) {
            return { logs: st.logs.map((l) => l.supplementId === supplementId && l.date === d ? { ...l, taken: !l.taken } : l) };
          }
          return { logs: [...st.logs, { supplementId, date: d, taken: true }] };
        });
      },
      isTaken: (supplementId, date) => {
        const d = date || today();
        return get().logs.some((l) => l.supplementId === supplementId && l.date === d && l.taken);
      },
      getTodayChecklist: () => {
        const d = today();
        return get().supplements.filter((s) => s.active).map((s) => ({
          ...s,
          taken: get().logs.some((l) => l.supplementId === s.id && l.date === d && l.taken),
        }));
      },
    }),
    { name: 'fitai-supplements' }
  )
);
