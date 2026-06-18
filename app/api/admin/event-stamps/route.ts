import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
  requireAdmin,
  isAuthFailure,
  isSuperAdmin,
  getProjectRole,
} from '@/lib/authMiddleware';

// スタンプ取得者一覧: 該当イベントが属するプロジェクトのメンバーまたはスーパー管理者
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from('events')
    .select('project_id')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const canView = isSuperAdmin(user) || (await getProjectRole(supabase, user.id, event.project_id)) !== null;
  if (!canView) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('event_stamps')
    .select('stamped_at, participants(nickname)')
    .eq('event_id', eventId)
    .order('stamped_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
