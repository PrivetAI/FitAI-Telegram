import type { FoodEntry, WorkoutTemplate } from '../types';

// Placeholder AI service - will be replaced with OpenAI API calls later

export async function analyzeFoodPhoto(_imageData: string): Promise<Partial<FoodEntry>> {
  // Simulates AI Vision API analyzing a food photo
  await new Promise((r) => setTimeout(r, 1500));
  return {
    name: 'Grilled Chicken Breast with Rice',
    calories: 450,
    protein: 42,
    fat: 8,
    carbs: 48,
    portionSize: '1 plate',
  };
}

export async function generateWorkout(_params: {
  goal: string;
  experience: string;
  targetMuscles: string[];
}): Promise<WorkoutTemplate> {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    id: 'ai-' + Date.now(),
    name: 'AI Generated Push Workout',
    category: 'push',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    exercises: [
      { id: 'e1', name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'e2', name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 90 },
      { id: 'e3', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', restSeconds: 60 },
      { id: 'e4', name: 'Lateral Raises', sets: 3, reps: '12-15', restSeconds: 45 },
      { id: 'e5', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 45 },
    ],
  };
}

export async function getSuggestedSupplements(_goal: string): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 1000));
  return ['Creatine 5g daily', 'Whey Protein 25g post-workout', 'Vitamin D3 2000IU', 'Omega-3 1000mg'];
}
