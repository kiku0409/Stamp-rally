/**
 * プロフィール編集 E2E: /profile
 *   - 年齢が実年齢の数値入力（type=number）になっている
 *   - 編集 → 保存で表示値が更新される（数値は「N歳」表示）
 */
import { test, expect } from '@playwright/test';
import {
  adminSupabase, createParticipant, injectParticipant, cleanup, SeededParticipant,
} from './helpers';

const sb = adminSupabase();
let participant: SeededParticipant;

test.beforeAll(async () => {
  participant = await createParticipant(sb, { gender: null, age_group: null });
});

test.afterAll(async () => {
  await cleanup(sb, { participantIds: [participant?.id] });
});

test('年齢は数値入力で、編集→保存すると「N歳」表示に反映される', async ({ page }) => {
  await injectParticipant(page, participant);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'ユーザー情報' })).toBeVisible({ timeout: 15_000 });

  // 初期は未設定
  await expect(page.getByText('未設定').first()).toBeVisible();

  // ユーザー情報カード内の鉛筆ボタン（アクセシブル名なし）で編集開始
  const userCard = page.locator('.card-shadow', { hasText: 'ニックネーム' });
  await userCard.getByRole('button').first().click();

  // 年齢は type=number（spinbutton）で placeholder "例: 25"
  const ageInput = page.getByPlaceholder('例: 25');
  await expect(ageInput).toHaveAttribute('type', 'number');
  await ageInput.fill('30');

  // 性別も設定
  await page.getByRole('combobox').selectOption('男性');

  // 保存
  await page.getByRole('button', { name: '保存' }).click();

  // 表示モードに戻り、"30歳" と "男性" が出る
  await expect(page.getByText('30歳')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('男性')).toBeVisible();

  // DB にも保存されている
  await expect
    .poll(async () => {
      const { data } = await sb.from('participants').select('age_group, gender').eq('id', participant.id).single();
      return data?.age_group;
    }, { timeout: 10_000 })
    .toBe('30');
});
