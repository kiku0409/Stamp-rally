import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname } = body;

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // recovery_code の一意制約違反(23505)時は再採番してリトライ
  let participant = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('participants')
      .insert({ nickname: nickname.trim(), recovery_code: generateCode(12) })
      .select()
      .single();
    if (!error) { participant = data; break; }
    lastError = error;
    if (error.code !== '23505') break;
  }

  if (!participant) {
    return NextResponse.json({ error: lastError?.message ?? '登録に失敗しました' }, { status: 500 });
  }

  return NextResponse.json(participant, { status: 201 });
}
