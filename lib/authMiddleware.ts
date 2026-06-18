import { NextResponse } from 'next/server';
import { createAdminClient } from './supabase';
import type { User } from '@supabase/supabase-js';

type AuthSuccess = { user: User };
type AuthFailure = NextResponse;

export async function requireAdmin(request: Request): Promise<AuthSuccess | AuthFailure> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user };
}

export function isAuthFailure(result: AuthSuccess | AuthFailure): result is AuthFailure {
  return result instanceof NextResponse;
}
