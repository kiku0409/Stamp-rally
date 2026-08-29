// LINEログイン(OAuth 2.0 認可コードフロー)のサーバー側ヘルパー。
// id_token の署名/exp/aud/nonce 検証は LINE の検証エンドポイントに委譲するため
// JWTライブラリは不要。client_secret を使う処理はすべてサーバー側のみ。
import { createHmac, timingSafeEqual } from 'node:crypto';

const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

// OAuthフロー中のみ使う短命cookie。パスを限定してフロー外に出さない
export const OAUTH_STATE_COOKIE = 'line_oauth';
export const LINE_AUTH_COOKIE = 'line_auth';
const AUTH_COOKIE_PATH = '/api/auth/line';
export const AUTH_COOKIE_MAX_AGE = 600; // 10分

export interface OAuthStatePayload {
  state: string;
  nonce: string;
  returnTo: string;
}

// LINE認証済みの証明としてcallback→completeへ渡す署名付きペイロード
export interface LineAuthPayload {
  sub: string; // LINE userId
  name?: string; // LINE表示名
  exp: number; // epoch秒
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数 ${name} が設定されていません`);
  return value;
}

export function appUrl(path: string): URL {
  return new URL(path, requiredEnv('APP_BASE_URL'));
}

function redirectUri(): string {
  return appUrl('/api/auth/line/callback').toString();
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // strict だとLINEからの戻り(クロスサイト遷移)でcookieが送られずstate検証が壊れる
    sameSite: 'lax' as const,
    path: AUTH_COOKIE_PATH,
    maxAge,
  };
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// オープンリダイレクト防止: アプリ内の相対パスのみ許可
export function sanitizeReturnTo(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/stamp-book';
}

export function buildAuthorizeUrl(state: string, nonce: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: requiredEnv('LINE_LOGIN_CHANNEL_ID'),
    redirect_uri: redirectUri(),
    state,
    nonce,
    scope: 'openid profile',
    // bot_prompt: 'normal', // 同意画面に公式アカウントの友だち追加を出す場合に有効化
    //                        // (LINE Developersでチャネルと公式アカウントのリンク設定が必要)
  });
  return `${LINE_AUTHORIZE_URL}?${params}`;
}

export async function exchangeCodeForIdToken(code: string): Promise<string> {
  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: requiredEnv('LINE_LOGIN_CHANNEL_ID'),
      client_secret: requiredEnv('LINE_LOGIN_CHANNEL_SECRET'),
    }),
  });
  if (!res.ok) throw new Error(`LINEトークン交換に失敗しました (${res.status})`);
  const data = await res.json();
  if (typeof data.id_token !== 'string') throw new Error('LINEトークン応答にid_tokenがありません');
  return data.id_token;
}

export async function verifyIdToken(idToken: string, nonce: string): Promise<{ sub: string; name?: string }> {
  const res = await fetch(LINE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: requiredEnv('LINE_LOGIN_CHANNEL_ID'),
      nonce,
    }),
  });
  if (!res.ok) throw new Error(`LINE IDトークン検証に失敗しました (${res.status})`);
  const data = await res.json();
  if (typeof data.sub !== 'string') throw new Error('LINE IDトークンにsubがありません');
  return { sub: data.sub, name: typeof data.name === 'string' ? data.name : undefined };
}

function hmac(data: string): Buffer {
  return createHmac('sha256', requiredEnv('LINE_LOGIN_CHANNEL_SECRET')).update(data).digest();
}

export function encodeLineAuth(payload: LineAuthPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${hmac(body).toString('base64url')}`;
}

export function decodeLineAuth(value: string | undefined): LineAuthPayload | null {
  if (!value) return null;
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  try {
    const expected = hmac(body);
    const actual = Buffer.from(sig, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as LineAuthPayload;
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
