/**
 * E2E テスト共通ヘルパー
 *
 * 方針: すべてのテストデータは service role で直接シードし、判別可能な名前
 * （TEST_TAG を含む）を付け、afterAll / afterEach で必ずクリーンアップする。
 * 来場者側 UI は localStorage を addInitScript で注入して「ログイン済み」状態を作る。
 *
 * 必須 env（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 */
import { Page, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const TEST_TAG = '__playwright_test__';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 大文字英数のランダムコード（recovery_code / join_code / redeem_code 等に使う） */
export function genCode(len = 8): string {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

/** service role クライアント（RLS を回避してシード/クリーンアップする） */
export function adminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ─── 管理者ログイン ───────────────────────────────────────────────────────────

/** /admin/login からブラウザで実ログイン。成功で /admin に遷移するまで待つ。 */
export async function adminLogin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');

  await page.goto('/admin/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL('/admin', { timeout: 20_000 });
}

/** Supabase が localStorage に保存するセッションからログイン中ユーザーの UID を取得 */
export async function getSupabaseUserId(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const v = JSON.parse(localStorage.getItem(key) ?? '{}');
          return v?.user?.id ?? null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  if (!id) throw new Error('Could not find Supabase user ID in localStorage');
  return id as string;
}

/** service role の admin API から email で UID を引く（ブラウザログイン不要） */
export async function getAdminUserId(sb: SupabaseClient, email: string): Promise<string> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const u = data.users.find(x => (x.email ?? '').toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`admin user not found for email: ${email}`);
}

// ─── シードプリミティブ ─────────────────────────────────────────────────────────

export interface SeededProject {
  id: string;
  join_code: string;
  name: string;
}

/** プロジェクトを1件作成（既定: 承認済み）。created_by は NOT NULL なので実 UID 必須。 */
export async function createProject(
  sb: SupabaseClient,
  opts: {
    createdBy: string;
    name?: string;
    status?: 'pending' | 'approved' | 'rejected';
    venueMapUrl?: string;
    themeId?: string;
  },
): Promise<SeededProject> {
  const join_code = genCode();
  const name = opts.name ?? `${TEST_TAG}_proj_${genCode(4)}`;
  const { data, error } = await sb
    .from('projects')
    .insert({
      name,
      status: opts.status ?? 'approved',
      join_code,
      created_by: opts.createdBy,
      venue_map_url: opts.venueMapUrl ?? null,
      // 本番DBでは theme_id が NOT NULL（schema.sql は nullable と乖離）。既定テーマを入れる。
      theme_id: opts.themeId ?? 'teal',
    })
    .select('id, join_code, name')
    .single();
  if (error || !data) throw new Error(`createProject failed: ${error?.message}`);
  return { id: data.id as string, join_code: data.join_code as string, name: data.name as string };
}

/** 管理者をプロジェクトメンバーに追加（CSV 等の権限チェックを通すため） */
export async function addProjectMember(
  sb: SupabaseClient,
  projectId: string,
  userId: string,
  role: 'owner' | 'member' = 'owner',
): Promise<void> {
  const { error } = await sb
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role });
  if (error) throw new Error(`addProjectMember failed: ${error.message}`);
}

export interface SeededEvent {
  id: string;
  qr_token: string;
}

/** イベントを1件作成。map_x/map_y/map_label を渡すとマップピン対象になる。 */
export async function createEvent(
  sb: SupabaseClient,
  projectId: string,
  opts: {
    title?: string;
    venue?: string;
    eventDate?: string;
    mapX?: number;
    mapY?: number;
    mapLabel?: string;
  } = {},
): Promise<SeededEvent> {
  const { data, error } = await sb
    .from('events')
    .insert({
      title: opts.title ?? `${TEST_TAG}_event_${genCode(4)}`,
      venue: opts.venue ?? 'テスト会場',
      event_date: opts.eventDate ?? new Date().toISOString().slice(0, 10),
      project_id: projectId,
      map_x: opts.mapX ?? null,
      map_y: opts.mapY ?? null,
      map_label: opts.mapLabel ?? null,
    })
    .select('id, qr_token')
    .single();
  if (error || !data) throw new Error(`createEvent failed: ${error?.message}`);
  return { id: data.id as string, qr_token: data.qr_token as string };
}

export interface SeededParticipant {
  id: string;
  nickname: string;
  recovery_code: string;
  gender?: string;
  age?: number;        // 実年齢（整数）。新形式
  age_group?: string;  // [DEPRECATED] 旧形式の年齢文字列。表示フォールバック用
}

/** 来場者（匿名参加者）を1件作成。age_group が数値文字列なら age(INTEGER) にも同じ値を入れる。 */
export async function createParticipant(
  sb: SupabaseClient,
  opts: { nickname?: string; gender?: string | null; age?: number | null; age_group?: string | null } = {},
): Promise<SeededParticipant> {
  const nickname = opts.nickname ?? `${TEST_TAG}_user_${genCode(4)}`;
  const recovery_code = genCode();
  // age 未指定でも age_group が数値文字列なら age に反映（本番の書き込みパスと同じ二重書き込み）
  const age =
    opts.age ?? (opts.age_group && /^\d+$/.test(opts.age_group) ? parseInt(opts.age_group, 10) : null);
  const { data, error } = await sb
    .from('participants')
    .insert({
      nickname,
      recovery_code,
      gender: opts.gender ?? null,
      age,
      age_group: opts.age_group ?? (age != null ? String(age) : null),
    })
    .select('id, nickname, recovery_code, gender, age, age_group')
    .single();
  if (error || !data) throw new Error(`createParticipant failed: ${error?.message}`);
  return {
    id: data.id as string,
    nickname: data.nickname as string,
    recovery_code: data.recovery_code as string,
    gender: data.gender ?? undefined,
    age: data.age ?? undefined,
    age_group: data.age_group ?? undefined,
  };
}

/** スタンプ（event_stamps）を1件付与。 */
export async function createStamp(sb: SupabaseClient, participantId: string, eventId: string): Promise<void> {
  const { error } = await sb
    .from('event_stamps')
    .insert({ participant_id: participantId, event_id: eventId });
  if (error) throw new Error(`createStamp failed: ${error.message}`);
}

/** 特典段階（project_reward_tiers）を1件作成。 */
export async function createRewardTier(
  sb: SupabaseClient,
  projectId: string,
  threshold: number,
  label: string,
): Promise<string> {
  const { data, error } = await sb
    .from('project_reward_tiers')
    .insert({ project_id: projectId, threshold, label })
    .select('id')
    .single();
  if (error || !data) throw new Error(`createRewardTier failed: ${error?.message}`);
  return data.id as string;
}

// ─── クリーンアップ ─────────────────────────────────────────────────────────────

/**
 * シードしたデータを削除する。projects の削除は events / members / tiers 等へ
 * CASCADE するが、participants は独立しているので明示的に消す。
 */
export async function cleanup(
  sb: SupabaseClient,
  ids: { projectIds?: string[]; participantIds?: string[] },
): Promise<void> {
  for (const pid of ids.participantIds ?? []) {
    await sb.from('participants').delete().eq('id', pid);
  }
  for (const pid of ids.projectIds ?? []) {
    await sb.from('projects').delete().eq('id', pid);
  }
}

// ─── 来場者ログイン状態の注入 ───────────────────────────────────────────────────

/**
 * localStorage に参加者情報を注入して「ログイン済み来場者」を再現する。
 * page.goto より前に呼ぶこと（addInitScript は以後の全ナビゲーションで実行される）。
 */
export async function injectParticipant(
  page: Page,
  participant: SeededParticipant,
  activeProjectId?: string,
): Promise<void> {
  const local = {
    participant_id: participant.id,
    nickname: participant.nickname,
    recovery_code: participant.recovery_code,
    gender: participant.gender,
    age: participant.age,
    age_group: participant.age_group,
  };
  await page.addInitScript(
    ({ local, activeProjectId }) => {
      localStorage.setItem('stamp_rally_participant', JSON.stringify(local));
      if (activeProjectId) localStorage.setItem('stamp_rally_active_project', activeProjectId);
    },
    { local, activeProjectId },
  );
}

/** スタンプ帳ヘッダー（ニックネーム）が表示されるまで待つ = データ取得完了の目印 */
export async function waitForStampBookLoaded(page: Page, nickname: string): Promise<void> {
  await expect(page.getByText(`${nickname} さん`)).toBeVisible({ timeout: 15_000 });
}
