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

// ===== NUTRITION =====
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  portionSize: string;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

// ===== TRAINING =====
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g. "8-12"
  restSeconds: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  targetMuscles: string[];
  exercises: Exercise[];
  category: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'hiit' | 'cardio';
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  templateId?: string;
  name: string;
  exercises: ActiveExercise[];
  startedAt: number;
  completedAt?: number;
  date: string;
  durationMinutes?: number;
}

// ===== PROGRESS =====
export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  createdAt: number;
}

export interface MeasurementEntry {
  id: string;
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  date: string;
  createdAt: number;
}

// ===== SUPPLEMENTS =====
export type SupplementSchedule = 'morning' | 'afternoon' | 'evening' | 'with_meal' | 'before_bed';

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  schedule: SupplementSchedule[];
  notes?: string;
  active: boolean;
}

export interface SupplementLog {
  supplementId: string;
  date: string;
  taken: boolean;
}

// ===== STEROID CYCLES =====
export type CycleFrequency = 'daily' | 'eod' | 'e3d' | 'weekly' | 'biweekly';

export interface CycleCompound {
  id: string;
  name: string;
  dosage: string;
  frequency: CycleFrequency;
  durationWeeks: number;
}

export interface SteroidCycle {
  id: string;
  name: string;
  compounds: CycleCompound[];
  startDate: string;
  endDate?: string;
  active: boolean;
  notes?: string;
}

export interface PCTEntry {
  id: string;
  cycleId: string;
  compound: string;
  dosage: string;
  startDate: string;
  durationWeeks: number;
  notes?: string;
}
