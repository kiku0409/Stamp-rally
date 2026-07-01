# 引き継ぎメモ（HANDOFF）

- 更新日時: 2026-07-01 JST
- ブランチ: `main`（全変更コミット済み・本番デプロイ済み）
- 最新コミット: `cceb79f docs: マップピン機能・性別年齢CSVをREADME/オーナー向け資料に反映`

次のセッションがこれだけ読めば再開できるようにまとめた運用・状態メモ。

---

## 1. 基本情報

| 項目 | 値 |
|------|-----|
| 本番URL | https://stamp-rally-kappa.vercel.app |
| 管理画面 | `/admin/login`（新規登録 `/admin/signup`） |
| リポジトリ | github.com/kiku0409/Stamp-rally（`main`） |
| 作業ディレクトリ | /Users/kiku/dev/projects/Stamp-rally |
| デプロイ | Vercel（`main` への push で自動デプロイ） |
| スーパー管理者 | `kikiki.4673@gmail.com`（UID: `dee565bd-ba21-44a3-bd54-7aa1745b0600`） |

### 技術スタック
- Next.js 16.2.9（App Router / Turbopack）、Tailwind CSS v4、TypeScript
- Supabase（DB ＋ Auth ＋ Storage）、Vercel
- lucide-react、`@zxing/browser`（QRスキャン）、`qrcode`（QR生成）
- フォント: Zen Kaku Gothic New ＋ Roboto Mono

---

## 2. 現在の実装状況（全て `main` にコミット済み・本番反映済み）

### 直近セッション（2026-07-01 その2）で実施したこと

- **マップピン機能のE2E動作確認 完了**（本番環境で実施）
  - テスト用プロジェクト `__playwright_test__` で会場マップ画像アップロード → イベント作成時にマップクリックでピン座標(X%,Y%)を設定 → 保存/再読み込み後も正確に保持されることを確認
  - 来場者ホーム画面で獲得済み（チェックマーク）・未獲得（青丸+ラベル）の両方のピン表示、タップ時の詳細カード（獲得案内/QRスキャン導線）を確認 → **問題なし**
  - テストデータ（イベント2件・アップロード画像）は検証後に削除済み
- **README・docs/slide-content.md をマップピン機能・性別年齢CSVに合わせて更新**（コミット `cceb79f`）
- **schema.sql が実DBと乖離していた問題を修正**: `theme_id` / `venue_map_url` / `timetable_url` / `project_images` テーブル / `events.map_*` / `slots` / `slot_schedules` が схема.sql に未反映だった（venue_map_url 抜けが本セッション冒頭のバグの直接原因）。今後 fresh セットアップしても同じ事故が起きないよう追記済み
- **運用ルール確定**: 新機能を追加した際は毎回 README・docs/slide-content.md を実装内容に合わせて更新すること（ユーザーからの明示的な指示）

### 直近セッション（2026-07-01 その1）で実装・完了したもの

#### A. バグ修正・機能追加（コミット: `85fe0b9`, `d70bcfa`, `809fa15`）

- **スタンプCSVに性別・年齢列を追加**（`app/api/projects/[id]/stamps/route.ts`）
  - 未入力の場合は「未設定」と表示
- **会場マップ画像が保存されない不具合を修正**（`app/admin/projects/[id]/page.tsx`）
  - `projects.venue_map_url` カラムが本番DBに存在しなかったためマイグレーション追加: `supabase/migrations/2026-07-01_venue_map_url.sql`（本番適用済み）
  - 画像保存時のエラーを検知して画面に表示するよう改善
- **プロフィール編集画面の年代選択を実年齢の数値入力に変更**（`app/profile/page.tsx`）
  - 新規登録フォームと統一（既存の旧形式データはフォールバック表示）

#### B. バグ修正：ボタン文言統一（コミット: `07796e2` に含む）

`app/admin/projects/[id]/page.tsx` のタイムテーブル・会場マップセクションのアップロードボタン文言を統一:
- 「画像をアップロード」→「写真を追加」（カルーセル写真と統一）
- 「差し替え」はそのまま維持

#### C. マップピン機能（コミット: `4ec8b21`）

**概要**: 会場マップ画像の上にスタンプスポットのピンを表示し、取得状況を可視化する機能。

**DBマイグレーション**: `supabase/migrations/2026-07-01_map_pins.sql`（本番適用済み）
```sql
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS map_x     NUMERIC,  -- マップ上X座標（0〜100%）
  ADD COLUMN IF NOT EXISTS map_y     NUMERIC,  -- マップ上Y座標（0〜100%）
  ADD COLUMN IF NOT EXISTS map_label TEXT,     -- ピンラベル（A/B/C等）
  ADD COLUMN IF NOT EXISTS map_color TEXT;     -- 将来の色分け用（現在未使用）
```

**来場者ホーム画面** (`app/stamp-book/page.tsx`):
- マップ画像の上に絶対配置でピンボタンを重ねて表示
- 未獲得スポット: 青丸 + A/B/C ラベル
- 獲得済みスポット: テーマカラー丸 + チェックマーク + 白リング
- ピンをタップ → 下から詳細カードが出現（未獲得はQRスキャンボタン付き）
- `map_x` / `map_y` が未設定のイベントはピン非表示

**オーナー管理画面** (`app/admin/events/[id]/page.tsx`, `app/admin/events/new/page.tsx`):
- プロジェクトの `venue_map_url` を表示（編集画面は project_id 経由で取得）
- マップ画像をクリック → X%/Y% 座標を自動計算して入力欄に反映
- ピンのリアルタイムプレビュー（マップ上に青丸）
- ラベル入力欄（1〜3文字）
- ピン位置のクリアボタン

**API更新**:
- `/api/stamp-book` (GET): 参加プロジェクトの全イベントを `events: Event[]` として返す（スタンプ未取得のスポットも含む）
- `/api/events` (POST): `map_x`, `map_y`, `map_label`, `map_color` を受け付けるよう拡張
- `/api/events/[id]` (PUT): 同上

**型定義更新** (`types/index.ts`):
- `Event` に `map_x`, `map_y`, `map_label`, `map_color` を追加
- `StampBookGroup` に `events?: Event[]` を追加

### 以前のセッションで実装済みの主要機能

- 来場者スタンプ帳4タブ（ホーム・スタンプ・引換券・プロフィール）
- プロジェクト別テーマカラー全体切り替え（street-live ダークテーマ含む）
- QRスキャン後に当該プロジェクトが自動でアクティブ化
- ヘッダーにプロジェクト切り替えチップ（▼）＋ボトムシート
- フォトカルーセル・タイムテーブル・会場マップ（管理画面でアップロード）
- 動的QRコード（タイムスロット型）: `slots` / `slot_schedules` テーブル
- 特典（`project_reward_tiers`）、引換フロー（2段階確認）、CSV書き出し
- 復元コードによる別端末引き継ぎ
- イベントアイコン画像
- 管理者招待（メール招待・参加コード）
- プロジェクト承認ワークフロー（セルフ登録→承認待ち→承認）

---

## 3. 未解決の問題

1. **全機能のブラウザ検証が未完**: マップピン機能はE2E確認済みだが、それ以外の全機能を横断したブラウザ自動化テストはまだ実施していない。
2. **スタンプ取得ロード時間**: 0.5秒以上かかる場合あり。Vercelコールドスタートが主因。
3. **age_group カラムに数値文字列**: DBの `age_group TEXT` に "25" のような値が入る。将来 `age INTEGER` へ移行検討。
4. **本格的レート制限なし**: 将来 Vercel KV / Upstash 導入を検討。
5. **schema.sql と実DBの乖離に注意**: `project_images` / `theme_id` / `venue_map_url` 等、過去に Supabase ダッシュボードで直接スキーマ変更し、マイグレーションファイルとして残さなかったものが複数あった（本セッションで schema.sql に追記して解消）。今後カラム追加する際は必ずマイグレーションファイルを作成し、schema.sql にも反映すること。

---

## 4. 次にやること（優先順）

1. **全機能のブラウザ検証** — kikiki.4673@gmail.com のChromeで拡張機能を接続して実施
2. `age_group` → `age INTEGER` マイグレーション
3. 本格的レート制限（KV導入）
4. ランキング、SNSシェア等の体験系機能
5. 引き換え統計ダッシュボード ← 最低優先度
6. 取得者/スタンプ一覧のフィルタ・ページング ← 最低優先度

> **運用ルール**: 新機能を追加した際は、README.md と docs/slide-content.md を実装内容に合わせて必ず更新すること。

---

## 5. 開発・デプロイの作法

- **ブランチ**: `main` は本番。feature ブランチ → `main` ff マージ → push で自動デプロイ。
- **プランモード**: 変更前に必ずプランモードでユーザーに確認してから実装すること。
- **DB変更順序**: Supabase SQL Editor でマイグレーション実行 → その後 `main` マージ（逆順だと一時的に壊れる）。
- **DB変更は必ず `supabase/migrations/` にファイルを残し、`supabase/schema.sql` にも反映する**。ダッシュボードで直接カラム追加すると記録が残らず、今回のように「コード上は参照されているがDBに存在しない」バグの原因になる（`venue_map_url` 抜けの実例あり）。
- **新機能追加時は README.md / docs/slide-content.md も忘れず更新する**（ユーザー指定の運用ルール）。
- **来場者匿名識別**: `lib/storage.ts`（localStorage）。`activeProjectId` / `activeThemeId` も同ファイル。
- **権限ヘルパー**: `lib/authMiddleware.ts`（`requireAdmin`/`isSuperAdmin`/`getProjectRole` 等）。
- **ブラウザ検証**: kikiki.4673@gmail.com のChromeに Claude 拡張機能をインストール・ログインして接続する必要あり。

---

## 6. 主要ファイルの地図

**来場者**
- `app/stamp-book/layout.tsx` — 共通ヘッダー・QRスキャナー・モーダル群・CSSテーマ変数注入
- `app/stamp-book/StampBookContext.tsx` — データ共有・activeProjectId管理・themeId localStorage連携
- `app/stamp-book/page.tsx` — ホーム（カルーセル・進捗・タイムテーブル・マップ＋ピン）
- `app/stamp-book/stamps/page.tsx` — スタンプ一覧（アクティブPJのみ）
- `app/stamp-book/rewards/page.tsx` — 引換券一覧（アクティブPJのみ）
- `app/profile/page.tsx` — テーマカラー対応ヘッダー
- `app/event/[qr_token]/stamp/page.tsx` — スタンプ取得（activeProjectId 自動セット）
- `components/BottomNav.tsx`, `components/StampCard.tsx`, `components/RewardTicketModal.tsx`

**管理**
- `app/admin/projects/[id]/page.tsx` — テーマ選択・画像管理（カルーセル写真・タイムテーブル・マップ）
- `app/admin/events/[id]/page.tsx` — イベント編集（マップピン設定・クリック座標取得含む）
- `app/admin/events/new/page.tsx` — イベント新規作成（同上）
- `app/admin/redeem/page.tsx` — 特典引き換え（2段階確認）
- `app/admin/super/page.tsx` — 全プロジェクト承認管理

**API**
- `app/api/stamp-book/route.ts` — スタンプ帳データ一括取得（全イベントも events[] で返す）
- `app/api/events/route.ts` — イベント作成（map_* 対応済み）
- `app/api/events/[id]/route.ts` — イベント編集・削除（map_* 対応済み）
- `app/api/projects/[id]/images/` — カルーセル写真 CRUD
- `app/api/projects/upload-image/route.ts` — Storage アップロード
- `app/api/slots/` / `app/slot/[token]/` — 動的QRコード

**共通ライブラリ**
- `lib/themes.ts` — Theme インターフェース（cardBg/ink/muted/line 追加済み）・全テーマ定義
- `lib/storage.ts` — localStorage ヘルパー（activeProjectId・activeThemeId）
- `types/index.ts` — `Event`（map_* 追加済み）・`StampBookGroup`（events[] 追加済み）
