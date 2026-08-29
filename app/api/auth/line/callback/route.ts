import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_MAX_AGE,
  LINE_AUTH_COOKIE,
  OAUTH_STATE_COOKIE,
  OAuthStatePayload,
  appUrl,
  authCookieOptions,
  encodeLineAuth,
  exchangeCodeForIdToken,
  sanitizeReturnTo,
  verifyIdToken,
} from '@/lib/lineAuth';

// LINE認可画面からのコールバック。state検証→トークン交換→id_token検証を行い、
// 認証結果(sub/name)を署名付き短命cookieに載せて完了ページへ渡す。
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  let saved: OAuthStatePayload | null = null;
  try {
    const raw = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    saved = raw ? (JSON.parse(raw) as OAuthStatePayload) : null;
  } catch {
    saved = null;
  }
  const returnTo = sanitizeReturnTo(saved?.returnTo);

  // 同意画面でキャンセルされた場合など（access_denied等）は元の画面へ戻す
  if (params.get('error')) {
    return redirectWithoutState(`${returnTo}?line_error=cancelled`);
  }

  const code = params.get('code');
  if (!saved || !code || params.get('state') !== saved.state) {
    return redirectWithoutState(`${returnTo}?line_error=failed`);
  }

  try {
    const idToken = await exchangeCodeForIdToken(code);
    const { sub, name } = await verifyIdToken(idToken, saved.nonce);

    const res = NextResponse.redirect(
      appUrl(`/auth/line/complete?returnTo=${encodeURIComponent(returnTo)}`)
    );
    res.cookies.set(
      LINE_AUTH_COOKIE,
      encodeLineAuth({ sub, name, exp: Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE }),
      authCookieOptions(AUTH_COOKIE_MAX_AGE)
    );
    res.cookies.set(OAUTH_STATE_COOKIE, '', authCookieOptions(0));
    return res;
  } catch {
    return redirectWithoutState(`${returnTo}?line_error=failed`);
  }
}

function redirectWithoutState(path: string) {
  const res = NextResponse.redirect(appUrl(path));
  res.cookies.set(OAUTH_STATE_COOKIE, '', authCookieOptions(0));
  return res;
}
