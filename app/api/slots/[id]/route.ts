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
    .from('slots')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
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
    .from('slots')
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || !(await isApprovedMember(supabase, user.id, existing.project_id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'name は必須です' }, { status: 400 });

  const { data, error } = await supabase
    .from('slots')
    .update({ name })
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
    .from('slots')
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || !(await isApprovedMember(supabase, user.id, existing.project_id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase.from('slots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
