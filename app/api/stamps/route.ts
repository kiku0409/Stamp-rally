import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET: Get all stamps for a participant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participant_id');

  if (!participantId) {
    return NextResponse.json({ error: 'participant_id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('event_stamps')
    .select('*, event:events(*)')
    .eq('participant_id', participantId)
    .order('stamped_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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
    .select('id')
    .eq('participant_id', participant_id)
    .eq('event_id', event_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ alreadyStamped: true }, { status: 200 });
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

  return NextResponse.json({ alreadyStamped: false, stamp: data }, { status: 201 });
}
