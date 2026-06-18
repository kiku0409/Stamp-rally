import { NextResponse } from 'next/server';
import { createAdminClient } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { ProjectRole } from '@/types';

type AdminClient = ReturnType<typeof createAdminClient>;

type AuthSuccess = { user: User };
type AuthFailure = NextResponse;

export async function requireAdmin(request: Request): Promise<AuthSuccess | AuthFailure> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user };
}

export function isAuthFailure(result: AuthSuccess | AuthFailure): result is AuthFailure {
  return result instanceof NextResponse;
}

export function isSuperAdmin(user: User): boolean {
  return (user.app_metadata as Record<string, unknown>)?.['role'] === 'super_admin';
}

/** プロジェクトでのロールを返す（所属していなければ null）。status は問わない。 */
export async function getProjectRole(
  supabase: AdminClient,
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.role as ProjectRole) ?? null;
}

/** ユーザーが承認済みプロジェクトのメンバーかどうか。 */
export async function isApprovedMember(
  supabase: AdminClient,
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getProjectRole(supabase, userId, projectId);
  if (!role) return false;
  const { data: project } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .maybeSingle();
  return project?.status === 'approved';
}

/** ユーザーが所属する全プロジェクトの ID（status 問わず）。 */
export async function getMemberProjectIds(
  supabase: AdminClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);
  return (data ?? []).map((r) => r.project_id as string);
}

/** user_id → email のマップを返す（Supabase Auth の管理APIを使用）。 */
export async function getEmailMap(
  supabase: AdminClient,
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const wanted = new Set(userIds);
  const map: Record<string, string> = {};
  for (const u of data?.users ?? []) {
    if (wanted.has(u.id) && u.email) map[u.id] = u.email;
  }
  return map;
}

/** email からユーザーを検索（見つからなければ null）。 */
export async function findUserByEmail(
  supabase: AdminClient,
  email: string
): Promise<User | null> {
  const target = email.trim().toLowerCase();
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users ?? []).find((u) => u.email?.toLowerCase() === target) ?? null;
}
