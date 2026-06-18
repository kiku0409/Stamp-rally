import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  const supabase = createAdminClient();

  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('admin_id')
      .eq('id', eventId)
      .maybeSingle();

    if (!event || event.admin_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

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

  // Overall stats for this admin's events only
  const { data: adminEvents, error: evErr } = await supabase
    .from('events')
    .select('id')
    .eq('admin_id', user.id);

  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });

  const eventIds = adminEvents.map((e) => e.id);
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
