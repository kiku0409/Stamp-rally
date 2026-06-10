import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  const supabase = createAdminClient();

  if (eventId) {
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

  // Overall stats
  const { data: stamps, error } = await supabase
    .from('event_stamps')
    .select('participant_id, event_id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    totalStamps: stamps.length,
    totalParticipants: new Set(stamps.map((s) => s.participant_id)).size,
  });
}
