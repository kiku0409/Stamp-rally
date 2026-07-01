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

  // スタンプ（イベント＋プロジェクト名・テーマ・画像URLを埋め込み）
  const { data: stamps, error } = await supabase
    .from('event_stamps')
    .select('*, event:events(*, project:projects(*))')
    .eq('participant_id', participantId)
    .order('stamped_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type ProjData = { id: string; name: string; theme_id?: string; venue_map_url?: string; timetable_url?: string };
  type StampRow = {
    event?: { project_id?: string; project?: ProjData | null } | null;
  };
  const rows = (stamps ?? []) as StampRow[];

  // プロジェクトごとに束ねる
  const groups = new Map<string, StampBookGroup>();
  for (const s of rows) {
    const proj = s.event?.project;
    if (!proj) continue;
    if (!groups.has(proj.id)) {
      groups.set(proj.id, {
        project: {
          id: proj.id,
          name: proj.name,
          theme_id: proj.theme_id,
          venue_map_url: proj.venue_map_url,
          timetable_url: proj.timetable_url,
          images: [],
        },
        count: 0, stamps: [], tiers: [], rewards: [],
      });
    }
    const g = groups.get(proj.id)!;
    g.count += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    g.stamps.push(s as any);
  }

  const projectIds = [...groups.keys()];
  if (projectIds.length > 0) {
    const [{ data: tiers }, { data: rewards }, { data: images }, { data: allEvents }] = await Promise.all([
      supabase.from('project_reward_tiers').select('*').in('project_id', projectIds).order('threshold', { ascending: true }),
      supabase.from('participant_rewards').select('project_id, issued_at, redeem_code, redeemed_at, tier:project_reward_tiers(label)').eq('participant_id', participantId).in('project_id', projectIds),
      supabase.from('project_images').select('*').in('project_id', projectIds).order('sort_order', { ascending: true }),
      supabase.from('events').select('*').in('project_id', projectIds).order('event_date', { ascending: true }),
    ]);

    for (const t of tiers ?? []) {
      const g = groups.get(t.project_id);
      if (g) g.tiers.push({ id: t.id, threshold: t.threshold, label: t.label, earned: g.count >= t.threshold });
    }
    type RewardRow = { project_id: string; issued_at: string; redeem_code: string; redeemed_at: string | null; tier?: { label: string } | null };
    for (const r of (rewards ?? []) as unknown as RewardRow[]) {
      const g = groups.get(r.project_id);
      if (g) g.rewards.push({ label: r.tier?.label ?? '特典', issued_at: r.issued_at, redeem_code: r.redeem_code, redeemed_at: r.redeemed_at });
    }
    for (const img of images ?? []) {
      const g = groups.get(img.project_id);
      if (g) g.project.images!.push(img);
    }
    for (const ev of allEvents ?? []) {
      const g = groups.get(ev.project_id);
      if (g) {
        if (!g.events) g.events = [];
        g.events.push(ev);
      }
    }
  }

  return NextResponse.json([...groups.values()]);
}
