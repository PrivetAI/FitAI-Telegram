import { getSupabaseClient } from './client';
import { authenticateWithTelegram } from './auth';
import * as db from './database';
import type {
  DbFoodEntry, DbWorkoutLog, DbWeightEntry, DbMeasurement,
  DbSupplement, DbSupplementLog, DbSteroidCycle, DbPCTEntry,
} from './types';
import type {
  FoodEntry, WorkoutLog, WeightEntry, MeasurementEntry,
  Supplement, SupplementLog, SteroidCycle, PCTEntry, UserProfile,
} from '../../types';

// ---- Converters: Local <-> DB ----

function foodToDb(e: FoodEntry, userId: string): DbFoodEntry {
  return {
    id: e.id, user_id: userId, name: e.name,
    calories: e.calories, protein: e.protein, fat: e.fat, carbs: e.carbs,
    portion_size: e.portionSize, meal_type: e.mealType, date: e.date,
    created_at: new Date(e.createdAt).toISOString(),
  };
}

function dbToFood(r: DbFoodEntry): FoodEntry {
  return {
    id: r.id, name: r.name,
    calories: r.calories || 0, protein: r.protein || 0, fat: r.fat || 0, carbs: r.carbs || 0,
    portionSize: r.portion_size || '', mealType: (r.meal_type || 'snack') as FoodEntry['mealType'],
    date: r.date || '', createdAt: new Date(r.created_at).getTime(),
  };
}

function workoutToDb(w: WorkoutLog, userId: string): DbWorkoutLog {
  return {
    id: w.id, user_id: userId, template_id: w.templateId || null, name: w.name,
    exercises: w.exercises, started_at: new Date(w.startedAt).toISOString(),
    completed_at: w.completedAt ? new Date(w.completedAt).toISOString() : null,
    date: w.date, duration_minutes: w.durationMinutes || null,
  };
}

function dbToWorkout(r: DbWorkoutLog): WorkoutLog {
  return {
    id: r.id, templateId: r.template_id || undefined, name: r.name || '',
    exercises: (r.exercises || []) as WorkoutLog['exercises'],
    startedAt: r.started_at ? new Date(r.started_at).getTime() : 0,
    completedAt: r.completed_at ? new Date(r.completed_at).getTime() : undefined,
    date: r.date || '', durationMinutes: r.duration_minutes || undefined,
  };
}

function weightToDb(e: WeightEntry, userId: string): DbWeightEntry {
  return {
    id: e.id, user_id: userId, weight: e.weight, date: e.date,
    created_at: new Date(e.createdAt).toISOString(),
  };
}

function dbToWeight(r: DbWeightEntry): WeightEntry {
  return { id: r.id, weight: r.weight, date: r.date || '', createdAt: new Date(r.created_at).getTime() };
}

function measurementToDb(m: MeasurementEntry, userId: string): DbMeasurement {
  return {
    id: m.id, user_id: userId,
    chest: m.chest ?? null, waist: m.waist ?? null, hips: m.hips ?? null,
    left_arm: m.leftArm ?? null, right_arm: m.rightArm ?? null,
    left_thigh: m.leftThigh ?? null, right_thigh: m.rightThigh ?? null,
    date: m.date, created_at: new Date(m.createdAt).toISOString(),
  };
}

function dbToMeasurement(r: DbMeasurement): MeasurementEntry {
  return {
    id: r.id,
    chest: r.chest ?? undefined, waist: r.waist ?? undefined, hips: r.hips ?? undefined,
    leftArm: r.left_arm ?? undefined, rightArm: r.right_arm ?? undefined,
    leftThigh: r.left_thigh ?? undefined, rightThigh: r.right_thigh ?? undefined,
    date: r.date || '', createdAt: new Date(r.created_at).getTime(),
  };
}

function suppToDb(s: Supplement, userId: string): DbSupplement {
  return {
    id: s.id, user_id: userId, name: s.name, dosage: s.dosage,
    schedule: s.schedule, notes: s.notes || null, active: s.active,
  };
}

function dbToSupp(r: DbSupplement): Supplement {
  return {
    id: r.id, name: r.name, dosage: r.dosage || '',
    schedule: (r.schedule || []) as Supplement['schedule'],
    notes: r.notes || undefined, active: r.active,
  };
}

function suppLogToDb(l: SupplementLog, userId: string): DbSupplementLog {
  return {
    id: `${l.supplementId}_${l.date}`, user_id: userId,
    supplement_id: l.supplementId, date: l.date, taken: l.taken,
  };
}

function dbToSuppLog(r: DbSupplementLog): SupplementLog {
  return { supplementId: r.supplement_id, date: r.date || '', taken: r.taken };
}

function cycleToDb(c: SteroidCycle, userId: string): DbSteroidCycle {
  return {
    id: c.id, user_id: userId, name: c.name, compounds: c.compounds,
    start_date: c.startDate, end_date: c.endDate || null,
    active: c.active, notes: c.notes || null,
  };
}

function dbToCycle(r: DbSteroidCycle): SteroidCycle {
  return {
    id: r.id, name: r.name || '',
    compounds: (r.compounds || []) as SteroidCycle['compounds'],
    startDate: r.start_date || '', endDate: r.end_date || undefined,
    active: r.active, notes: r.notes || undefined,
  };
}

function pctToDb(p: PCTEntry, userId: string): DbPCTEntry {
  return {
    id: p.id, user_id: userId, cycle_id: p.cycleId,
    compound: p.compound, dosage: p.dosage,
    start_date: p.startDate, duration_weeks: p.durationWeeks,
    notes: p.notes || null,
  };
}

function dbToPct(r: DbPCTEntry): PCTEntry {
  return {
    id: r.id, cycleId: r.cycle_id, compound: r.compound || '',
    dosage: r.dosage || '', startDate: r.start_date || '',
    durationWeeks: r.duration_weeks || 0, notes: r.notes || undefined,
  };
}

// ---- Merge util: last-write-wins by ID ----

function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  getTimestamp: (item: T) => number
): { merged: T[]; toUpload: T[]; toDownload: T[] } {
  const map = new Map<string, { local?: T; remote?: T }>();
  for (const l of local) map.set(l.id, { ...map.get(l.id), local: l });
  for (const r of remote) map.set(r.id, { ...map.get(r.id), remote: r });

  const merged: T[] = [];
  const toUpload: T[] = [];
  const toDownload: T[] = [];

  for (const [, { local: l, remote: r }] of map) {
    if (l && !r) { toUpload.push(l); merged.push(l); }
    else if (!l && r) { toDownload.push(r); merged.push(r); }
    else if (l && r) {
      if (getTimestamp(l) >= getTimestamp(r)) { toUpload.push(l); merged.push(l); }
      else { toDownload.push(r); merged.push(r); }
    }
  }

  return { merged, toUpload, toDownload };
}

// ---- Sync Engine ----

export interface SyncCallbacks {
  getTelegramUser: () => { id: number; username?: string } | undefined;
  getLanguage: () => string;
  // Getters
  getNutritionEntries: () => FoodEntry[];
  getWorkoutLogs: () => WorkoutLog[];
  getWeightEntries: () => WeightEntry[];
  getMeasurements: () => MeasurementEntry[];
  getSupplements: () => Supplement[];
  getSupplementLogs: () => SupplementLog[];
  getCycles: () => SteroidCycle[];
  getPCTEntries: () => PCTEntry[];
  getProfile: () => UserProfile | null;
  // Setters
  setNutritionEntries: (entries: FoodEntry[]) => void;
  setWorkoutLogs: (logs: WorkoutLog[]) => void;
  setWeightEntries: (entries: WeightEntry[]) => void;
  setMeasurements: (measurements: MeasurementEntry[]) => void;
  setSupplements: (supps: Supplement[]) => void;
  setSupplementLogs: (logs: SupplementLog[]) => void;
  setCycles: (cycles: SteroidCycle[]) => void;
  setPCTEntries: (entries: PCTEntry[]) => void;
  setProfile: (p: UserProfile) => void;
}

let syncInProgress = false;

async function ensureUser(callbacks: SyncCallbacks): Promise<string | null> {
  const tgUser = callbacks.getTelegramUser();
  if (!tgUser) return null;
  const dbUser = await authenticateWithTelegram(tgUser.id, tgUser.username, callbacks.getLanguage());
  return dbUser?.id || null;
}

export async function syncNutrition(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;
  const local = callbacks.getNutritionEntries();
  const remote = (await db.fetchFoodEntries(userId)).map(dbToFood);
  const { merged, toUpload } = mergeById(local, remote, (e) => e.createdAt);
  if (toUpload.length > 0) await db.upsertFoodEntries(toUpload.map((e) => foodToDb(e, userId)));
  callbacks.setNutritionEntries(merged);
}

export async function syncTraining(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;
  const local = callbacks.getWorkoutLogs();
  const remote = (await db.fetchWorkoutLogs(userId)).map(dbToWorkout);
  const { merged, toUpload } = mergeById(local, remote, (w) => w.completedAt || w.startedAt);
  if (toUpload.length > 0) await db.upsertWorkoutLogs(toUpload.map((w) => workoutToDb(w, userId)));
  callbacks.setWorkoutLogs(merged);
}

export async function syncProgress(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;

  // Weight
  const localW = callbacks.getWeightEntries();
  const remoteW = (await db.fetchWeightEntries(userId)).map(dbToWeight);
  const wResult = mergeById(localW, remoteW, (e) => e.createdAt);
  if (wResult.toUpload.length > 0) await db.upsertWeightEntries(wResult.toUpload.map((e) => weightToDb(e, userId)));
  callbacks.setWeightEntries(wResult.merged);

  // Measurements
  const localM = callbacks.getMeasurements();
  const remoteM = (await db.fetchMeasurements(userId)).map(dbToMeasurement);
  const mResult = mergeById(localM, remoteM, (e) => e.createdAt);
  if (mResult.toUpload.length > 0) await db.upsertMeasurements(mResult.toUpload.map((e) => measurementToDb(e, userId)));
  callbacks.setMeasurements(mResult.merged);
}

export async function syncSupplements(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;

  const localS = callbacks.getSupplements();
  const remoteS = (await db.fetchSupplements(userId)).map(dbToSupp);
  // Supplements don't have timestamps, use local as source of truth for existing
  const sMap = new Map(remoteS.map((s) => [s.id, s]));
  const toUpload: Supplement[] = [];
  for (const l of localS) {
    if (!sMap.has(l.id)) toUpload.push(l);
    sMap.set(l.id, l);
  }
  const merged = Array.from(sMap.values());
  if (toUpload.length > 0) await db.upsertSupplements(toUpload.map((s) => suppToDb(s, userId)));
  callbacks.setSupplements(merged);

  // Logs
  const localL = callbacks.getSupplementLogs();
  const remoteL = (await db.fetchSupplementLogs(userId)).map(dbToSuppLog);
  const logMap = new Map(remoteL.map((l) => [`${l.supplementId}_${l.date}`, l]));
  const logsToUpload: SupplementLog[] = [];
  for (const l of localL) {
    const key = `${l.supplementId}_${l.date}`;
    if (!logMap.has(key)) logsToUpload.push(l);
    logMap.set(key, l);
  }
  if (logsToUpload.length > 0) await db.upsertSupplementLogs(logsToUpload.map((l) => suppLogToDb(l, userId)));
  callbacks.setSupplementLogs(Array.from(logMap.values()));
}

export async function syncCycles(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;

  const localC = callbacks.getCycles();
  const remoteC = (await db.fetchCycles(userId)).map(dbToCycle);
  const cMap = new Map(remoteC.map((c) => [c.id, c]));
  const toUpload: SteroidCycle[] = [];
  for (const l of localC) {
    if (!cMap.has(l.id)) toUpload.push(l);
    cMap.set(l.id, l);
  }
  if (toUpload.length > 0) await db.upsertCycles(toUpload.map((c) => cycleToDb(c, userId)));
  callbacks.setCycles(Array.from(cMap.values()));

  // PCT
  const localP = callbacks.getPCTEntries();
  const remoteP = (await db.fetchPCTEntries(userId)).map(dbToPct);
  const pMap = new Map(remoteP.map((p) => [p.id, p]));
  const pctToUpload: PCTEntry[] = [];
  for (const l of localP) {
    if (!pMap.has(l.id)) pctToUpload.push(l);
    pMap.set(l.id, l);
  }
  if (pctToUpload.length > 0) await db.upsertPCTEntries(pctToUpload.map((p) => pctToDb(p, userId)));
  callbacks.setPCTEntries(Array.from(pMap.values()));
}

export async function syncProfile(callbacks: SyncCallbacks): Promise<void> {
  const userId = await ensureUser(callbacks);
  if (!userId) return;
  const local = callbacks.getProfile();
  if (!local) return;

  const remote = await db.fetchProfile(userId);
  // Always push local profile to cloud (local is source of truth for profile)
  await db.upsertProfile({
    user_id: userId,
    gender: local.gender,
    age: local.age,
    height: local.height,
    weight: local.weight,
    goal: local.goal,
    activity_level: local.activityLevel,
    experience_level: local.experienceLevel,
    tdee: local.tdee,
    target_calories: local.targetCalories,
    protein: local.macros.protein,
    fat: local.macros.fat,
    carbs: local.macros.carbs,
  });

  // If no local profile but remote exists, pull it
  if (!local && remote) {
    callbacks.setProfile({
      gender: (remote.gender || 'male') as UserProfile['gender'],
      age: remote.age || 25,
      height: remote.height || 175,
      weight: remote.weight || 75,
      goal: (remote.goal || 'maintain') as UserProfile['goal'],
      activityLevel: (remote.activity_level || 'moderate') as UserProfile['activityLevel'],
      experienceLevel: (remote.experience_level || 'intermediate') as UserProfile['experienceLevel'],
      tdee: remote.tdee || 2500,
      targetCalories: remote.target_calories || 2500,
      macros: {
        protein: remote.protein || 150,
        fat: remote.fat || 80,
        carbs: remote.carbs || 250,
      },
    });
  }
}

export async function syncAll(callbacks: SyncCallbacks): Promise<void> {
  if (syncInProgress) return;
  if (!getSupabaseClient()) return;

  syncInProgress = true;
  try {
    await syncProfile(callbacks);
    await syncNutrition(callbacks);
    await syncTraining(callbacks);
    await syncProgress(callbacks);
    await syncSupplements(callbacks);
    await syncCycles(callbacks);
  } finally {
    syncInProgress = false;
  }
}

export function isSyncing(): boolean {
  return syncInProgress;
}
