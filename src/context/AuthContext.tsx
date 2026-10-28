import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isDemoMode, supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';

const DEMO_KEY = 'mangi.demo.profile';

type Result = { error?: string; info?: string };

type SignUpInput = { email: string; password: string; username: string; role: Role };

type AuthValue = {
  user: Profile | null;
  loading: boolean;
  demo: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (input: SignUpInput) => Promise<Result>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (m.includes('email not confirmed')) return "Confirme d'abord ton e-mail, puis reconnecte-toi.";
  if (m.includes('password')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (m.includes('network') || m.includes('fetch')) return 'Pas de connexion Internet. Réessaie dans un instant.';
  return message;
}

function emptyProfile(id: string, username: string, role: Role): Profile {
  return {
    id,
    username,
    role,
    strikes_count: 0,
    is_restricted: false,
    restriction_end_date: null,
    coins_balance: 0,
    mobile_money_number: null,
    consistency_score: 0,
  };
}

async function loadProfile(session: Session): Promise<Profile> {
  const meta = (session.user.user_metadata ?? {}) as { username?: string; role?: Role };
  const fallback = emptyProfile(session.user.id, meta.username ?? 'artiste', meta.role ?? 'lecteur');
  if (!supabase) return fallback;
  const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
  if (error || !data) return fallback;
  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      AsyncStorage.getItem(DEMO_KEY)
        .then((raw) => {
          if (active && raw) setUser(JSON.parse(raw) as Profile);
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }

    const apply = async (session: Session | null) => {
      if (!session) {
        if (active) setUser(null);
      } else {
        const profile = await loadProfile(session);
        if (active) setUser(profile);
      }
      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // On sort du rappel avant d'appeler Supabase pour éviter un blocage.
      setTimeout(() => {
        apply(session);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    if (!supabase) {
      const raw = await AsyncStorage.getItem(DEMO_KEY);
      if (!raw) return { error: "Aucun compte démo sur ce téléphone. Crée-en un d'abord." };
      setUser(JSON.parse(raw) as Profile);
      return {};
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: translate(error.message) } : {};
  }, []);

  const signUp = useCallback(async (input: SignUpInput): Promise<Result> => {
    if (!supabase) {
      const profile = emptyProfile(`demo-${Date.now()}`, input.username, input.role);
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(profile));
      setUser(profile);
      return {};
    }
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { username: input.username, role: input.role } },
    });
    if (error) return { error: translate(error.message) };
    if (!data.session) {
      return { info: 'Compte créé. Confirme ton e-mail, puis connecte-toi.' };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, demo: isDemoMode, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
