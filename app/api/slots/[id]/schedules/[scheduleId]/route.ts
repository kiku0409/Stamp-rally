import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isApprovedMember } from '@/lib/authMiddleware';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;

  const { id, scheduleId } = await params;
  const supabase = createAdminClient();

  const { data: slot } = await supabase
    .from('slots')
    .select('project_id')
    .eq('id', id)
    .maybeSingle();

  if (!slot || !(await isApprovedMember(supabase, user.id, slot.project_id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('slot_schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('slot_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
