import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin, isAuthFailure } from '@/lib/authMiddleware';

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from('event-icons')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('event-icons').getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
