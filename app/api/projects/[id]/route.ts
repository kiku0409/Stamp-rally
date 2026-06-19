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
    events: events ?? [],
    rewardTiers: rewardTiers ?? [],
    myRole: myRole ?? null,
    isSuperAdmin: sa,
  });
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
