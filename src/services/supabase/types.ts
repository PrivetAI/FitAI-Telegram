// Database row types matching Supabase schema

export interface DbUser {
  id: string;
  telegram_id: number;
  username: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface DbUserProfile {
  id: string;
  user_id: string;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  activity_level: string | null;
  experience_level: string | null;
  tdee: number | null;
  target_calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  updated_at: string;
}

export interface DbFoodEntry {
  id: string;
  user_id: string;
  name: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  portion_size: string | null;
  meal_type: string | null;
  date: string | null;
  created_at: string;
}

export interface DbWorkoutLog {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string | null;
  exercises: unknown;
  started_at: string | null;
  completed_at: string | null;
  date: string | null;
  duration_minutes: number | null;
}

export interface DbWeightEntry {
  id: string;
  user_id: string;
  weight: number;
  date: string | null;
  created_at: string;
}

export interface DbMeasurement {
  id: string;
  user_id: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
  date: string | null;
  created_at: string;
}

export interface DbSupplement {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule: string[] | null;
  notes: string | null;
  active: boolean;
}

export interface DbSupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  date: string | null;
  taken: boolean;
}

export interface DbSteroidCycle {
  id: string;
  user_id: string;
  name: string | null;
  compounds: unknown;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  notes: string | null;
}

export interface DbPCTEntry {
  id: string;
  user_id: string;
  cycle_id: string;
  compound: string | null;
  dosage: string | null;
  start_date: string | null;
  duration_weeks: number | null;
  notes: string | null;
}
