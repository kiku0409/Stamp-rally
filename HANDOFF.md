# 引き継ぎメモ（HANDOFF）

- 更新日時: 2026-06-29 JST
- ブランチ: `main`（全変更コミット済み・本番デプロイ済み）
- 最新コミット: `c84ade4 feat: ダークテーマ対応カード + スタンプ/特典タブをアクティブPJのみ表示`

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

### 直近セッション（2026-06-29）で実装・完了したもの

#### A. ホーム画面UI刷新（コミット: `b2084a1`）

- **フォトカルーセル**: `project_images` テーブルから画像を取得し横スクロール表示（CSS scroll-snap、ドットインジケーター付き、無制限）
- **タイムテーブルセクション**: `projects.timetable_url` がある場合のみ表示（Clockアイコン付き）
- **会場マップセクション**: `projects.venue_map_url` がある場合のみ表示（MapPinアイコン付き）
- **プロジェクト1件のみ表示**: `activeProjectId` に一致するグループだけ `ProjectView` で描画
- **プロフィールページのテーマカラー**: `getActiveThemeId()` → `getTheme()` でヘッダーをアクティブプロジェクトのテーマで表示（StampBookProvider 外なので localStorage 経由）

#### B. 管理画面に画像管理UI追加（コミット: `b2084a1`）

`app/admin/projects/[id]/page.tsx` に3つの画像セクション追加:
- カルーセル写真: アップロード・削除・並び替え（↑↓ボタン）
- タイムテーブル画像: アップロード・差し替え・削除
- 会場マップ画像: アップロード・差し替え・削除

新設API:
- `app/api/projects/upload-image/route.ts`: multipart → Supabase Storage（`event-icons` バケット）
- `app/api/projects/[id]/images/route.ts`: GET（一覧）/ POST（追加）
- `app/api/projects/[id]/images/[imageId]/route.ts`: DELETE / PUT（sort_order更新）
- `app/api/projects/[id]/route.ts` PUT: `venue_map_url` / `timetable_url` を受け付けるよう拡張

#### C. 致命的バグ修正（コミット: `7754984`）

`app/api/stamp-book/route.ts` の SELECT を:
```
// 修正前（timetable_urlカラムがない環境でHTTP 500）
.select('*, event:events(*, project:projects(id, name, theme_id, venue_map_url, timetable_url))')
// 修正後（カラム追加に依存しない）
.select('*, event:events(*, project:projects(*))')
```
これにより、本番でスタンプが全消えに見える症状を解消。

#### D. ダークテーマ対応カード（コミット: `c84ade4`）

`lib/themes.ts` の `Theme` インターフェースに `cardBg?`, `ink?`, `muted?`, `line?` を追加。
`street-live` テーマ: `cardBg: '#1c1c1c'`, `ink: '#e8e8e8'`, `muted: '#9a9a9a'`, `line: '#2f2f2f'`

`app/stamp-book/layout.tsx` がこれらを `--color-card-bg/ink/muted/line` としてCSSカスタムプロパティで注入 → 全子要素の `text-ink`, `text-muted`, `border-line` が自動でテーマ対応。

カード背景は `style={{ background: 'var(--color-card-bg, white)' }}` で指定（light テーマはwhiteフォールバック）。対象: `MiniStampRow`・stamps `ProjectSection`・rewards セクション。

#### E. スタンプ/特典タブのアクティブPJのみ表示（コミット: `c84ade4`）

- `app/stamp-book/stamps/page.tsx`: `activeProjectId` で group をフィルタして1件のみ描画
- `app/stamp-book/rewards/page.tsx`: 同様にアクティブグループのみ表示
- `app/stamp-book/page.tsx`: ホームのプロジェクト切り替えチップ削除（ヘッダーのチップと重複）

### 以前のセッションで実装済みの主要機能

- 来場者スタンプ帳4タブ（ホーム・スタンプ・引換券・プロフィール）
- プロジェクト別テーマカラー全体切り替え（ヘッダー・ボトムナビ・アクセント）
- QRスキャン後に当該プロジェクトが自動でアクティブ化
- ヘッダーにプロジェクト切り替えチップ（▼）＋ボトムシート
- 動的QRコード（タイムスロット型）: `slots` / `slot_schedules` テーブル、`/slot/[token]` → 時刻でイベントへリダイレクト
- 特典（`project_reward_tiers`）、引換フロー（2段階確認）、CSV書き出し
- 復元コードによる別端末引き継ぎ
- イベントアイコン画像（アップロード・スタンプカード表示・取得完了画面）
- 管理者招待（メール招待・参加コード）

---

## 3. 未解決の問題

1. **`docs/mockup.html` が未コミット**: ユーザーがIDEで開いたモックアップHTML。作業中のファイルか確認し、コミットするか決める。
2. **スタンプ取得ロード時間**: 0.5秒以上かかる場合あり。Vercelコールドスタートが主因。
3. **age_group カラムに数値文字列**: DBの `age_group TEXT` に "25" のような値が入る。将来 `age INTEGER` へ移行検討。
4. **本格的レート制限なし**: 将来 Vercel KV / Upstash 導入を検討。
5. **lint**: `useEffect` 内の後方宣言警告が残るがビルド・型チェックはクリーン。

---

## 4. 次にやること（優先順）

1. **`docs/mockup.html` の扱いを確認** — ユーザーがIDEで開いていた。コミットするか不要か確認する。
2. **プロジェクト承認ワークフロー**（`memory/pending-project-approval-workflow.md` に保存済み）— 「開発一段落したら着手」と合意した大型機能。内容は memory を参照。
3. `age_group` → `age INTEGER` マイグレーション
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

---

## 6. 主要ファイルの地図

**来場者**
- `app/stamp-book/layout.tsx` — 共通ヘッダー・QRスキャナー・モーダル群・CSSテーマ変数注入
- `app/stamp-book/StampBookContext.tsx` — データ共有・activeProjectId管理・themeId localStorage連携
- `app/stamp-book/page.tsx` — ホーム（カルーセル・進捗・タイムテーブル・マップ）
- `app/stamp-book/stamps/page.tsx` — スタンプ一覧（アクティブPJのみ）
- `app/stamp-book/rewards/page.tsx` — 引換券一覧（アクティブPJのみ）
- `app/profile/page.tsx` — テーマカラー対応ヘッダー
- `app/event/[qr_token]/stamp/page.tsx` — スタンプ取得（activeProjectId 自動セット）
- `components/BottomNav.tsx`, `components/StampCard.tsx`, `components/RewardTicketModal.tsx`

**管理**
- `app/admin/projects/[id]/page.tsx` — テーマ選択・画像管理（カルーセル写真・タイムテーブル・マップ）
- `app/admin/redeem/page.tsx` — 特典引き換え（2段階確認）
- `app/admin/super/page.tsx` — 全プロジェクト承認管理

**API**
- `app/api/stamp-book/route.ts` — スタンプ帳データ一括取得（`project:projects(*)` で堅牢化）
- `app/api/projects/[id]/images/` — カルーセル写真 CRUD
- `app/api/projects/upload-image/route.ts` — Storage アップロード
- `app/api/slots/` / `app/slot/[token]/` — 動的QRコード

**共通ライブラリ**
- `lib/themes.ts` — Theme インターフェース（cardBg/ink/muted/line 追加済み）・全テーマ定義
- `lib/storage.ts` — localStorage ヘルパー（activeProjectId・activeThemeId）
- `types/index.ts` — `ProjectImage`, `StampBookGroup`, `Project`（timetable_url/images）
