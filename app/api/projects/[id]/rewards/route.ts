import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isSuperAdmin, getProjectRole } from '@/lib/authMiddleware';

// 特典取得者一覧: プロジェクトのメンバーまたはスーパー管理者
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const canView = isSuperAdmin(auth.user) || (await getProjectRole(supabase, auth.user.id, id)) !== null;
  if (!canView) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('participant_rewards')
    .select('issued_at, redeemed_at, participant:participants(nickname), tier:project_reward_tiers(label, threshold)')
    .eq('project_id', id)
    .order('issued_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { issued_at: string; redeemed_at: string | null; participant?: { nickname: string } | null; tier?: { label: string; threshold: number } | null };
  const rows = (data ?? []) as unknown as Row[];
  const recipients = rows.map((r) => ({
    nickname: r.participant?.nickname ?? '不明',
    label: r.tier?.label ?? '特典',
    threshold: r.tier?.threshold ?? 0,
    issued_at: r.issued_at,
    redeemed_at: r.redeemed_at,
  }));

  return NextResponse.json(recipients);
}
