import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  isSuperAdmin,
  getProjectRole,
  isApprovedMember,
} from '@/lib/authMiddleware';

// 一覧: 指定プロジェクトのイベント。メンバーまたはスーパー管理者のみ
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
    .from('events')
    .select('*')
    .eq('project_id', projectId)
    .order('event_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 作成: 承認済みプロジェクトのメンバーのみ（スーパー管理者は閲覧のみのため作成不可）
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const body = await request.json();
  const { project_id, title, event_date, venue, description, icon_url } = body;

  if (!project_id || !title || !event_date || !venue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const approved = await isApprovedMember(supabase, user.id, project_id);
  if (!approved) {
    return NextResponse.json(
      { error: 'このプロジェクトでイベントを作成する権限がありません' },
      { status: 403 }
    );
  }

  const qr_token = crypto.randomUUID();
  const row: Record<string, unknown> = { title, event_date, venue, description, qr_token, project_id };
  if (icon_url) row.icon_url = icon_url;
  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
