import { useNutritionStore } from '../stores/nutritionStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useProgressStore } from '../stores/progressStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useAppStore } from '../stores/appStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useToastStore } from '../stores/toastStore';
import { ACHIEVEMENTS } from '../types/achievements';
import type { FoodEntry, WorkoutLog, MealType } from '../types';

function today() { return new Date().toISOString().slice(0, 10); }

function getConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getConsecutiveDaysEndingToday(dates: string[]): number {
  const t = today();
  const sorted = [...new Set(dates)].sort().reverse();
  if (sorted[0] !== t) return 0;
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

interface CheckResult {
  id: string;
  progress: number;
  requirement: number;
}

export function checkAllAchievements(): CheckResult[] {
  const entries = useNutritionStore.getState().entries;
  const workoutLogs = useTrainingStore.getState().workoutLogs;
  const templates = useTrainingStore.getState().templates;
  const weightEntries = useProgressStore.getState().weightEntries;
  const measurements = useProgressStore.getState().measurements;
  const supplements = useSupplementStore.getState().supplements;
  const suppLogs = useSupplementStore.getState().logs;
  const profile = useAppStore.getState().profile;
  const streak = useAchievementStore.getState().streak;

  const results: CheckResult[] = [];

  // Helper: unique dates with food entries
  const foodDates = [...new Set(entries.map((e: FoodEntry) => e.date))];
  const completedWorkouts = workoutLogs.filter((w: WorkoutLog) => w.completedAt);

  // --- NUTRITION ---

  // First Bite
  results.push({ id: 'first_bite', progress: Math.min(entries.length, 1), requirement: 1 });

  // Calorie Counter - log meals 7 days straight
  const consecutiveFoodDays = getConsecutiveDays(foodDates);
  results.push({ id: 'calorie_counter', progress: consecutiveFoodDays, requirement: 7 });

  // Macro Master - hit all macro targets in a day
  if (profile) {
    const todayEntries = entries.filter((e: FoodEntry) => e.date === today());
    const totals = todayEntries.reduce(
      (acc: { p: number; f: number; c: number }, e: FoodEntry) => ({
        p: acc.p + e.protein, f: acc.f + e.fat, c: acc.c + e.carbs,
      }),
      { p: 0, f: 0, c: 0 }
    );
    const hitMacros =
      totals.p >= profile.macros.protein * 0.9 &&
      totals.f >= profile.macros.fat * 0.9 &&
      totals.c >= profile.macros.carbs * 0.9;
    results.push({ id: 'macro_master', progress: hitMacros ? 1 : 0, requirement: 1 });
  } else {
    results.push({ id: 'macro_master', progress: 0, requirement: 1 });
  }

  // Meal Prep Pro - all 4 meal types in one day
  const todayMealTypes = new Set(
    entries.filter((e: FoodEntry) => e.date === today()).map((e: FoodEntry) => e.mealType)
  );
  const allMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealTypesLogged = allMealTypes.filter((mt) => todayMealTypes.has(mt)).length;
  results.push({ id: 'meal_prep_pro', progress: mealTypesLogged >= 4 ? 1 : 0, requirement: 1 });

  // Century Club - 100 food entries
  results.push({ id: 'century_club', progress: entries.length, requirement: 100 });

  // Perfect Week - hit calorie target 7 days in a row
  if (profile) {
    const dateCalories = new Map<string, number>();
    for (const e of entries) {
      dateCalories.set(e.date, (dateCalories.get(e.date) || 0) + e.calories);
    }
    const hitDates = [...dateCalories.entries()]
      .filter(([, cal]) => Math.abs(cal - profile.targetCalories) <= profile.targetCalories * 0.1)
      .map(([d]) => d);
    const perfectStreak = getConsecutiveDays(hitDates);
    results.push({ id: 'perfect_week', progress: perfectStreak, requirement: 7 });
  } else {
    results.push({ id: 'perfect_week', progress: 0, requirement: 7 });
  }

  // --- TRAINING ---

  results.push({ id: 'first_rep', progress: Math.min(completedWorkouts.length, 1), requirement: 1 });
  results.push({ id: 'iron_regular', progress: completedWorkouts.length, requirement: 10 });
  results.push({ id: 'beast_mode', progress: completedWorkouts.length, requirement: 50 });

  // Heavy Lifter - 100kg+ set
  let hasHeavy = false;
  for (const w of completedWorkouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.weight >= 100 && s.completed) { hasHeavy = true; break; }
      }
      if (hasHeavy) break;
    }
    if (hasHeavy) break;
  }
  results.push({ id: 'heavy_lifter', progress: hasHeavy ? 1 : 0, requirement: 1 });

  // Marathon Session - 60+ minutes
  const hasMarathon = completedWorkouts.some((w: WorkoutLog) => (w.durationMinutes || 0) >= 60);
  results.push({ id: 'marathon_session', progress: hasMarathon ? 1 : 0, requirement: 1 });

  // Variety Pack - all 8 categories
  const usedCategories = new Set<string>();
  for (const w of completedWorkouts) {
    if (w.templateId) {
      const tmpl = templates.find((t) => t.id === w.templateId);
      if (tmpl) usedCategories.add(tmpl.category);
    }
  }
  results.push({ id: 'variety_pack', progress: usedCategories.size, requirement: 8 });

  // --- PROGRESS ---

  results.push({ id: 'scale_starter', progress: Math.min(weightEntries.length, 1), requirement: 1 });

  const weightDates = weightEntries.map((e) => e.date);
  const consecutiveWeightDays = getConsecutiveDaysEndingToday(weightDates);
  results.push({ id: 'consistent_tracker', progress: consecutiveWeightDays, requirement: 7 });

  results.push({ id: 'transformation', progress: weightEntries.length, requirement: 30 });

  // Goal Crusher
  if (profile && weightEntries.length > 0) {
    const latest = weightEntries[weightEntries.length - 1].weight;
    const goalReached =
      (profile.goal === 'lose_weight' && latest <= profile.weight * 0.95) ||
      (profile.goal === 'gain_muscle' && latest >= profile.weight * 1.05) ||
      (profile.goal === 'maintain' && Math.abs(latest - profile.weight) <= 1);
    results.push({ id: 'goal_crusher', progress: goalReached ? 1 : 0, requirement: 1 });
  } else {
    results.push({ id: 'goal_crusher', progress: 0, requirement: 1 });
  }

  results.push({ id: 'measure_up', progress: measurements.length, requirement: 5 });

  // --- SUPPLEMENTS ---

  results.push({ id: 'supplement_starter', progress: Math.min(supplements.length, 1), requirement: 1 });

  // Daily Dose - complete full checklist for a day
  const activeSuppIds = supplements.filter((s) => s.active).map((s) => s.id);
  if (activeSuppIds.length > 0) {
    const todayLogs = suppLogs.filter((l) => l.date === today() && l.taken);
    const allTaken = activeSuppIds.every((id) => todayLogs.some((l) => l.supplementId === id));
    results.push({ id: 'daily_dose', progress: allTaken ? 1 : 0, requirement: 1 });
  } else {
    results.push({ id: 'daily_dose', progress: 0, requirement: 1 });
  }

  // 30 Day Commitment
  const completeDays = new Set<string>();
  const logsByDate = new Map<string, Set<string>>();
  for (const l of suppLogs) {
    if (!l.taken) continue;
    if (!logsByDate.has(l.date)) logsByDate.set(l.date, new Set());
    logsByDate.get(l.date)!.add(l.supplementId);
  }
  for (const [date, ids] of logsByDate) {
    if (activeSuppIds.every((id) => ids.has(id))) completeDays.add(date);
  }
  results.push({ id: 'commitment_30', progress: completeDays.size, requirement: 30 });

  // --- STREAKS ---
  results.push({ id: 'on_fire', progress: streak.currentStreak, requirement: 7 });
  results.push({ id: 'unstoppable', progress: streak.currentStreak, requirement: 30 });
  results.push({ id: 'legend', progress: streak.currentStreak, requirement: 100 });

  return results;
}

export function runAchievementCheck(
  haptic: (type: 'light' | 'medium' | 'heavy') => void,
  t: (key: string) => string
): void {
  const store = useAchievementStore.getState();
  const addToast = useToastStore.getState().addToast;
  const results = checkAllAchievements();

  for (const r of results) {
    const def = ACHIEVEMENTS.find((a) => a.id === r.id);
    if (!def) continue;

    // Update progress
    store.setProgress(r.id, r.progress);

    // Check if newly unlocked
    const current = store.getProgress(r.id);
    if (r.progress >= r.requirement && !current.unlockedAt) {
      store.unlockAchievement(r.id);
      // Show toast
      addToast(`${t(def.titleKey)} -- ${t('achievements.unlocked')}`, 'achievement' as 'success');
      haptic('heavy');

      // Award streak freeze for certain achievements
      if (r.id === 'on_fire' || r.id === 'unstoppable') {
        store.addStreakFreeze();
      }
    }
  }

  // Record activity for streak
  store.recordActivity();
}
