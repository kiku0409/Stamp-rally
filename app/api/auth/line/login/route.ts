import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE,
  authCookieOptions,
  buildAuthorizeUrl,
  randomToken,
  sanitizeReturnTo,
} from '@/lib/lineAuth';

// LINEログイン開始: state/nonce を発行してLINEの認可画面へリダイレクト。
// クライアントからは <a href> のフルページ遷移で呼ぶこと（fetch不可）。
export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const state = randomToken();
  const nonce = randomToken();

  const res = NextResponse.redirect(buildAuthorizeUrl(state, nonce));
  res.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, nonce, returnTo }),
    authCookieOptions(AUTH_COOKIE_MAX_AGE)
  );
  return res;
}
