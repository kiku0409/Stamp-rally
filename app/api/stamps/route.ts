import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';

type AdminClient = ReturnType<typeof createAdminClient>;

// スタンプ付与後、当該プロジェクトの特典段階を判定して未付与分を付与。新規付与のラベルを返す。
async function issueRewards(
  supabase: AdminClient,
  participantId: string,
  eventId: string
): Promise<{ label: string }[]> {
  const { data: event } = await supabase
    .from('events')
    .select('project_id')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return [];
  const projectId = event.project_id;

  // このプロジェクト内の参加者のスタンプ数
  const { count } = await supabase
    .from('event_stamps')
    .select('id, events!inner(project_id)', { count: 'exact', head: true })
    .eq('participant_id', participantId)
    .eq('events.project_id', projectId);
  const stampCount = count ?? 0;

  // 達成済みの段階
  const { data: tiers } = await supabase
    .from('project_reward_tiers')
    .select('id, label, threshold')
    .eq('project_id', projectId)
    .lte('threshold', stampCount);
  if (!tiers || tiers.length === 0) return [];

  // 既に付与済みの段階を除外
  const { data: existing } = await supabase
    .from('participant_rewards')
    .select('tier_id')
    .eq('participant_id', participantId)
    .eq('project_id', projectId);
  const existingIds = new Set((existing ?? []).map((r) => r.tier_id));

  const newTiers = tiers.filter((t) => !existingIds.has(t.id));
  if (newTiers.length === 0) return [];

  const granted: { label: string }[] = [];
  for (const t of newTiers) {
    // redeem_code の一意制約違反は再採番してリトライ
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase
        .from('participant_rewards')
        .insert({ participant_id: participantId, tier_id: t.id, project_id: projectId, redeem_code: generateCode(10) });
      if (!error) { granted.push({ label: t.label }); break; }
      if (error.code !== '23505') break;
      // 23505 が participant+tier の重複（並行付与）なら中断、redeem_code 重複なら再試行
      if (existingIds.has(t.id)) break;
    }
  }
  return granted;
}

// 一覧取得はプロジェクト単位集約の /api/stamp-book（recovery_code 認証）に統一したため、
// participant_id だけで全スタンプを返す公開 GET は廃止した。

// POST: Acquire a stamp
export async function POST(request: Request) {
  const body = await request.json();
  const { participant_id, event_id } = body;

  if (!participant_id || !event_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check for duplicate
  const { data: existing } = await supabase
    .from('event_stamps')
    .select('*')
    .eq('participant_id', participant_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ alreadyStamped: true, stamp: existing }, { status: 200 });
  }

  const { data, error } = await supabase
    .from('event_stamps')
    .insert({ participant_id, event_id })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      return NextResponse.json({ alreadyStamped: true }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const newRewards = await issueRewards(supabase, participant_id, event_id);

  return NextResponse.json({ alreadyStamped: false, stamp: data, newRewards }, { status: 201 });
}
