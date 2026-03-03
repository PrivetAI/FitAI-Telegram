import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutTemplate, WorkoutLog, ActiveExercise, WorkoutSet } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

// Pre-built workout templates
const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'push', name: 'Push Day', category: 'push', targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    exercises: [
      { id: 'p1', name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'p2', name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 90 },
      { id: 'p3', name: 'Incline DB Press', sets: 3, reps: '10-12', restSeconds: 60 },
      { id: 'p4', name: 'Lateral Raises', sets: 3, reps: '12-15', restSeconds: 45 },
      { id: 'p5', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', restSeconds: 45 },
      { id: 'p6', name: 'Overhead Tricep Ext', sets: 2, reps: '12-15', restSeconds: 45 },
    ],
  },
  {
    id: 'pull', name: 'Pull Day', category: 'pull', targetMuscles: ['Back', 'Biceps', 'Rear Delts'],
    exercises: [
      { id: 'pl1', name: 'Deadlift', sets: 4, reps: '5-8', restSeconds: 120 },
      { id: 'pl2', name: 'Pull-Ups', sets: 3, reps: '6-10', restSeconds: 90 },
      { id: 'pl3', name: 'Barbell Rows', sets: 3, reps: '8-12', restSeconds: 90 },
      { id: 'pl4', name: 'Face Pulls', sets: 3, reps: '15-20', restSeconds: 45 },
      { id: 'pl5', name: 'Barbell Curls', sets: 3, reps: '10-12', restSeconds: 45 },
      { id: 'pl6', name: 'Hammer Curls', sets: 2, reps: '12-15', restSeconds: 45 },
    ],
  },
  {
    id: 'legs', name: 'Leg Day', category: 'legs', targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    exercises: [
      { id: 'l1', name: 'Barbell Squat', sets: 4, reps: '6-10', restSeconds: 120 },
      { id: 'l2', name: 'Romanian Deadlift', sets: 3, reps: '8-12', restSeconds: 90 },
      { id: 'l3', name: 'Leg Press', sets: 3, reps: '10-12', restSeconds: 90 },
      { id: 'l4', name: 'Leg Curls', sets: 3, reps: '12-15', restSeconds: 60 },
      { id: 'l5', name: 'Leg Extensions', sets: 3, reps: '12-15', restSeconds: 60 },
      { id: 'l6', name: 'Calf Raises', sets: 4, reps: '12-15', restSeconds: 45 },
    ],
  },
  {
    id: 'upper', name: 'Upper Body', category: 'upper', targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
    exercises: [
      { id: 'u1', name: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'u2', name: 'Barbell Rows', sets: 4, reps: '8-10', restSeconds: 90 },
      { id: 'u3', name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 60 },
      { id: 'u4', name: 'Lat Pulldown', sets: 3, reps: '10-12', restSeconds: 60 },
      { id: 'u5', name: 'Dumbbell Curls', sets: 2, reps: '12-15', restSeconds: 45 },
      { id: 'u6', name: 'Tricep Dips', sets: 2, reps: '10-12', restSeconds: 45 },
    ],
  },
  {
    id: 'lower', name: 'Lower Body', category: 'lower', targetMuscles: ['Quads', 'Hamstrings', 'Glutes'],
    exercises: [
      { id: 'lo1', name: 'Front Squat', sets: 4, reps: '6-10', restSeconds: 120 },
      { id: 'lo2', name: 'Hip Thrust', sets: 3, reps: '8-12', restSeconds: 90 },
      { id: 'lo3', name: 'Walking Lunges', sets: 3, reps: '12 each', restSeconds: 60 },
      { id: 'lo4', name: 'Leg Curls', sets: 3, reps: '12-15', restSeconds: 60 },
      { id: 'lo5', name: 'Calf Raises', sets: 4, reps: '15-20', restSeconds: 45 },
    ],
  },
  {
    id: 'fullbody', name: 'Full Body', category: 'full_body', targetMuscles: ['Full Body'],
    exercises: [
      { id: 'f1', name: 'Barbell Squat', sets: 3, reps: '8-10', restSeconds: 90 },
      { id: 'f2', name: 'Bench Press', sets: 3, reps: '8-10', restSeconds: 90 },
      { id: 'f3', name: 'Barbell Rows', sets: 3, reps: '8-10', restSeconds: 90 },
      { id: 'f4', name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 60 },
      { id: 'f5', name: 'Romanian Deadlift', sets: 3, reps: '10-12', restSeconds: 60 },
    ],
  },
  {
    id: 'hiit', name: 'HIIT', category: 'hiit', targetMuscles: ['Full Body', 'Cardio'],
    exercises: [
      { id: 'h1', name: 'Burpees', sets: 4, reps: '30 sec', restSeconds: 30 },
      { id: 'h2', name: 'Jump Squats', sets: 4, reps: '30 sec', restSeconds: 30 },
      { id: 'h3', name: 'Mountain Climbers', sets: 4, reps: '30 sec', restSeconds: 30 },
      { id: 'h4', name: 'Box Jumps', sets: 4, reps: '30 sec', restSeconds: 30 },
      { id: 'h5', name: 'Battle Ropes', sets: 4, reps: '30 sec', restSeconds: 30 },
    ],
  },
  {
    id: 'cardio', name: 'Cardio', category: 'cardio', targetMuscles: ['Cardiovascular'],
    exercises: [
      { id: 'c1', name: 'Treadmill Run', sets: 1, reps: '20 min', restSeconds: 0 },
      { id: 'c2', name: 'Rowing Machine', sets: 1, reps: '10 min', restSeconds: 60 },
      { id: 'c3', name: 'Cycling', sets: 1, reps: '15 min', restSeconds: 0 },
    ],
  },
];

interface TrainingState {
  templates: WorkoutTemplate[];
  customTemplates: WorkoutTemplate[];
  workoutLogs: WorkoutLog[];
  activeWorkout: WorkoutLog | null;
  addCustomTemplate: (t: Omit<WorkoutTemplate, 'id'>) => void;
  getAllTemplates: () => WorkoutTemplate[];
  startWorkout: (template: WorkoutTemplate) => void;
  updateActiveExercise: (exIdx: number, setIdx: number, data: Partial<WorkoutSet>) => void;
  addSetToExercise: (exIdx: number) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  getWorkoutHistory: () => WorkoutLog[];
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      customTemplates: [],
      workoutLogs: [],
      activeWorkout: null,
      addCustomTemplate: (t) =>
        set((s) => ({ customTemplates: [...s.customTemplates, { ...t, id: genId() }] })),
      getAllTemplates: () => [...get().templates, ...get().customTemplates],
      startWorkout: (template) => {
        const exercises: ActiveExercise[] = template.exercises.map((ex) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0, completed: false })),
        }));
        set({
          activeWorkout: {
            id: genId(),
            templateId: template.id,
            name: template.name,
            exercises,
            startedAt: Date.now(),
            date: today(),
          },
        });
      },
      updateActiveExercise: (exIdx, setIdx, data) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const exercises = [...s.activeWorkout.exercises];
          const sets = [...exercises[exIdx].sets];
          sets[setIdx] = { ...sets[setIdx], ...data };
          exercises[exIdx] = { ...exercises[exIdx], sets };
          return { activeWorkout: { ...s.activeWorkout, exercises } };
        }),
      addSetToExercise: (exIdx) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const exercises = [...s.activeWorkout.exercises];
          exercises[exIdx] = {
            ...exercises[exIdx],
            sets: [...exercises[exIdx].sets, { reps: 0, weight: 0, completed: false }],
          };
          return { activeWorkout: { ...s.activeWorkout, exercises } };
        }),
      finishWorkout: () =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const completed: WorkoutLog = {
            ...s.activeWorkout,
            completedAt: Date.now(),
            durationMinutes: Math.round((Date.now() - s.activeWorkout.startedAt) / 60000),
          };
          return { workoutLogs: [completed, ...s.workoutLogs], activeWorkout: null };
        }),
      cancelWorkout: () => set({ activeWorkout: null }),
      getWorkoutHistory: () => get().workoutLogs,
    }),
    { name: 'fitai-training' }
  )
);
