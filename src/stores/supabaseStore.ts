import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initSupabaseClient, destroySupabaseClient, getSupabaseClient } from '../services/supabase/client';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SupabaseState {
  url: string;
  anonKey: string;
  connectionStatus: ConnectionStatus;
  autoSync: boolean;
  lastSyncedAt: number | null;
  syncInProgress: boolean;
  userId: string | null; // Supabase user UUID

  setUrl: (url: string) => void;
  setAnonKey: (key: string) => void;
  setAutoSync: (v: boolean) => void;
  setLastSyncedAt: (ts: number) => void;
  setSyncInProgress: (v: boolean) => void;
  setUserId: (id: string | null) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;

  connect: () => Promise<boolean>;
  disconnect: () => void;
  isConfigured: () => boolean;
}

export const useSupabaseStore = create<SupabaseState>()(
  persist(
    (set, get) => ({
      url: '',
      anonKey: '',
      connectionStatus: 'disconnected',
      autoSync: false,
      lastSyncedAt: null,
      syncInProgress: false,
      userId: null,

      setUrl: (url) => set({ url }),
      setAnonKey: (anonKey) => set({ anonKey }),
      setAutoSync: (autoSync) => set({ autoSync }),
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
      setSyncInProgress: (syncInProgress) => set({ syncInProgress }),
      setUserId: (userId) => set({ userId }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

      connect: async () => {
        const { url, anonKey } = get();
        if (!url || !anonKey) return false;
        set({ connectionStatus: 'connecting' });
        try {
          initSupabaseClient(url, anonKey);
          // Test connection by making a simple request
          const client = getSupabaseClient();
          if (!client) { set({ connectionStatus: 'error' }); return false; }
          // Try to query users table (will fail if table doesn't exist, but connection works)
          const { error } = await client.from('users').select('id').limit(1);
          if (error && !error.message.includes('0 rows')) {
            // Check if it's an auth/connection error vs just empty table
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              set({ connectionStatus: 'error' });
              return false;
            }
          }
          set({ connectionStatus: 'connected' });
          return true;
        } catch {
          set({ connectionStatus: 'error' });
          destroySupabaseClient();
          return false;
        }
      },

      disconnect: () => {
        destroySupabaseClient();
        set({ connectionStatus: 'disconnected', userId: null });
      },

      isConfigured: () => {
        const { url, anonKey } = get();
        return !!url && !!anonKey;
      },
    }),
    {
      name: 'fitai-supabase',
      partialize: (state) => ({
        url: state.url,
        anonKey: state.anonKey,
        autoSync: state.autoSync,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
