import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  isSuperAdmin,
  getProjectRole,
} from '@/lib/authMiddleware';

// 統計: ?event_id（単一イベント）または ?project_id（プロジェクト合計）
// メンバーまたはスーパー管理者が閲覧可能
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const projectId = searchParams.get('project_id');

  const supabase = createAdminClient();

  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('project_id')
      .eq('id', eventId)
      .maybeSingle();
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const canView = isSuperAdmin(user) || (await getProjectRole(supabase, user.id, event.project_id)) !== null;
    if (!canView) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('event_stamps')
      .select('participant_id')
      .eq('event_id', eventId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      stampCount: data.length,
      participantCount: new Set(data.map((d) => d.participant_id)).size,
    });
  }

  if (projectId) {
    const canView = isSuperAdmin(user) || (await getProjectRole(supabase, user.id, projectId)) !== null;
    if (!canView) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: events, error: evErr } = await supabase
      .from('events')
      .select('id')
      .eq('project_id', projectId);
    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

    const eventIds = (events ?? []).map((e) => e.id);
    if (eventIds.length === 0) {
      return NextResponse.json({ totalStamps: 0, totalParticipants: 0 });
    }

    const { data: stamps, error } = await supabase
      .from('event_stamps')
      .select('participant_id, event_id')
      .in('event_id', eventIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      totalStamps: stamps.length,
      totalParticipants: new Set(stamps.map((s) => s.participant_id)).size,
    });
  }

  return NextResponse.json({ error: 'event_id or project_id required' }, { status: 400 });
}
