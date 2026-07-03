import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCode } from '@/lib/code';

/**
 * 年齢入力の互換レイヤー。
 * - 新形式: `age`（数値、または数値文字列）を優先
 * - 旧形式: `age_group`（数値文字列なら age に変換、「20代」等はそのまま保持）
 * 移行期間中は age(INTEGER) と age_group(TEXT) の両方に書き込み、
 * 旧リーダー（age_group を読むコード）を壊さない。
 */
function resolveAgeFields(age: unknown, age_group: unknown): { age?: number; age_group?: string } {
  if (typeof age === 'number' && Number.isFinite(age)) {
    const n = Math.trunc(age);
    return { age: n, age_group: String(n) };
  }
  if (typeof age === 'string' && /^\d+$/.test(age)) {
    const n = parseInt(age, 10);
    return { age: n, age_group: String(n) };
  }
  if (typeof age_group === 'string' && age_group) {
    if (/^\d+$/.test(age_group)) {
      const n = parseInt(age_group, 10);
      return { age: n, age_group: String(n) };
    }
    // レガシー形式（「20代」等）は数値を推測せず age_group のみ保持
    return { age_group };
  }
  return {};
}

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname, gender, age, age_group } = body;

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const baseData: Record<string, string | number> = { nickname: nickname.trim() };
  if (gender) baseData.gender = gender;
  const ageFields = resolveAgeFields(age, age_group);
  if (ageFields.age !== undefined) baseData.age = ageFields.age;
  if (ageFields.age_group !== undefined) baseData.age_group = ageFields.age_group;

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
  const { participant_id, nickname, gender, age, age_group } = body;

  if (!participant_id) {
    return NextResponse.json({ error: 'participant_id is required' }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};
  if (nickname?.trim()) updates.nickname = nickname.trim();
  if (gender) updates.gender = gender;
  const ageFields = resolveAgeFields(age, age_group);
  if (ageFields.age !== undefined) updates.age = ageFields.age;
  if (ageFields.age_group !== undefined) updates.age_group = ageFields.age_group;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', participant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
