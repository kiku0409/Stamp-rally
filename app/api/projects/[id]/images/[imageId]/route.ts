import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isApprovedMember } from '@/lib/authMiddleware';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;
  const { id, imageId } = await params;
  const supabase = createAdminClient();

  if (!(await isApprovedMember(supabase, user.id, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('project_images')
    .delete()
    .eq('id', imageId)
    .eq('project_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// 順序変更（↑↓）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;
  const { id, imageId } = await params;
  const supabase = createAdminClient();

  if (!(await isApprovedMember(supabase, user.id, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { sort_order } = await request.json();
  if (typeof sort_order !== 'number') {
    return NextResponse.json({ error: 'sort_order is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_images')
    .update({ sort_order })
    .eq('id', imageId)
    .eq('project_id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
