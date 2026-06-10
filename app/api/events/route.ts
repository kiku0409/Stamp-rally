import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const adminPassword = request.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, event_date, venue, description } = body;

  if (!title || !event_date || !venue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const qr_token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('events')
    .insert({ title, event_date, venue, description, qr_token })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
