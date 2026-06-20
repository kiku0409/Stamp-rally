import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, getProjectRole } from '@/lib/authMiddleware';

// 特典段階の追加: プロジェクトの owner のみ
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();
  if ((await getProjectRole(supabase, auth.user.id, id)) !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { threshold, label } = await request.json();
  const th = Number(threshold);
  if (!Number.isInteger(th) || th <= 0 || !label?.trim()) {
    return NextResponse.json({ error: '個数（1以上）と特典名は必須です' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_reward_tiers')
    .insert({ project_id: id, threshold: th, label: label.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'その個数の段階は既に存在します' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// 特典段階の編集: owner のみ。ラベル/個数を更新（削除→再追加を不要にし取得者記録を保全）。
// 注: 個数の変更は遡及的な付与/取消はしない。
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();
  if ((await getProjectRole(supabase, auth.user.id, id)) !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { tier_id, threshold, label } = await request.json();
  if (!tier_id) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (label !== undefined) {
    if (!String(label).trim()) return NextResponse.json({ error: '特典名は必須です' }, { status: 400 });
    update.label = String(label).trim();
  }
  if (threshold !== undefined) {
    const th = Number(threshold);
    if (!Number.isInteger(th) || th <= 0) return NextResponse.json({ error: '個数は1以上の整数で指定してください' }, { status: 400 });
    update.threshold = th;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '更新内容がありません' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_reward_tiers')
    .update(update)
    .eq('id', tier_id)
    .eq('project_id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'その個数の段階は既に存在します' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// 特典段階の削除: owner のみ（?tier_id=）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();
  if ((await getProjectRole(supabase, auth.user.id, id)) !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tierId = searchParams.get('tier_id');
  if (!tierId) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

  const { error } = await supabase
    .from('project_reward_tiers')
    .delete()
    .eq('id', tierId)
    .eq('project_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
