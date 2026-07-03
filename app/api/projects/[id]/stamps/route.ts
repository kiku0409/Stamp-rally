import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isSuperAdmin, getProjectRole } from '@/lib/authMiddleware';

// プロジェクト内の全スタンプ取得者（イベント名・ニックネーム・取得日時）。CSV書き出し用。
// メンバーまたはスーパー管理者のみ。
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

  const { data: events } = await supabase.from('events').select('id').eq('project_id', id);
  const eventIds = (events ?? []).map((e) => e.id);
  if (eventIds.length === 0) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('event_stamps')
    .select('stamped_at, event:events(title), participant:participants(nickname, gender, age, age_group)')
    .in('event_id', eventIds)
    .order('stamped_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    stamped_at: string;
    event?: { title: string } | null;
    participant?: { nickname: string; gender: string | null; age: number | null; age_group: string | null } | null;
  };
  const rows = (data ?? []) as unknown as Row[];
  return NextResponse.json(
    rows.map((r) => ({
      event_title: r.event?.title ?? '',
      nickname: r.participant?.nickname ?? '',
      gender: r.participant?.gender ?? '',
      // 年齢: 新形式 age(INTEGER) を優先し、レガシー行は age_group（数値文字列 or 「20代」等）にフォールバック。
      // JSONフィールド名は互換のため age_group のまま（クライアント app/admin/projects/[id]/page.tsx が参照）。
      age_group: r.participant?.age != null ? String(r.participant.age) : (r.participant?.age_group ?? ''),
      stamped_at: r.stamped_at,
    }))
  );
}
