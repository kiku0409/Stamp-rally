# 引き継ぎメモ（HANDOFF）

- 更新日時: 2026-07-01 JST
- ブランチ: `main`（全変更コミット済み・本番デプロイ済み）
- 最新コミット: `4ec8b21 feat: 会場マップ上にスタンプスポットピンを表示する機能を実装`

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

### 直近セッション（2026-07-01）で実装・完了したもの

#### A. バグ修正：ボタン文言統一（コミット: `07796e2` に含む）

`app/admin/projects/[id]/page.tsx` のタイムテーブル・会場マップセクションのアップロードボタン文言を統一:
- 「画像をアップロード」→「写真を追加」（カルーセル写真と統一）
- 「差し替え」はそのまま維持

#### B. マップピン機能（コミット: `4ec8b21`）

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

1. **マップピン機能の動作未確認**: 実装・デプロイ済みだが、実際にオーナーがピンを設定して来場者画面で確認するテストをまだ行っていない。次セッション冒頭で動作確認を推奨。
2. **全機能のブラウザ検証が未完**: バグ確認のためブラウザ自動化テストを試みたが、拡張機能が正しいChromeに接続できず中断。コードレビューエージェントもセッション上限で未完了。
3. **スタンプ取得ロード時間**: 0.5秒以上かかる場合あり。Vercelコールドスタートが主因。
4. **age_group カラムに数値文字列**: DBの `age_group TEXT` に "25" のような値が入る。将来 `age INTEGER` へ移行検討。
5. **本格的レート制限なし**: 将来 Vercel KV / Upstash 導入を検討。

---

## 4. 次にやること（優先順）

1. **マップピン機能の動作確認** — オーナー画面でイベントを編集し会場マップをクリックしてピン位置を設定 → 来場者画面で確認
2. **全機能のブラウザ検証** — kikiki.4673@gmail.com のChromeで拡張機能を接続して実施（前回は別アカウントのChromeに繋いでしまった）
3. **README更新** — マップピン機能・ボタン文言修正など直近の変更をREADMEに反映
4. `age_group` → `age INTEGER` マイグレーション
4. 本格的レート制限（KV導入）
5. ランキング、SNSシェア等の体験系機能
6. 引き換え統計ダッシュボード ← 最低優先度
7. 取得者/スタンプ一覧のフィルタ・ページング ← 最低優先度

---

## 5. 開発・デプロイの作法

- **ブランチ**: `main` は本番。feature ブランチ → `main` ff マージ → push で自動デプロイ。
- **プランモード**: 変更前に必ずプランモードでユーザーに確認してから実装すること。
- **DB変更順序**: Supabase SQL Editor でマイグレーション実行 → その後 `main` マージ（逆順だと一時的に壊れる）。
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
