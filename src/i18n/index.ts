import { useLangStore } from '../stores/langStore';
import en from './locales/en';
import ru from './locales/ru';
import type { TranslationKeys } from './locales/en';

const locales: Record<string, TranslationKeys> = { en, ru };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const language = useLangStore((s) => s.language);
  const translations = locales[language] || en;

  const t = (key: string): string => {
    return getNestedValue(translations as unknown as Record<string, unknown>, key);
  };

  return { t, language };
}
