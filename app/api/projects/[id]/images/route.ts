import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure, isApprovedMember } from '@/lib/authMiddleware';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  const { user } = auth;
  const { id } = await params;
  const supabase = createAdminClient();

  if (!(await isApprovedMember(supabase, user.id, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { image_url } = await request.json();
  if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 });

  // sort_order = 現在の最大値 + 1
  const { data: existing } = await supabase
    .from('project_images')
    .select('sort_order')
    .eq('project_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (existing?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('project_images')
    .insert({ project_id: id, image_url, sort_order })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
