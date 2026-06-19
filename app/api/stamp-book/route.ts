import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { normalizeCode } from '@/lib/code';
import type { StampBookGroup } from '@/types';

// 来場者のスタンプ帳をプロジェクト単位に集約して返す。
// 本人の秘密である recovery_code を必須にし、participant_id だけでは読めないようにする。
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: participant } = await supabase
    .from('participants')
    .select('id')
    .eq('recovery_code', normalizeCode(code))
    .maybeSingle();
  if (!participant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const participantId = participant.id;

  // スタンプ（イベント＋プロジェクト名を埋め込み）
  const { data: stamps, error } = await supabase
    .from('event_stamps')
    .select('*, event:events(*, project:projects(id, name))')
    .eq('participant_id', participantId)
    .order('stamped_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type StampRow = {
    event?: { project_id?: string; project?: { id: string; name: string } | null } | null;
  };
  const rows = (stamps ?? []) as StampRow[];

  // プロジェクトごとに束ねる
  const groups = new Map<string, StampBookGroup>();
  for (const s of rows) {
    const proj = s.event?.project;
    if (!proj) continue;
    if (!groups.has(proj.id)) {
      groups.set(proj.id, { project: { id: proj.id, name: proj.name }, count: 0, stamps: [], tiers: [], rewards: [] });
    }
    const g = groups.get(proj.id)!;
    g.count += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.stamps.push(s as any);
  }

  const projectIds = [...groups.keys()];
  if (projectIds.length > 0) {
    const [{ data: tiers }, { data: rewards }] = await Promise.all([
      supabase.from('project_reward_tiers').select('*').in('project_id', projectIds).order('threshold', { ascending: true }),
      supabase.from('participant_rewards').select('project_id, issued_at, tier:project_reward_tiers(label)').eq('participant_id', participantId).in('project_id', projectIds),
    ]);

    for (const t of tiers ?? []) {
      const g = groups.get(t.project_id);
      if (g) g.tiers.push({ id: t.id, threshold: t.threshold, label: t.label, earned: g.count >= t.threshold });
    }
    type RewardRow = { project_id: string; issued_at: string; tier?: { label: string } | null };
    for (const r of (rewards ?? []) as unknown as RewardRow[]) {
      const g = groups.get(r.project_id);
      if (g) g.rewards.push({ label: r.tier?.label ?? '特典', issued_at: r.issued_at });
    }
  }

  return NextResponse.json([...groups.values()]);
}
