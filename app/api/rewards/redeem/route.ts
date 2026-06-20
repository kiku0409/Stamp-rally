import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { normalizeCode } from '@/lib/code';
import { requireAdmin, isAuthFailure, isSuperAdmin, getProjectRole } from '@/lib/authMiddleware';

type AdminClient = ReturnType<typeof createAdminClient>;

async function lookup(supabase: AdminClient, code: string) {
  const { data } = await supabase
    .from('participant_rewards')
    .select('id, project_id, redeemed_at, participant:participants(nickname), tier:project_reward_tiers(label, threshold), project:projects(name)')
    .eq('redeem_code', normalizeCode(code))
    .maybeSingle();
  return data as unknown as {
    id: string;
    project_id: string;
    redeemed_at: string | null;
    participant?: { nickname: string } | null;
    tier?: { label: string; threshold: number } | null;
    project?: { name: string } | null;
  } | null;
}

function present(row: NonNullable<Awaited<ReturnType<typeof lookup>>>) {
  return {
    nickname: row.participant?.nickname ?? '不明',
    label: row.tier?.label ?? '特典',
    threshold: row.tier?.threshold ?? 0,
    project_name: row.project?.name ?? '',
    redeemed_at: row.redeemed_at,
  };
}

// 照合: スキャン直後に名前・特典内容・引き換え状態を表示する
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const supabase = createAdminClient();
  const row = await lookup(supabase, code);
  if (!row) return NextResponse.json({ error: '特典が見つかりません' }, { status: 404 });

  const canView = isSuperAdmin(auth.user) || (await getProjectRole(supabase, auth.user.id, row.project_id)) !== null;
  if (!canView) return NextResponse.json({ error: 'このプロジェクトの権限がありません' }, { status: 403 });

  return NextResponse.json(present(row));
}

// 使用済み化（お渡し完了）: 確認ボタンから呼ぶ。一回限り。
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const supabase = createAdminClient();
  const row = await lookup(supabase, code);
  if (!row) return NextResponse.json({ error: '特典が見つかりません' }, { status: 404 });

  const canView = isSuperAdmin(auth.user) || (await getProjectRole(supabase, auth.user.id, row.project_id)) !== null;
  if (!canView) return NextResponse.json({ error: 'このプロジェクトの権限がありません' }, { status: 403 });

  if (row.redeemed_at) {
    return NextResponse.json({ error: '既に引き換え済みです', ...present(row) }, { status: 409 });
  }

  const { error } = await supabase
    .from('participant_rewards')
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: auth.user.id })
    .eq('id', row.id)
    .is('redeemed_at', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updated = await lookup(supabase, code);
  return NextResponse.json(updated ? present(updated) : present(row));
}
