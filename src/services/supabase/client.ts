import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  return client;
}

export function initSupabaseClient(url: string, anonKey: string): SupabaseClient {
  client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return client;
}

export function destroySupabaseClient(): void {
  client = null;
}

export function isSupabaseConfigured(): boolean {
  return client !== null;
}
