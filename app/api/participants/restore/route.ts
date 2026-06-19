import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { normalizeCode } from '@/lib/code';

// 復元コードから参加者を復元（別端末用）
export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: '復元コードを入力してください' }, { status: 400 });

  const normalized = normalizeCode(String(code));
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('participants')
    .select('id, nickname, recovery_code')
    .eq('recovery_code', normalized)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '復元コードが正しくありません' }, { status: 404 });

  return NextResponse.json(data);
}
