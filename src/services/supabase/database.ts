import { getSupabaseClient } from './client';
import type {
  DbUserProfile, DbFoodEntry, DbWorkoutLog, DbWeightEntry,
  DbMeasurement, DbSupplement, DbSupplementLog, DbSteroidCycle, DbPCTEntry,
  DbAchievement, DbStreak,
} from './types';

type Table =
  | 'user_profiles' | 'food_entries' | 'workout_logs' | 'weight_entries'
  | 'measurements' | 'supplements' | 'supplement_logs' | 'steroid_cycles' | 'pct_entries'
  | 'achievements' | 'streaks';

// Generic CRUD

async function fetchAll<T>(table: Table, userId: string): Promise<T[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from(table).select('*').eq('user_id', userId);
  if (error) { console.error(`[DB] fetchAll ${table}:`, error.message); return []; }
  return (data || []) as T[];
}

async function upsertRow<T extends object>(table: Table, row: T): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from(table).upsert(row).select().single();
  if (error) { console.error(`[DB] upsert ${table}:`, error.message); return null; }
  return data as T;
}

async function upsertRows<T extends object>(table: Table, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from(table).upsert(rows);
  if (error) console.error(`[DB] upsertRows ${table}:`, error.message);
}

async function deleteRow(table: Table, id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) console.error(`[DB] delete ${table}:`, error.message);
}

// Profile

export async function fetchProfile(userId: string): Promise<DbUserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.from('user_profiles').select('*').eq('user_id', userId).single();
  return (data as DbUserProfile) || null;
}

export async function upsertProfile(profile: Partial<DbUserProfile> & { user_id: string }): Promise<void> {
  await upsertRow('user_profiles', { ...profile, updated_at: new Date().toISOString() });
}

// Food entries

export async function fetchFoodEntries(userId: string): Promise<DbFoodEntry[]> {
  return fetchAll<DbFoodEntry>('food_entries', userId);
}

export async function upsertFoodEntries(entries: DbFoodEntry[]): Promise<void> {
  await upsertRows('food_entries', entries);
}

export async function deleteFoodEntry(id: string): Promise<void> {
  await deleteRow('food_entries', id);
}

// Workout logs

export async function fetchWorkoutLogs(userId: string): Promise<DbWorkoutLog[]> {
  return fetchAll<DbWorkoutLog>('workout_logs', userId);
}

export async function upsertWorkoutLogs(logs: DbWorkoutLog[]): Promise<void> {
  await upsertRows('workout_logs', logs);
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  await deleteRow('workout_logs', id);
}

// Weight entries

export async function fetchWeightEntries(userId: string): Promise<DbWeightEntry[]> {
  return fetchAll<DbWeightEntry>('weight_entries', userId);
}

export async function upsertWeightEntries(entries: DbWeightEntry[]): Promise<void> {
  await upsertRows('weight_entries', entries);
}

export async function deleteWeightEntry(id: string): Promise<void> {
  await deleteRow('weight_entries', id);
}

// Measurements

export async function fetchMeasurements(userId: string): Promise<DbMeasurement[]> {
  return fetchAll<DbMeasurement>('measurements', userId);
}

export async function upsertMeasurements(entries: DbMeasurement[]): Promise<void> {
  await upsertRows('measurements', entries);
}

export async function deleteMeasurement(id: string): Promise<void> {
  await deleteRow('measurements', id);
}

// Supplements

export async function fetchSupplements(userId: string): Promise<DbSupplement[]> {
  return fetchAll<DbSupplement>('supplements', userId);
}

export async function upsertSupplements(supps: DbSupplement[]): Promise<void> {
  await upsertRows('supplements', supps);
}

export async function deleteSupplement(id: string): Promise<void> {
  await deleteRow('supplements', id);
}

// Supplement logs

export async function fetchSupplementLogs(userId: string): Promise<DbSupplementLog[]> {
  return fetchAll<DbSupplementLog>('supplement_logs', userId);
}

export async function upsertSupplementLogs(logs: DbSupplementLog[]): Promise<void> {
  await upsertRows('supplement_logs', logs);
}

// Steroid cycles

export async function fetchCycles(userId: string): Promise<DbSteroidCycle[]> {
  return fetchAll<DbSteroidCycle>('steroid_cycles', userId);
}

export async function upsertCycles(cycles: DbSteroidCycle[]): Promise<void> {
  await upsertRows('steroid_cycles', cycles);
}

export async function deleteCycle(id: string): Promise<void> {
  await deleteRow('steroid_cycles', id);
}

// PCT entries

export async function fetchPCTEntries(userId: string): Promise<DbPCTEntry[]> {
  return fetchAll<DbPCTEntry>('pct_entries', userId);
}

export async function upsertPCTEntries(entries: DbPCTEntry[]): Promise<void> {
  await upsertRows('pct_entries', entries);
}

export async function deletePCTEntry(id: string): Promise<void> {
  await deleteRow('pct_entries', id);
}

// Achievements

export async function fetchAchievements(userId: string): Promise<DbAchievement[]> {
  return fetchAll<DbAchievement>('achievements', userId);
}

export async function upsertAchievements(achievements: DbAchievement[]): Promise<void> {
  await upsertRows('achievements', achievements);
}

// Streaks

export async function fetchStreak(userId: string): Promise<DbStreak | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.from('streaks').select('*').eq('user_id', userId).single();
  return (data as DbStreak) || null;
}

export async function upsertStreak(streak: Partial<DbStreak> & { user_id: string }): Promise<void> {
  await upsertRow('streaks', streak);
}
