/**
 * スタンプ取得フロー E2E: /event/[qr_token]/stamp
 *   - ログイン済み来場者 → 新規取得（スタンプ獲得）
 *   - 再訪 → 取得済み
 *   - 不正な qr_token → イベントが見つかりません
 *   - 未登録来場者 → 登録フォーム表示
 */
import { test, expect } from '@playwright/test';
import {
  adminSupabase, getAdminUserId, createProject, createEvent, createParticipant,
  injectParticipant, cleanup, SeededProject, SeededEvent, SeededParticipant,
} from './helpers';

const sb = adminSupabase();
let project: SeededProject;
let event: SeededEvent;
let participant: SeededParticipant;

test.beforeAll(async () => {
  const adminUid = await getAdminUserId(sb, process.env.TEST_ADMIN_EMAIL!);
  project = await createProject(sb, { createdBy: adminUid, status: 'approved' });
  event = await createEvent(sb, project.id, { title: `${'__playwright_test__'}_stamp` });
  participant = await createParticipant(sb, {});
});

test.afterAll(async () => {
  await cleanup(sb, { projectIds: [project?.id], participantIds: [participant?.id] });
});

test('ログイン済み来場者がQRを開く → スタンプ獲得、再訪で取得済み', async ({ page }) => {
  await injectParticipant(page, participant);

  // 初回取得
  await page.goto(`/event/${event.qr_token}/stamp`);
  await expect(page.getByRole('heading', { name: 'スタンプ獲得' })).toBeVisible({ timeout: 20_000 });

  // activeProjectId がセットされる
  const activeProjectId = await page.evaluate(() => localStorage.getItem('stamp_rally_active_project'));
  expect(activeProjectId).toBe(project.id);

  // 再訪 → 取得済み
  await page.goto(`/event/${event.qr_token}/stamp`);
  await expect(page.getByRole('heading', { name: '取得済みです' })).toBeVisible({ timeout: 20_000 });
});

test('不正な qr_token → イベントが見つかりません', async ({ page }) => {
  await injectParticipant(page, participant);
  await page.goto('/event/00000000-0000-0000-0000-000000000000/stamp');
  await expect(page.getByRole('heading', { name: 'イベントが見つかりません' })).toBeVisible({ timeout: 20_000 });
});

test('未登録来場者がQRを開く → 登録フォームが表示される', async ({ page }) => {
  // localStorage を注入しない = 未登録
  await page.goto(`/event/${event.qr_token}/stamp`);
  await expect(page.getByText('ニックネームを登録')).toBeVisible({ timeout: 20_000 });
  // 復元導線も出ている
  await expect(page.getByText('すでに登録済みの方はこちら')).toBeVisible();
});
