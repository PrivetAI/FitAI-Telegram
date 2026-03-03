import type { Gender, ActivityLevel, Goal } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR(gender: Gender, weight: number, height: number, age: number): number {
  // Mifflin-St Jeor
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateTargetCalories(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose_weight': return Math.round(tdee * 0.8);
    case 'gain_muscle': return Math.round(tdee * 1.15);
    case 'recomp': return tdee;
    case 'maintain': return tdee;
  }
}

export function calculateMacros(targetCalories: number, weight: number, goal: Goal) {
  let proteinPerKg: number;
  let fatPercent: number;

  switch (goal) {
    case 'lose_weight':
      proteinPerKg = 2.2;
      fatPercent = 0.25;
      break;
    case 'gain_muscle':
      proteinPerKg = 2.0;
      fatPercent = 0.25;
      break;
    case 'recomp':
      proteinPerKg = 2.2;
      fatPercent = 0.25;
      break;
    default:
      proteinPerKg = 1.8;
      fatPercent = 0.3;
  }

  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((targetCalories * fatPercent) / 9);
  const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

  return { protein, fat, carbs: Math.max(carbs, 50) };
}
