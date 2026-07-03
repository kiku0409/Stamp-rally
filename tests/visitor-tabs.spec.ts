/**
 * 来場者スタンプ帳ナビゲーション E2E:
 *   - ボトムナビ（ホーム / スタンプ / QR / チケット）
 *   - アクティブプロジェクト切り替え（複数プロジェクト参加時）
 *   - ヘッダーのユーザー名 → /profile
 *
 * 注: 「プロフィール」は独立タブではなくヘッダーのユーザー名リンクから開く。
 */
import { test, expect } from '@playwright/test';
import {
  adminSupabase, getAdminUserId, createProject, createEvent, createParticipant, createStamp,
  injectParticipant, waitForStampBookLoaded, cleanup, SeededProject, SeededParticipant,
} from './helpers';

const sb = adminSupabase();
let projectA: SeededProject;
let projectB: SeededProject;
let participant: SeededParticipant;

test.beforeAll(async () => {
  const adminUid = await getAdminUserId(sb, process.env.TEST_ADMIN_EMAIL!);
  projectA = await createProject(sb, { createdBy: adminUid, status: 'approved', name: `__playwright_test___A_${Date.now()}` });
  projectB = await createProject(sb, { createdBy: adminUid, status: 'approved', name: `__playwright_test___B_${Date.now()}` });
  participant = await createParticipant(sb, {});
  // 各プロジェクトに1つずつスタンプ → 2グループが stamp-book に出る
  const evA = await createEvent(sb, projectA.id, {});
  const evB = await createEvent(sb, projectB.id, {});
  await createStamp(sb, participant.id, evA.id);
  await createStamp(sb, participant.id, evB.id);
});

test.afterAll(async () => {
  await cleanup(sb, { projectIds: [projectA?.id, projectB?.id], participantIds: [participant?.id] });
});

test('ボトムナビ4スロットでタブ遷移できる', async ({ page }) => {
  await injectParticipant(page, participant, projectA.id);
  await page.goto('/stamp-book');
  await waitForStampBookLoaded(page, participant.nickname);

  // ナビ要素が存在
  await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'スタンプ' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'チケット' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'QRを読み取る' })).toBeVisible();

  // スタンプタブ
  await page.getByRole('link', { name: 'スタンプ' }).click();
  await expect(page).toHaveURL(/\/stamp-book\/stamps$/);

  // チケットタブ（ラベルはチケットだが見出しは引換券）
  await page.getByRole('link', { name: 'チケット' }).click();
  await expect(page).toHaveURL(/\/stamp-book\/rewards$/);
  await expect(page.getByRole('heading', { name: '引換券' })).toBeVisible();

  // ホームへ戻る
  await page.getByRole('link', { name: 'ホーム' }).click();
  await expect(page).toHaveURL(/\/stamp-book$/);
});

test('アクティブプロジェクトを切り替えられる', async ({ page }) => {
  await injectParticipant(page, participant, projectA.id);
  await page.goto('/stamp-book');
  await waitForStampBookLoaded(page, participant.nickname);

  // チップは現在のアクティブ = projectA を表示
  const chip = page.getByRole('button', { name: projectA.name });
  await expect(chip).toBeVisible();
  await chip.click();

  // 切り替えシート
  await expect(page.getByText('プロジェクトを切り替え')).toBeVisible();
  await page.getByRole('button', { name: new RegExp(projectB.name) }).click();

  // チップが projectB に変わる
  await expect(page.getByRole('button', { name: projectB.name })).toBeVisible({ timeout: 10_000 });
  const active = await page.evaluate(() => localStorage.getItem('stamp_rally_active_project'));
  expect(active).toBe(projectB.id);
});

test('ヘッダーのユーザー名から /profile に遷移する', async ({ page }) => {
  await injectParticipant(page, participant, projectA.id);
  await page.goto('/stamp-book');
  await waitForStampBookLoaded(page, participant.nickname);

  await page.getByText(`${participant.nickname} さん`).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'ユーザー情報' })).toBeVisible();
});
