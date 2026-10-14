import { supabase } from '@/lib/supabase';
import { storageService } from './storageService';

export const authService = {
  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  /** Returns true when the account is usable immediately (email confirmation disabled). */
  async signUp(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session !== null;
  },

  async signOut(): Promise<void> {
    storageService.clearCache();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
