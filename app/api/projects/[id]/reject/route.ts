import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isSuperAdmin } from '@/lib/authMiddleware';

// 却下: スーパー管理者のみ
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  if (!isSuperAdmin(auth.user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  let reason: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.reason === 'string' && body.reason.trim()) reason = body.reason.trim();
  } catch {
    // body 無しでも許容
  }

  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'rejected', approved_by: auth.user.id, approved_at: new Date().toISOString(), reject_reason: reason })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
