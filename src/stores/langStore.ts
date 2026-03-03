import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import WebApp from '@twa-dev/sdk';

export type Language = 'en' | 'ru';

interface LangState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function detectLanguage(): Language {
  try {
    const lang = WebApp.initDataUnsafe?.user?.language_code;
    if (lang && lang.startsWith('ru')) return 'ru';
  } catch { /* noop */ }
  try {
    if (navigator.language.startsWith('ru')) return 'ru';
  } catch { /* noop */ }
  return 'en';
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'fitai-lang' }
  )
);
