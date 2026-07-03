/**
 * スタンプ取得者 CSV 書き出し E2E: /admin/projects/[id] の「スタンプCSV」ボタン
 *   - ヘッダ: イベント,ニックネーム,性別,年齢,取得日時
 *   - 性別/年齢が未入力の参加者は「未設定」で出力される
 *   - UTF-8 BOM 付き
 *
 * CSV 整形はクライアント側（app/admin/projects/[id]/page.tsx）で行われるため、
 * ネットワーク応答ではなくブラウザのダウンロードを捕捉して検証する。
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import {
  adminSupabase, adminLogin, getSupabaseUserId, createProject, addProjectMember,
  createEvent, createParticipant, createStamp, cleanup, SeededProject, SeededParticipant,
} from './helpers';

const sb = adminSupabase();
let project: SeededProject;
let withInfo: SeededParticipant;   // 性別・年齢あり
let noInfo: SeededParticipant;     // 性別・年齢なし（未設定になる）

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await adminLogin(page);
  const uid = await getSupabaseUserId(page);
  await ctx.close();

  project = await createProject(sb, { createdBy: uid, status: 'approved' });
  await addProjectMember(sb, project.id, uid, 'owner');
  const event = await createEvent(sb, project.id, { title: `__playwright_test___csv_${Date.now()}` });

  withInfo = await createParticipant(sb, { gender: '男性', age_group: '25' });
  noInfo = await createParticipant(sb, { gender: null, age_group: null });
  await createStamp(sb, withInfo.id, event.id);
  await createStamp(sb, noInfo.id, event.id);
});

test.afterAll(async () => {
  await cleanup(sb, { projectIds: [project?.id], participantIds: [withInfo?.id, noInfo?.id] });
});

test('スタンプCSVをダウンロードでき、性別/年齢と未設定フォールバックが含まれる', async ({ page }) => {
  await adminLogin(page);
  await page.goto(`/admin/projects/${project.id}`);

  const csvButton = page.getByRole('button', { name: 'スタンプCSV' });
  await expect(csvButton).toBeVisible({ timeout: 20_000 });

  const downloadPromise = page.waitForEvent('download');
  await csvButton.click();
  const download = await downloadPromise;

  // ファイル名は「スタンプ取得者_」始まり
  expect(download.suggestedFilename()).toMatch(/^スタンプ取得者_.*\.csv$/);

  const filePath = await download.path();
  const buf = await readFile(filePath);
  const text = buf.toString('utf8');

  // UTF-8 BOM 付き
  expect(text.charCodeAt(0)).toBe(0xfeff);

  // ヘッダ
  expect(text).toContain('イベント,ニックネーム,性別,年齢,取得日時');

  // 性別・年齢ありの行
  expect(text).toContain(`,${withInfo.nickname},男性,25,`);

  // 未入力 → 未設定,未設定
  expect(text).toContain(`,${noInfo.nickname},未設定,未設定,`);
});
