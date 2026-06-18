import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isApprovedMember } from '@/lib/authMiddleware';

// 取得: 来場者がQRからアクセスするため公開（id または qr_token で検索）
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const isUUID = /^[0-9a-f-]{36}$/i.test(id);
  const query = supabase.from('events').select('*');
  const { data, error } = isUUID
    ? await query.or(`id.eq.${id},qr_token.eq.${id}`).maybeSingle()
    : await query.eq('qr_token', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json(data);
}

// 編集: イベントが属するプロジェクトの承認済みメンバーのみ
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
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || !(await isApprovedMember(supabase, user.id, existing.project_id))) {
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

// 削除: イベントが属するプロジェクトの承認済みメンバーのみ
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
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || !(await isApprovedMember(supabase, user.id, existing.project_id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
