import { getSupabaseClient } from './client';
import type { DbUser } from './types';

/**
 * Authenticate using Telegram initData.
 * Upserts user in the users table and returns the DB user record.
 */
export async function authenticateWithTelegram(
  telegramId: number,
  username?: string,
  language?: string
): Promise<DbUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('users')
    .upsert(
      {
        telegram_id: telegramId,
        username: username || null,
        language: language || 'en',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Supabase Auth] Upsert failed:', error.message);
    return null;
  }

  return data as DbUser;
}

/**
 * Get user by Telegram ID.
 */
export async function getUserByTelegramId(telegramId: number): Promise<DbUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) return null;
  return data as DbUser;
}
