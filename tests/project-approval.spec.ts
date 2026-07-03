/**
 * プロジェクト承認ワークフロー E2E: /admin/super（スーパー管理者のみ）
 *   - 承認待ちプロジェクトを「承認」→ status=approved
 *   - 承認待ちプロジェクトを「却下」（window.prompt で理由入力）→ status=rejected
 *
 * 前提: TEST_ADMIN（kikiki.4673@gmail.com）が super_admin であること。
 */
import { test, expect } from '@playwright/test';
import {
  adminSupabase, adminLogin, getSupabaseUserId, createProject, cleanup, SeededProject,
} from './helpers';

const sb = adminSupabase();
let approveTarget: SeededProject;
let rejectTarget: SeededProject;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await adminLogin(page);
  const uid = await getSupabaseUserId(page);
  await ctx.close();

  approveTarget = await createProject(sb, { createdBy: uid, status: 'pending', name: `__playwright_test___approve_${Date.now()}` });
  rejectTarget = await createProject(sb, { createdBy: uid, status: 'pending', name: `__playwright_test___reject_${Date.now()}` });
});

test.afterAll(async () => {
  await cleanup(sb, { projectIds: [approveTarget?.id, rejectTarget?.id] });
});

test('承認待ちプロジェクトを承認できる', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/super');
  await expect(page.getByRole('heading', { name: '承認・全体管理' })).toBeVisible({ timeout: 15_000 });

  // 対象カード（承認ボタンを持つ = 承認待ちカード）に絞る
  const card = page
    .locator('div.card-shadow')
    .filter({ hasText: approveTarget.name })
    .filter({ has: page.getByRole('button', { name: '承認' }) });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: '承認' }).click();

  await expect
    .poll(async () => {
      const { data } = await sb.from('projects').select('status').eq('id', approveTarget.id).single();
      return data?.status;
    }, { timeout: 15_000, message: 'status が approved になるはず' })
    .toBe('approved');
});

test('承認待ちプロジェクトを却下できる（理由入力あり）', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/super');
  await expect(page.getByRole('heading', { name: '承認・全体管理' })).toBeVisible({ timeout: 15_000 });

  // 却下は window.prompt で理由入力 → ダイアログを受理
  page.on('dialog', d => d.accept('テスト却下理由'));

  const card = page
    .locator('div.card-shadow')
    .filter({ hasText: rejectTarget.name })
    .filter({ has: page.getByRole('button', { name: '却下' }) });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: '却下' }).click();

  await expect
    .poll(async () => {
      const { data } = await sb.from('projects').select('status, reject_reason').eq('id', rejectTarget.id).single();
      return data?.status;
    }, { timeout: 15_000, message: 'status が rejected になるはず' })
    .toBe('rejected');
});
