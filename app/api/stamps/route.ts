import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';

type AdminClient = ReturnType<typeof createAdminClient>;

async function issueRewards(
  supabase: AdminClient,
  participantId: string,
  projectId: string
): Promise<{ label: string }[]> {
  // Run stamp count, all tiers, and existing rewards in parallel
  const [countResult, tiersResult, existingResult] = await Promise.all([
    supabase
      .from('event_stamps')
      .select('id, events!inner(project_id)', { count: 'exact', head: true })
      .eq('participant_id', participantId)
      .eq('events.project_id', projectId),
    supabase
      .from('project_reward_tiers')
      .select('id, label, threshold')
      .eq('project_id', projectId),
    supabase
      .from('participant_rewards')
      .select('tier_id')
      .eq('participant_id', participantId)
      .eq('project_id', projectId),
  ]);

  const stampCount = countResult.count ?? 0;
  const allTiers = tiersResult.data ?? [];
  const existingIds = new Set((existingResult.data ?? []).map((r) => r.tier_id));

  const newTiers = allTiers.filter((t) => !existingIds.has(t.id) && t.threshold <= stampCount);
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
      if (existingIds.has(t.id)) break;
    }
  }
  return granted;
}

// POST: Acquire a stamp
// Accepts either { participant_id, event_id } (legacy) or { participant_id, qr_token }.
// When qr_token is provided, the response includes the event object so callers can
// skip the separate GET /api/events request.
export async function POST(request: Request) {
  const body = await request.json();
  const { participant_id, event_id, qr_token } = body;

  if (!participant_id || (!event_id && !qr_token)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let resolvedEventId: string = event_id ?? '';
  let projectId: string | null = null;
  let eventRecord: Record<string, unknown> | null = null;

  if (qr_token) {
    const { data: ev } = await supabase
      .from('events')
      .select('id, title, event_date, venue, qr_token, description, project_id, created_at, icon_url')
      .eq('qr_token', qr_token)
      .maybeSingle();
    if (!ev) {
      return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
    }
    resolvedEventId = ev.id;
    projectId = ev.project_id;
    eventRecord = ev;
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('event_stamps')
    .select('*')
    .eq('participant_id', participant_id)
    .eq('event_id', resolvedEventId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ alreadyStamped: true, stamp: existing, event: eventRecord }, { status: 200 });
  }

  // Insert stamp
  const { data, error } = await supabase
    .from('event_stamps')
    .insert({ participant_id, event_id: resolvedEventId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ alreadyStamped: true, event: eventRecord }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Legacy path (event_id only): fetch project_id separately
  if (!projectId) {
    const { data: ev } = await supabase
      .from('events')
      .select('project_id')
      .eq('id', resolvedEventId)
      .maybeSingle();
    projectId = ev?.project_id ?? null;
  }

  const newRewards = projectId ? await issueRewards(supabase, participant_id, projectId) : [];

  return NextResponse.json({ alreadyStamped: false, stamp: data, newRewards, event: eventRecord }, { status: 201 });
}
