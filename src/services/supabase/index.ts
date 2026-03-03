export { getSupabaseClient, initSupabaseClient, destroySupabaseClient, isSupabaseConfigured } from './client';
export { authenticateWithTelegram, getUserByTelegramId } from './auth';
export * from './database';
export { syncAll, syncNutrition, syncTraining, syncProgress, syncSupplements, syncCycles, syncProfile, isSyncing } from './sync';
export type { SyncCallbacks } from './sync';
