import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, getProjectRole } from '@/lib/authMiddleware';

// 参加コードでプロジェクトに参加（member として追加）
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: '参加コードを入力してください' }, { status: 400 });

  const supabase = createAdminClient();
  const normalized = String(code).trim().toUpperCase();

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('join_code', normalized)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: '参加コードが正しくありません' }, { status: 404 });
  }

  const existing = await getProjectRole(supabase, user.id, project.id);
  if (existing) {
    return NextResponse.json({ error: '既にこのプロジェクトに参加しています', project_id: project.id }, { status: 400 });
  }

  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: project.id, user_id: user.id, role: 'member' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ project_id: project.id }, { status: 201 });
}
