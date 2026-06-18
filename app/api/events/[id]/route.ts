import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure } from '@/lib/authMiddleware';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Support lookup by qr_token or id
  const isUUID = /^[0-9a-f-]{36}$/i.test(id);
  const query = supabase.from('events').select('*');
  const { data, error } = isUUID
    ? await query.or(`id.eq.${id},qr_token.eq.${id}`).maybeSingle()
    : await query.eq('qr_token', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('events')
    .select('admin_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.admin_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { title, event_date, venue, description } = body;

  const { data, error } = await supabase
    .from('events')
    .update({ title, event_date, venue, description })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('events')
    .select('admin_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.admin_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
