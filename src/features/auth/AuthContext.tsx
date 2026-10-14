import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { isConfigured } from '@/config/env';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: typeof authService.signIn;
  signUp: typeof authService.signUp;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Never leak one account's cached data into another.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut: authService.signOut,
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** For screens that only render when signed in. */
export function useUserId(): string {
  const { user } = useAuth();
  if (!user) throw new Error('useUserId called while signed out');
  return user.id;
}
