import { NextResponse } from 'next/server';
import { requireAdmin, isAuthFailure } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (isAuthFailure(auth)) return auth;
  return NextResponse.json({ ok: true });
}
