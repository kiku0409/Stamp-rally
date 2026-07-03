/**
 * 管理者認証 E2E: /admin/login のログイン成功・失敗、/admin/signup のサインアップ。
 *
 * signup は実 auth ユーザーを作るため、afterAll で service role の admin API から削除する。
 */
import { test, expect } from '@playwright/test';
import { adminSupabase, adminLogin, getSupabaseUserId, genCode } from './helpers';

test.describe('管理者認証', () => {
  test('ログイン成功 → /admin に遷移し、セッションが保存される', async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin$/);
    // Supabase セッションが localStorage に入っている
    const uid = await getSupabaseUserId(page);
    expect(uid).toMatch(/[0-9a-f-]{36}/);
  });

  test('誤ったパスワードでログイン失敗 → エラーメッセージ表示、遷移しない', async ({ page }) => {
    const email = process.env.TEST_ADMIN_EMAIL!;
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'wrong-password-xxxxx');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(
      page.getByText('メールアドレスまたはパスワードが正しくありません'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('サインアップ → 新規 auth ユーザーが作られる', async ({ page }) => {
    const sb = adminSupabase();
    const email = `pw-test-${genCode(6).toLowerCase()}@example.com`;
    const password = `Pw${genCode(8)}!`;
    let createdUid: string | null = null;

    try {
      await page.goto('/admin/signup');
      await page.getByPlaceholder('メールアドレス').fill(email);
      await page.getByPlaceholder('パスワード（6文字以上）').fill(password);
      await page.getByRole('button', { name: 'アカウントを作成' }).click();

      // メール確認設定により「/admin へ遷移」または「確認メール案内」のどちらか。
      // どちらでも、auth ユーザーがサーバに作られていることを service role で確認する。
      await expect
        .poll(
          async () => {
            const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
            const u = data.users.find(x => (x.email ?? '').toLowerCase() === email.toLowerCase());
            createdUid = u?.id ?? null;
            return createdUid;
          },
          { timeout: 15_000, message: 'signup したユーザーが auth に現れるはず' },
        )
        .not.toBeNull();
    } finally {
      if (createdUid) await sb.auth.admin.deleteUser(createdUid);
    }
  });
});
