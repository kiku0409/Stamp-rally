# 引き継ぎメモ（HANDOFF）

最終更新: 2026-06-29 / ブランチ: `main`（全変更コミット済み・本番デプロイ済み）

次のセッションがこれだけ読めば再開できるようにまとめた運用・状態メモ。ユーザー向けの仕様は `README.md`、過去経緯は `docs/progress.md` も参照。

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
- Supabase（DB ＋ Auth）、Vercel
- lucide-react、`@zxing/browser`（QRスキャン）、`qrcode`（QR生成）
- フォント: Zen Kaku Gothic New ＋ Roboto Mono、デザイン: ターコイズ(#0A938C)×チケット半券

### Vercel 環境変数（設定済み）
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

### Supabase 設定の前提
- Authentication → Email の **「Confirm email」は OFF**（来場者ではなく管理者のセルフ登録を即ログイン可能にするため）。

---

## 2. 現在の実装状況（全て `main` にコミット済み・本番反映済み）

### 直近セッション（2026-06-29）で実装・完了したもの

#### I. パターンB プロジェクト別全体テーマ切り替え（コミット: `9ddc817`）

来場者スタンプ帳のUI全体（ヘッダー・ボトムナビ・アクセントカラー）がアクティブプロジェクトのテーマカラーに自動切り替わる仕組みを実装。

- `lib/themes.ts`: `shibuya-fes`（ピンク#F06EA0 → シアン#5BC8D8）、`street-live`（黒#111111 + コーラル#E84E68）の2テーマ追加。`screenBg` オプションフィールドも追加
- `lib/storage.ts`: `getActiveProjectId` / `setActiveProjectId` ヘルパー追加（localStorage キー `stamp_rally_active_project`）
- `app/globals.css`: `header-grad` を `var(--color-header-from/to)` で CSS変数化。`btn-brand` を `var(--color-accent/accent-deep)` で CSS変数化
- `app/stamp-book/StampBookContext.tsx`: `activeProjectId` state + `setActiveProject` 関数を追加。groups ロード後に自動セット（未設定 or 存在しないIDなら groups[0] にフォールバック）
- `app/stamp-book/layout.tsx`: アクティブプロジェクトのテーマ色を CSS変数としてルート div に注入（`--color-header-from/to`, `--color-accent`, `--color-accent-deep`, `--color-soft`, `--color-track`, `--color-screen-bg`）。ヘッダーにプロジェクト切り替えチップ（▼付き）とボトムシートを追加
- `app/event/[qr_token]/stamp/page.tsx`: スタンプ取得成功後に `event.project_id` を `setActiveProjectId` で保存

動作フロー:
1. QRスキャン → スタンプ取得 → そのプロジェクトが自動でアクティブになる
2. ヘッダーにプロジェクト名チップ（▼）が表示される
3. タップでプロジェクト切り替えボトムシートが開き、別プロジェクトを選ぶと全UIテーマが切り替わる

管理画面のテーマ選択UIへの追加は `THEMES` 配列を参照しているため自動反映済み（追加操作不要）。

#### H. 来場者画面 ボトムナビ4タブ構成への再設計（前セッション）

旧: `app/stamp-book/page.tsx` 1ページにQR・スタンプ・引換券・ユーザー情報が集約
新: `layout.tsx` + 3ページ + Context で疎結合な4タブ構成

- `app/stamp-book/StampBookContext.tsx`、`components/BottomNav.tsx`、`app/stamp-book/layout.tsx`（共通グラデーションヘッダー・QRスキャナーモーダル・引換ポップアップ・RewardTicketModal・BottomNav）
- `app/stamp-book/page.tsx`: ホームタブ（ProjectOverviewCard：バナー・スタンプ数・直近3件のスタンプ・進捗バー・QRボタン）
- `app/stamp-book/stamps/page.tsx`: スタンプ一覧タブ
- `app/stamp-book/rewards/page.tsx`: 引換券一覧タブ

#### G. イベントアイコン画像・表示バグ修正（前セッション）

- アップロードAPI・フォーム対応・スタンプカード表示・取得完了画面・取得済み画面での表示修正
- スタンプAPI（`/api/stamps`）の events select に `icon_url` を追加（根本原因修正）

### 計画中・議論中（未実装）

#### 動的QRコード（タイムスロット型）— 方向性合意済み、未実装

路上アーティストライブで時間帯ごとに異なるアーティストのスタンプが取れる仕組み。
外部サービスではなく**内製スロットシステム**で実装する方針で合意。

設計概要:
- `/slot/[slot_token]` エンドポイントを新設
- 管理画面でアーティストのタイムテーブル（開始時刻・終了時刻・イベントID）を設定
- スキャン時に現在時刻を確認し、対応するイベントへリダイレクト
- 必要DBテーブル: `slots`（slot_token, project_id）、`slot_schedules`（slot_id, event_id, start_at, end_at）
- 印刷済みQRは変えずに済む

---

## 3. 未解決の問題・既知の注意点

> 新規バグ・機能要望は **`BUGS.md`** に追記すること（Claudeも自動参照する）。以下はアーキテクチャ上の注意点。

1. **スタンプ取得ロード時間**: 現状 0.5秒以上かかる場合がある。Vercel コールドスタートが主因。1往復化・並列クエリ化は済み。
2. **age_group カラムに数値文字列を格納**: DBの `age_group TEXT` カラムに "25" のような数値文字列が入る。将来 `age INTEGER` カラムへの移行を検討。
3. **来場者ポップアップの手動確認**: 管理者が引き換え後3秒以内にポップアップが出るかは2画面同時での実機確認が必要。
4. **Playwright は port 3001 専用**: テスト実行前に `npm run dev -- -p 3001` が必要。
5. **復元コード未保持の旧端末**: recovery_code 機能より前に登録した端末は `/stamp-book` が表示されない（許容中）。
6. **段階の閾値編集は非遡及**: tier の threshold を変えても既存付与は再評価しない（label 編集は安全）。
7. **段階の削除はカスケード**: tier 削除で当該 `participant_rewards` も消える。削除時は確認ダイアログあり。
8. **本格的レート制限なし**: 申請数上限のみ。将来 Vercel KV / Upstash 導入を検討。
9. **本人確認は復元コード止まり**: 高価値特典では、コード共有/流出で他人引き換えの余地。将来メール/LINE連携で強化想定。
10. **lint**: `useEffect` 内で後方宣言の関数を呼ぶ等の既存パターン警告が残るがビルドは通る。`tsc --noEmit` はクリーン。

---

## 4. 次にやること

### 候補（優先度順）
1. **動的QRコード（タイムスロット型）実装** — 方向性合意済み。DBテーブル2枚（`slots`・`slot_schedules`）新設 → Supabase SQL Editor でマイグレーション → API（`/slot/[token]`）+ 管理画面UI（タイムテーブル設定）実装。2週間後のGMO渋谷エンタメ祭（7/11-12）での使用を想定
2. `age_group` カラムを `age INTEGER` にマイグレーション
3. 本人確認強化（メール/LINE連携）
4. 本格的レート制限（KV導入）
5. 体験系: ランキング、SNSシェア、プッシュ通知
6. 監査ログ（操作履歴）
7. 引き換え統計ダッシュボード（付与数・引換数・引換率）← 最低優先度
8. 取得者/スタンプ一覧の検索・フィルタ・ページング ← 最低優先度

---

## 5. 開発・デプロイの作法

- **ブランチ**: `main` は本番。機能ごとに feature ブランチ → `main` に ff マージ → push で自動デプロイ。
- **プランモード**: 変更前に必ずプランモードでユーザーに確認してから実装すること（直前セッションでニックネーム削除の手戻りが発生した教訓）。
- **DB変更を伴う場合の順序**: Supabase SQL Editor でマイグレーション実行 → その後 `main` マージ。逆順だと一時的に壊れる（過去に経験済み）。
- **port**: dev サーバーは通常 3000。別アプリが 3000 を占有している場合は `npm run dev -- -p 3001`。Playwright は port 3001 設定済み。
- **Playwright テスト**: `npx playwright install chromium` が初回必要。`TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD` を `.env.local` に要設定。
- **来場者の匿名識別**: `lib/storage.ts`（localStorage）。activeProjectId も同じファイルで管理。
- **権限ヘルパー**: `lib/authMiddleware.ts`（`requireAdmin`/`isSuperAdmin`/`getProjectRole`等）。

---

## 6. 主要ファイルの地図

- 来場者: `app/event/[qr_token]/stamp/page.tsx`、`app/stamp-book/layout.tsx`（共通ヘッダー・モーダル群・CSS変数注入）、`app/stamp-book/StampBookContext.tsx`（データ共有・activeProjectId管理）、`app/stamp-book/page.tsx`（ホーム）、`app/stamp-book/stamps/page.tsx`（スタンプ一覧）、`app/stamp-book/rewards/page.tsx`（引換券）、`app/profile/page.tsx`、`app/register/page.tsx`、`components/BottomNav.tsx`（CSS変数 `text-accent` 経由でテーマ自動反映）、`components/RewardTicketModal.tsx`、`components/NicknameForm.tsx`、`components/StampCard.tsx`（テーマ・アイコン対応）、`components/StampAcquired.tsx`（アイコン対応）
- 管理: `app/admin/login/page.tsx`、`app/admin/redeem/page.tsx`（2段階確認）、`app/admin/page.tsx`、`app/admin/projects/[id]/page.tsx`（テーマ選択UI・新テーマ自動反映済み）、`app/admin/events/new/page.tsx`（アイコン対応）、`app/admin/events/[id]/page.tsx`（アイコン対応）、`app/admin/super/page.tsx`
- API: `app/api/projects/**`（theme_id対応）、`app/api/events/**`（icon_url対応）、`app/api/events/upload-icon/route.ts`、`app/api/stamps/route.ts`、`app/api/stamp-book`、`app/api/rewards/redeem`、`app/api/participants/route.ts`
- テスト: `playwright.config.ts`、`tests/redeem-flow.spec.ts`
- 共通: `lib/supabase.ts` / `lib/authMiddleware.ts` / `lib/adminAuth.ts` / `lib/code.ts` / `lib/storage.ts`（activeProjectId管理追加）/ `lib/themes.ts`（shibuya-fes・street-live追加）/ `types/index.ts`
- スタイル: `app/globals.css`（header-grad・btn-brand がCSS変数対応済み）
