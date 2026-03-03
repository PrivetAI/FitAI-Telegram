import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SteroidCycle, CycleCompound, PCTEntry } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

interface CycleState {
  cycles: SteroidCycle[];
  pctEntries: PCTEntry[];
  addCycle: (c: Omit<SteroidCycle, 'id' | 'active'>) => void;
  updateCycle: (id: string, partial: Partial<SteroidCycle>) => void;
  deleteCycle: (id: string) => void;
  addCompound: (cycleId: string, compound: Omit<CycleCompound, 'id'>) => void;
  removeCompound: (cycleId: string, compoundId: string) => void;
  endCycle: (id: string) => void;
  getActiveCycle: () => SteroidCycle | null;
  getCycleHistory: () => SteroidCycle[];
  addPCT: (pct: Omit<PCTEntry, 'id'>) => void;
  deletePCT: (id: string) => void;
  getPCTForCycle: (cycleId: string) => PCTEntry[];
}

export const useCycleStore = create<CycleState>()(
  persist(
    (set, get) => ({
      cycles: [],
      pctEntries: [],
      addCycle: (c) =>
        set((s) => ({ cycles: [...s.cycles, { ...c, id: genId(), active: true }] })),
      updateCycle: (id, partial) =>
        set((s) => ({ cycles: s.cycles.map((c) => (c.id === id ? { ...c, ...partial } : c)) })),
      deleteCycle: (id) =>
        set((s) => ({ cycles: s.cycles.filter((c) => c.id !== id) })),
      addCompound: (cycleId, compound) =>
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId ? { ...c, compounds: [...c.compounds, { ...compound, id: genId() }] } : c
          ),
        })),
      removeCompound: (cycleId, compoundId) =>
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === cycleId ? { ...c, compounds: c.compounds.filter((cp) => cp.id !== compoundId) } : c
          ),
        })),
      endCycle: (id) =>
        set((s) => ({
          cycles: s.cycles.map((c) =>
            c.id === id ? { ...c, active: false, endDate: new Date().toISOString().slice(0, 10) } : c
          ),
        })),
      getActiveCycle: () => get().cycles.find((c) => c.active) || null,
      getCycleHistory: () => get().cycles.filter((c) => !c.active),
      addPCT: (pct) =>
        set((s) => ({ pctEntries: [...s.pctEntries, { ...pct, id: genId() }] })),
      deletePCT: (id) =>
        set((s) => ({ pctEntries: s.pctEntries.filter((p) => p.id !== id) })),
      getPCTForCycle: (cycleId) => get().pctEntries.filter((p) => p.cycleId === cycleId),
    }),
    { name: 'fitai-cycles' }
  )
);
