import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname, birth_decade } = body;

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('participants')
    .insert({ nickname: nickname.trim(), birth_decade: birth_decade ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
