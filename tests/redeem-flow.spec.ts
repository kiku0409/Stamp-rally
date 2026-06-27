import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const MOCK_CODE = 'TESTCODE1234';

const mockReward = {
  nickname: 'テストユーザー',
  label: 'ドリンク1杯サービス',
  threshold: 3,
  project_name: 'テストプロジェクト',
  redeemed_at: null,
};
const mockRedeemed = { ...mockReward, redeemed_at: '2026-06-27T10:00:00.000Z' };

const fakeUser = {
  id: 'fake-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};
const fakeSession = {
  access_token: 'fake-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh',
  user: fakeUser,
};

async function setupRoutes(page: Page, returnRedeemed = false) {
  // Intercept ALL Supabase auth requests so AdminLayout doesn't redirect to login
  await page.route('**supabase**/auth/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeUser) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeSession) });
    }
  });

  // Reward lookup and redemption
  await page.route('**/api/rewards/redeem**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(returnRedeemed ? mockRedeemed : mockReward) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockRedeemed) });
    }
  });
}

test.describe('引き換え画面 2段階フロー - 10サイクルテスト', () => {
  test('10サイクル完走', async ({ page }) => {
    // Inject fake Supabase session into localStorage before page loads
    await page.addInitScript((session) => {
      // Override localStorage to return fake session for any sb-*-auth-token key
      const orig = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem')!;
      Object.defineProperty(Storage.prototype, 'getItem', {
        value: function (key: string) {
          if (typeof key === 'string' && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            return JSON.stringify(session);
          }
          return orig.value!.call(this, key);
        },
        writable: true,
        configurable: true,
      });
    }, fakeSession);

    await setupRoutes(page, false);
    await page.goto(`${BASE}/admin/redeem`);

    // Wait for page to load (either the scan form or the login page)
    await page.waitForURL((url) => !url.pathname.includes('loading'), { timeout: 10000 }).catch(() => {});

    // If redirected to login, something is wrong with auth mock — take screenshot and bail
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      await page.screenshot({ path: '/tmp/claude-0/-home-user-Stamp-rally/d3fd3329-354c-57c3-b5fa-64930b5d46f6/scratchpad/login-redirect.png' });
      throw new Error(`Redirected to login — auth mock failed. URL: ${currentUrl}`);
    }

    for (let cycle = 1; cycle <= 10; cycle++) {
      // ── SCAN ──────────────────────────────────────────────
      await expect(page.getByPlaceholder('引き換えコード')).toBeVisible({ timeout: 10000 });
      await page.getByPlaceholder('引き換えコード').fill(MOCK_CODE);
      await page.getByRole('button', { name: '照合' }).click();

      // ── PREVIEW（未引き換え） ──────────────────────────────
      await expect(page.getByText('テストユーザー')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('ドリンク1杯サービス')).toBeVisible();
      await expect(page.getByRole('button', { name: '引き換えする' })).toBeVisible();
      await expect(page.getByText('引き換えると取り消せません')).not.toBeVisible();

      // ── CONFIRM ────────────────────────────────────────────
      await page.getByRole('button', { name: '引き換えする' }).click();
      await expect(page.getByText('引き換えると取り消せません')).toBeVisible({ timeout: 3000 });
      await expect(page.getByRole('button', { name: '確定（引き換える）' })).toBeVisible();
      await expect(page.getByRole('button', { name: '戻る' })).toBeVisible();

      // ── 戻る → PREVIEW ────────────────────────────────────
      await page.getByRole('button', { name: '戻る' }).click();
      await expect(page.getByRole('button', { name: '引き換えする' })).toBeVisible({ timeout: 3000 });
      await expect(page.getByText('引き換えると取り消せません')).not.toBeVisible();

      // ── 再度 CONFIRM → 確定 ────────────────────────────────
      await page.getByRole('button', { name: '引き換えする' }).click();
      await expect(page.getByText('引き換えると取り消せません')).toBeVisible({ timeout: 3000 });
      await page.getByRole('button', { name: '確定（引き換える）' }).click();

      // ── DONE ───────────────────────────────────────────────
      await expect(page.getByText('引き換え完了！')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('ドリンク1杯サービス')).toBeVisible();
      await expect(page.getByText('テストユーザー さん')).toBeVisible();
      await expect(page.getByPlaceholder('引き換えコード')).not.toBeVisible();

      // ── 次の人をスキャン → SCAN ────────────────────────────
      await page.getByRole('button', { name: '次の人をスキャン' }).click();
      await expect(page.getByPlaceholder('引き換えコード')).toBeVisible({ timeout: 3000 });

      // ── 引き換え済みコードを再スキャン ─────────────────────
      await setupRoutes(page, true);
      await page.getByPlaceholder('引き換えコード').fill(MOCK_CODE);
      await page.getByRole('button', { name: '照合' }).click();
      await expect(page.getByText(/引き換え済み/)).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: '引き換えする' })).not.toBeVisible();

      // ── 次の人をスキャン（次サイクルへ） ──────────────────
      await page.getByRole('button', { name: '次の人をスキャン' }).click();
      await expect(page.getByPlaceholder('引き換えコード')).toBeVisible({ timeout: 3000 });
      await setupRoutes(page, false);

      console.log(`✅ Cycle ${cycle}/10 passed`);
    }
  });
});
