import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeightEntry, MeasurementEntry } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

interface ProgressState {
  weightEntries: WeightEntry[];
  measurements: MeasurementEntry[];
  addWeight: (weight: number, date: string) => void;
  deleteWeight: (id: string) => void;
  addMeasurement: (m: Omit<MeasurementEntry, 'id' | 'createdAt'>) => void;
  deleteMeasurement: (id: string) => void;
  getLast30DaysWeights: () => WeightEntry[];
  getLatestWeight: () => number | null;
  getWeightTrend: () => number | null; // positive = gaining, negative = losing
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightEntries: [],
      measurements: [],
      addWeight: (weight, date) =>
        set((s) => ({
          weightEntries: [...s.weightEntries.filter((e) => e.date !== date), { id: genId(), weight, date, createdAt: Date.now() }]
            .sort((a, b) => a.date.localeCompare(b.date)),
        })),
      deleteWeight: (id) =>
        set((s) => ({ weightEntries: s.weightEntries.filter((e) => e.id !== id) })),
      addMeasurement: (m) =>
        set((s) => ({
          measurements: [...s.measurements, { ...m, id: genId(), createdAt: Date.now() }],
        })),
      deleteMeasurement: (id) =>
        set((s) => ({ measurements: s.measurements.filter((e) => e.id !== id) })),
      getLast30DaysWeights: () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return get().weightEntries.filter((e) => e.date >= cutoffStr);
      },
      getLatestWeight: () => {
        const entries = get().weightEntries;
        return entries.length > 0 ? entries[entries.length - 1].weight : null;
      },
      getWeightTrend: () => {
        const entries = get().weightEntries;
        if (entries.length < 2) return null;
        const recent = entries[entries.length - 1].weight;
        const prev = entries[entries.length - 2].weight;
        return recent - prev;
      },
    }),
    { name: 'fitai-progress' }
  )
);
