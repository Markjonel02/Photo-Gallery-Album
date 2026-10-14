import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { secureStorage } from './secureStorage';

/**
 * Single Supabase client for the app. The anon key is public by design; all
 * data access is protected by Row Level Security (see supabase/migrations).
 * When env is missing we use a dummy URL — the UI shows a config screen
 * and never issues requests.
 */
export const supabase = createClient(
  env?.supabaseUrl ?? 'https://not-configured.supabase.co',
  env?.supabaseAnonKey ?? 'not-configured-not-configured',
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
