/**
 * 管理者引き換えフロー E2E テスト（10サイクル）
 *
 * 必須 env（.env.local に追記）:
 *   TEST_ADMIN_EMAIL=...
 *   TEST_ADMIN_PASSWORD=...
 *
 * テストデータは beforeAll でブラウザログイン→userID取得→service role でシードし、
 * afterAll でクリーンアップする。
 */

import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fix the import - chromium is not needed from playwright directly
const CYCLES = 10;

// ─── Supabase seed helper ───────────────────────────────────────────────────

function adminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface SeedResult {
  codes: string[];
  participantIds: string[];
  projectId: string;
  tierId: string;
}

async function seedCodes(count: number, adminUserId: string): Promise<SeedResult> {
  const sb = adminSupabase();
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const genCode = () =>
    Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

  // 1. Create a temporary test project (approved)
  const { data: project, error: projErr } = await sb
    .from('projects')
    .insert({ name: '__playwright_test__', status: 'approved', created_by: adminUserId })
    .select('id')
    .single();
  if (projErr || !project) throw new Error(`Failed to create project: ${projErr?.message}`);

  // 2. Add admin as project member so the API auth check passes
  await sb
    .from('project_members')
    .insert({ project_id: project.id, user_id: adminUserId, role: 'owner' });

  // 3. Create a reward tier (threshold=1)
  const { data: tier, error: tierErr } = await sb
    .from('project_reward_tiers')
    .insert({ project_id: project.id, threshold: 1, label: 'テスト特典' })
    .select('id')
    .single();
  if (tierErr || !tier) throw new Error(`Failed to create tier: ${tierErr?.message}`);

  // 4. Create one participant per cycle (unique constraint: participant_id + tier_id)
  const participantIds: string[] = [];
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const { data: p, error: pErr } = await sb
      .from('participants')
      .insert({ nickname: `__playwright_${i}__`, recovery_code: genCode() })
      .select('id')
      .single();
    if (pErr || !p) throw new Error(`Failed to create participant ${i}: ${pErr?.message}`);

    const redeemCode = genCode();
    const { error: rErr } = await sb
      .from('participant_rewards')
      .insert({ participant_id: p.id, tier_id: tier.id, project_id: project.id, redeem_code: redeemCode, redeemed_at: null });
    if (rErr) throw new Error(`Failed to insert reward ${i}: ${rErr.message}`);

    participantIds.push(p.id);
    codes.push(redeemCode);
  }

  return { codes, participantIds, projectId: project.id, tierId: tier.id };
}

async function cleanupSeed(seed: SeedResult) {
  const sb = adminSupabase();
  for (const pid of seed.participantIds) {
    await sb.from('participant_rewards').delete().eq('participant_id', pid);
    await sb.from('participants').delete().eq('id', pid);
  }
  await sb.from('project_reward_tiers').delete().eq('id', seed.tierId);
  await sb.from('project_members').delete().eq('project_id', seed.projectId);
  await sb.from('projects').delete().eq('id', seed.projectId);
}

// ─── Login helper ───────────────────────────────────────────────────────────

async function adminLogin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');

  await page.goto('/admin/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 15_000 });
}

/** Supabase が localStorage に保存するセッションキーからユーザーIDを取得 */
async function getSupabaseUserId(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const v = JSON.parse(localStorage.getItem(key) ?? '{}');
          return v?.user?.id ?? null;
        } catch { return null; }
      }
    }
    return null;
  });
  if (!id) throw new Error('Could not find Supabase user ID in localStorage');
  return id as string;
}

// ─── Test ───────────────────────────────────────────────────────────────────

let codes: string[] = [];
let seedResult: SeedResult | null = null;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000);
  // ブラウザでログイン → userID取得 → シード
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await adminLogin(page);
  const adminUserId = await getSupabaseUserId(page);
  await ctx.close();

  seedResult = await seedCodes(CYCLES, adminUserId);
  codes = seedResult.codes;
});

test.afterAll(async () => {
  if (seedResult) await cleanupSeed(seedResult);
});

test('redeem flow — 10 cycles (state machine + error recovery)', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/redeem');

  for (let i = 0; i < CYCLES; i++) {
    const code = codes[i];

    // ── Step 1: scan 画面が表示されている ────────────────────────────────
    await expect(page.getByText('特典の引き換え')).toBeVisible();
    await expect(page.getByPlaceholder('引き換えコード')).toBeVisible();

    // ── Step 2: コード入力 → 照合 ─────────────────────────────────────
    await page.fill('input[placeholder="引き換えコード"]', code);
    await page.click('button:has-text("照合")');

    // ── Step 3: preview 画面（未引き換え）────────────────────────────────
    await expect(page.getByText('引き換えする')).toBeVisible({ timeout: 8_000 });

    // ── Step 4: 「引き換えする」→ confirm 画面 ────────────────────────
    await page.click('button:has-text("引き換えする")');
    await expect(page.getByText('引き換えると取り消せません')).toBeVisible();

    // ── Step 5: 「戻る」→ preview に戻る（誤操作復帰） ──────────────
    await page.click('button:has-text("戻る")');
    await expect(page.getByText('引き換えする')).toBeVisible();

    // ── Step 6: 再度 confirm へ ───────────────────────────────────────
    await page.click('button:has-text("引き換えする")');
    await expect(page.getByText('引き換えると取り消せません')).toBeVisible();

    // ── Step 7: 「確定（引き換える）」→ done 画面 ────────────────────
    await page.click('button:has-text("確定（引き換える）")');
    await expect(page.getByText('引き換え完了！')).toBeVisible({ timeout: 8_000 });

    // ── Step 8: 「次の人をスキャン」→ scan 画面リセット ──────────────
    await page.locator('button:has-text("次の人をスキャン")').first().click();
    await expect(page.getByPlaceholder('引き換えコード')).toBeVisible();
    await expect(page.getByPlaceholder('引き換えコード')).toHaveValue('');

    // ── Step 9: 同一コード再入力 → 引き換え済みバナー ────────────────
    await page.fill('input[placeholder="引き換えコード"]', code);
    await page.click('button:has-text("照合")');
    await expect(page.getByText('引き換え済み（')).toBeVisible({ timeout: 8_000 });

    // ── Step 10: 「次の人をスキャン」で次のサイクルへ ─────────────────
    await page.locator('button:has-text("次の人をスキャン")').first().click();
    await expect(page.getByPlaceholder('引き換えコード')).toBeVisible();

    console.log(`✓ cycle ${i + 1}/${CYCLES} (code: ${code})`);
  }
});
