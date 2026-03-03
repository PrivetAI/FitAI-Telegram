export type Gender = 'male' | 'female';

export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain' | 'recomp';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  goal: Goal;
  activityLevel: ActivityLevel;
  experienceLevel: ExperienceLevel;
  tdee: number;
  targetCalories: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface OnboardingData {
  goal?: Goal;
  gender?: Gender;
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  experienceLevel?: ExperienceLevel;
}
