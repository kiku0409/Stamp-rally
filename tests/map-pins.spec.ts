/**
 * 会場マップのスタンプスポットピン E2E:
 *   - 未獲得ピン（青丸 + ラベル）と獲得済みピン（チェック）が表示される
 *   - ピンタップで詳細カード（未獲得=QR導線 / 獲得済み=獲得済み表示）が出る
 */
import { test, expect } from '@playwright/test';
import {
  adminSupabase, getAdminUserId, createProject, createEvent, createParticipant, createStamp,
  injectParticipant, waitForStampBookLoaded, cleanup, SeededProject, SeededParticipant,
} from './helpers';

// 1x1 透明 PNG（venue_map_url を truthy にするためのダミー画像）
const DUMMY_MAP =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const sb = adminSupabase();
let project: SeededProject;
let participant: SeededParticipant;
let acquiredTitle: string;
let unacquiredTitle: string;

test.beforeAll(async () => {
  const adminUid = await getAdminUserId(sb, process.env.TEST_ADMIN_EMAIL!);
  project = await createProject(sb, { createdBy: adminUid, status: 'approved', venueMapUrl: DUMMY_MAP });
  participant = await createParticipant(sb, {});

  acquiredTitle = `__playwright_test___pinA_${Date.now()}`;
  unacquiredTitle = `__playwright_test___pinB_${Date.now()}`;
  const evA = await createEvent(sb, project.id, { title: acquiredTitle, mapX: 30, mapY: 40, mapLabel: 'A' });
  await createEvent(sb, project.id, { title: unacquiredTitle, mapX: 70, mapY: 60, mapLabel: 'B' });
  await createStamp(sb, participant.id, evA.id); // A のみ獲得済み
});

test.afterAll(async () => {
  await cleanup(sb, { projectIds: [project?.id], participantIds: [participant?.id] });
});

test('マップに獲得済み/未獲得のピンが表示され、詳細カードが出る', async ({ page }) => {
  await injectParticipant(page, participant, project.id);
  await page.goto('/stamp-book');
  await waitForStampBookLoaded(page, participant.nickname);

  // 会場マップセクション（見出しは <p>）
  await expect(page.getByText('会場マップ', { exact: true })).toBeVisible({ timeout: 15_000 });

  const map = page.locator('div:has(> img[alt="会場マップ"])');
  // 未獲得ピン B（ラベルテキストあり）、獲得済みピン A（Check アイコン=svg、テキストなし）
  const unacquiredPin = map.getByRole('button', { name: 'B' });
  const acquiredPin = map.locator('button:has(svg)');
  await expect(unacquiredPin).toBeVisible();
  await expect(acquiredPin).toBeVisible();

  // 未獲得ピンをタップ → 詳細カードに QR 獲得導線
  await unacquiredPin.click();
  await expect(page.getByText(unacquiredTitle)).toBeVisible();
  await expect(page.getByRole('button', { name: 'QRを読み取ってスタンプを獲得' })).toBeVisible();

  // オーバーレイの余白をクリックして閉じる
  await page.locator('div.fixed.inset-0.z-50').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('button', { name: 'QRを読み取ってスタンプを獲得' })).toBeHidden();

  // 獲得済みピンをタップ → 「獲得済み ✓」（タイトルは最近のスタンプ一覧と重複するため詳細カード内に限定）
  await acquiredPin.click();
  const detail = page.locator('div.fixed.inset-0.z-50');
  await expect(detail.getByText(acquiredTitle)).toBeVisible();
  await expect(detail.getByText('獲得済み ✓')).toBeVisible();
});
