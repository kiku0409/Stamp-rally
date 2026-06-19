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

// 8桁の参加コードを生成（曖昧な文字を避けた英大文字＋数字）
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// 申請: 誰でも（承認待ち状態で）プロジェクトを申請でき、申請者は owner になる
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'プロジェクト名は必須です' }, { status: 400 });

  const supabase = createAdminClient();

  // 軽量スパム対策: 承認待ちの申請が一定数を超えたら新規申請を拒否
  // （本格的なリクエストレート制限は Vercel KV / Upstash 等の外部ストアが必要）
  const PENDING_LIMIT = 5;
  const { count: pendingCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('status', 'pending');
  if ((pendingCount ?? 0) >= PENDING_LIMIT) {
    return NextResponse.json(
      { error: `承認待ちの申請が${PENDING_LIMIT}件あります。承認・却下を待ってから申請してください。` },
      { status: 429 }
    );
  }

  // join_code の一意制約違反(23505)時は再採番してリトライ
  let project = null;
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, created_by: user.id, join_code: generateJoinCode() })
      .select()
      .single();
    if (!error) { project = data; break; }
    lastError = error;
    if (error.code !== '23505') break;
  }
  if (!project) {
    return NextResponse.json({ error: lastError?.message ?? '作成に失敗しました' }, { status: 500 });
  }

  const { error: mErr } = await supabase
    .from('project_members')
    .insert({ project_id: project.id, user_id: user.id, role: 'owner' });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json(project, { status: 201 });
}
