import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isApprovedMember } from '@/lib/authMiddleware';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('slot_schedules')
    .select('*, event:events(id, title, event_date, qr_token)')
    .eq('slot_id', id)
    .order('start_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: slot } = await supabase
    .from('slots')
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!slot || !(await isApprovedMember(supabase, user.id, slot.project_id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { event_id, start_at, end_at } = await request.json();
  if (!event_id || !start_at || !end_at) {
    return NextResponse.json({ error: 'event_id, start_at, end_at は必須です' }, { status: 400 });
  }
  if (new Date(start_at) >= new Date(end_at)) {
    return NextResponse.json({ error: '開始時刻は終了時刻より前にしてください' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('slot_schedules')
    .insert({ slot_id: id, event_id, start_at, end_at })
    .select('*, event:events(id, title, event_date, qr_token)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
