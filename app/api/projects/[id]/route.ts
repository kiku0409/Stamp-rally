import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  isSuperAdmin,
  getProjectRole,
  getEmailMap,
} from '@/lib/authMiddleware';

// 詳細: メンバーまたはスーパー管理者のみ。プロジェクト・メンバー・イベントを返す
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const myRole = await getProjectRole(supabase, user.id, id);
  const sa = isSuperAdmin(user);
  if (!myRole && !sa) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: members } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('project_id', id)
    .order('event_date', { ascending: true });

  // 各イベントのスタンプ数を1クエリで集計（クライアントの逐次取得を不要にする）
  const eventList = events ?? [];
  const eventIds = eventList.map((e) => e.id);
  const countMap = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: stampRows } = await supabase
      .from('event_stamps')
      .select('event_id')
      .in('event_id', eventIds);
    for (const r of stampRows ?? []) countMap.set(r.event_id, (countMap.get(r.event_id) ?? 0) + 1);
  }
  const eventsWithCount = eventList.map((e) => ({ ...e, stampCount: countMap.get(e.id) ?? 0 }));

  const { data: rewardTiers } = await supabase
    .from('project_reward_tiers')
    .select('*')
    .eq('project_id', id)
    .order('threshold', { ascending: true });

  const emailMap = await getEmailMap(supabase, (members ?? []).map((m) => m.user_id));
  const membersWithEmail = (members ?? []).map((m) => ({ ...m, email: emailMap[m.user_id] ?? null }));

  return NextResponse.json({
    project,
    members: membersWithEmail,
    events: eventsWithCount,
    rewardTiers: rewardTiers ?? [],
    myRole: myRole ?? null,
    isSuperAdmin: sa,
  });
}

// 更新: オーナーのみ。名称/概要の編集。resubmit=true かつ却下中なら承認待ちに戻す（再申請）。
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();
  if ((await getProjectRole(supabase, auth.user.id, id)) !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, description, resubmit } = await request.json();

  const { data: current } = await supabase
    .from('projects')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) update.name = name.trim();
  if (typeof description === 'string') update.description = description;
  if (resubmit && current.status === 'rejected') {
    update.status = 'pending';
    update.approved_by = null;
    update.approved_at = null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '更新内容がありません' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 削除: プロジェクトのオーナーのみ（スーパー管理者の承認は不要）
// project_members・events・event_stamps は FK の ON DELETE CASCADE で連鎖削除される
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const role = await getProjectRole(supabase, auth.user.id, id);
  if (role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
