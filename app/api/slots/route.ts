import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  isSuperAdmin,
  getProjectRole,
  isApprovedMember,
} from '@/lib/authMiddleware';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const supabase = createAdminClient();
  const role = await getProjectRole(supabase, user.id, projectId);
  if (!role && !isSuperAdmin(user)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const body = await request.json();
  const { project_id, name } = body;
  if (!project_id || !name) {
    return NextResponse.json({ error: 'project_id と name は必須です' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const approved = await isApprovedMember(supabase, user.id, project_id);
  if (!approved) {
    return NextResponse.json({ error: 'このプロジェクトでスロットを作成する権限がありません' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('slots')
    .insert({ project_id, name })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
