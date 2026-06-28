import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname, gender, age_group } = body;

  const supabase = createAdminClient();

  // nickname が未指定の場合は性別・年代から自動生成
  const resolvedNickname = nickname?.trim() || `${age_group ?? ''}${gender ?? ''}来場者` || '来場者';

  const baseData: Record<string, string> = { nickname: resolvedNickname };
  if (gender) baseData.gender = gender;
  if (age_group) baseData.age_group = age_group;

  // recovery_code の一意制約違反(23505)時は再採番してリトライ
  let participant = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('participants')
      .insert({ ...baseData, recovery_code: generateCode(12) })
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

export async function PATCH(request: Request) {
  const body = await request.json();
  const { participant_id, nickname } = body;

  if (!participant_id || !nickname?.trim()) {
    return NextResponse.json({ error: 'participant_id and nickname are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('participants')
    .update({ nickname: nickname.trim() })
    .eq('id', participant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
