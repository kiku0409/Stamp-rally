import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  currentUserPromise = null;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getAccessToken(): Promise<string> {
  const session = await getSession();
  return session?.access_token ?? '';
}

let currentUserPromise: Promise<User | null> | null = null;

export function getCurrentUser(): Promise<User | null> {
  if (!currentUserPromise) {
    currentUserPromise = supabase.auth.getUser()
      .then(({ data }) => data.user)
      .catch((err) => { currentUserPromise = null; throw err; });
  }
  return currentUserPromise;
}

export function isSuperAdmin(user: User | null): boolean {
  return (user?.app_metadata as Record<string, unknown>)?.role === 'super_admin';
}
