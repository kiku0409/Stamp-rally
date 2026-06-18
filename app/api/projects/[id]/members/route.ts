import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  getProjectRole,
  findUserByEmail,
} from '@/lib/authMiddleware';

// メンバー招待: プロジェクトの owner のみ。email で登録済みユーザーを追加
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const role = await getProjectRole(supabase, auth.user.id, id);
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 });

  const target = await findUserByEmail(supabase, email);
  if (!target) {
    return NextResponse.json(
      { error: 'そのメールアドレスの管理者は登録されていません（先にセルフ登録が必要です）' },
      { status: 404 }
    );
  }

  const existing = await getProjectRole(supabase, target.id, id);
  if (existing) return NextResponse.json({ error: '既にメンバーです' }, { status: 400 });

  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: id, user_id: target.id, role: 'member' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: target.id, email: target.email }, { status: 201 });
}

// メンバー削除: owner のみ。owner ロールのメンバーは削除不可
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const role = await getProjectRole(supabase, auth.user.id, id);
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const targetRole = await getProjectRole(supabase, userId, id);
  if (targetRole === 'owner') {
    return NextResponse.json({ error: 'オーナーは削除できません' }, { status: 400 });
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
