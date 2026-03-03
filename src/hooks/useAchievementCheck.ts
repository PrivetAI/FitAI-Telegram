import { useEffect, useRef } from 'react';
import { useNutritionStore } from '../stores/nutritionStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useProgressStore } from '../stores/progressStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useTelegram } from './useTelegram';
import { useTranslation } from '../i18n';
import { runAchievementCheck, checkAllAchievements } from '../services/achievements';

/**
 * Subscribes to store changes and runs achievement checks.
 * Place this once at app root level.
 */
export function useAchievementCheck() {
  const { haptic } = useTelegram();
  const { t } = useTranslation();
  const initialized = useRef(false);

  const nutritionEntries = useNutritionStore((s) => s.entries.length);
  const workoutLogs = useTrainingStore((s) => s.workoutLogs.length);
  const weightEntries = useProgressStore((s) => s.weightEntries.length);
  const measurements = useProgressStore((s) => s.measurements.length);
  const supplements = useSupplementStore((s) => s.supplements.length);
  const suppLogs = useSupplementStore((s) => s.logs.length);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      // Initial seed - update progress without toasts
      const store = useAchievementStore.getState();
      const results = checkAllAchievements();
      for (const r of results) {
        store.setProgress(r.id, r.progress);
      }
      return;
    }

    const timer = setTimeout(() => {
      runAchievementCheck(haptic, t);
    }, 300);

    return () => clearTimeout(timer);
  }, [nutritionEntries, workoutLogs, weightEntries, measurements, supplements, suppLogs, haptic, t]);
}
