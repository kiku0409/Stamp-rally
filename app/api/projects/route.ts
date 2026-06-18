import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isSuperAdmin } from '@/lib/authMiddleware';

// 一覧: スーパー管理者は全プロジェクト、一般管理者は自分が所属するプロジェクト
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const supabase = createAdminClient();

  if (isSuperAdmin(user)) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  const { data: memberships, error: mErr } = await supabase
    .from('project_members')
    .select('project_id, role')
    .eq('user_id', user.id);
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const ids = (memberships ?? []).map((m) => m.project_id);
  if (ids.length === 0) return NextResponse.json([]);

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const roleMap = Object.fromEntries((memberships ?? []).map((m) => [m.project_id, m.role]));
  return NextResponse.json((projects ?? []).map((p) => ({ ...p, role: roleMap[p.id] })));
}

// 申請: 誰でも（承認待ち状態で）プロジェクトを申請でき、申請者は owner になる
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'プロジェクト名は必須です' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, description, created_by: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: mErr } = await supabase
    .from('project_members')
    .insert({ project_id: project.id, user_id: user.id, role: 'owner' });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json(project, { status: 201 });
}
