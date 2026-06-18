import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('admin_id', user.id)
    .order('event_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const body = await request.json();
  const { title, event_date, venue, description } = body;

  if (!title || !event_date || !venue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const qr_token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('events')
    .insert({ title, event_date, venue, description, qr_token, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
