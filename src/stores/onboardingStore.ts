import { create } from 'zustand';
import type { OnboardingData } from '../types';

interface OnboardingState {
  step: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 0,
  data: {},
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  updateData: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),
  reset: () => set({ step: 0, data: {} }),
}));
