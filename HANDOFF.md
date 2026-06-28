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

#### F. プロジェクトテーマパック（6色）

- `lib/themes.ts` 新規作成: teal/pink/blue/orange/purple/green の6テーマ定義（ヘッダーグラデーション・アクセント・ソフト・トラック色）
- 管理画面プロジェクト詳細（`app/admin/projects/[id]/page.tsx`）: オーナーのみ見えるテーマ選択UI（スウォッチボタン）を追加。選択で即時 PUT /api/projects/[id]
- `app/stamp-book/page.tsx` + `components/StampCard.tsx`: プロジェクトごとにテーマ色をインラインスタイルで適用（複数プロジェクトが同時表示されるため CSS 変数は不使用）
- DB: `projects.theme_id TEXT DEFAULT 'teal'` を追加済み（Supabase 実施完了）
- コミット: `d84d6bd`

#### G. イベントアイコン画像アップロード

- `app/api/events/upload-icon/route.ts` 新規: multipart → Supabase Storage（`event-icons` バケット）→ public URL 返却
- イベント作成・編集フォームに「画像を選択」ボタン追加（60px円形プレビュー・削除ボタン付き）
- `app/api/events/route.ts` POST / `app/api/events/[id]/route.ts` PUT: `icon_url` を受け取り保存
- `components/StampCard.tsx`: `icon_url` があれば円形画像表示、なければ Music アイコン
- DB: `events.icon_url TEXT` を追加済み（Supabase 実施完了）
- Supabase Storage: `event-icons` バケット（Public=ON）作成済み
- コミット: `d84d6bd`

### 前セッション（2026-06-28）で実装・完了したもの

#### E. プロフィールページの刷新（`app/profile/page.tsx`）
- ニックネーム・性別・年代を1枚カードで表示＆編集可能に（鉛筆ボタンで編集モード）
- 旧ユーザー（性別・年代未設定）も後から入力可能
- 「ログアウト」ボタン追加（localStorage クリア → `/stamp-book` へリダイレクト）
- コミット: `7849d93`

#### A–D. 受取完了ポップアップのレイヤー修正（`app/stamp-book/page.tsx`）
管理者が特典を引き換えた際、来場者がQRモーダルを開いていると背面にポップアップが出るバグを修正。

- ポーリングで引き換え検出時、`setSelectedReward(current => current?.reward.redeem_code === redeemCode ? null : current)` でモーダルを先に閉じ、その後ポップアップを表示
- コミット: `7fd801d`

#### B. スタンプ取得のレスポンス高速化（`app/api/stamps/route.ts`、`app/event/[qr_token]/stamp/page.tsx`）
登録済みユーザーのスタンプ取得フローを 2往復→1往復 に削減。

- `POST /api/stamps` が `qr_token` を受け付け、イベント情報も一緒に返却。クライアントは `GET /api/events` を呼ばなくなった
- `issueRewards` 内の DB クエリを並列化（スタンプ数・tier一覧・付与済み一覧を `Promise.all`）
- コミット: `09d12e9`

#### C. QRなしでアカウント作成できるフロー（`app/register/page.tsx`、`app/stamp-book/page.tsx`）
新規ユーザーがQRスキャンなしでも登録できる `/register` ページを新設。スタンプ帳の空状態に「アカウントを作成する」ボタンを追加。

- コミット: `dd2b9c8`

#### D. ユーザー登録フォームの改修（`components/NicknameForm.tsx`）
- ニックネーム入力を維持（削除→復元の経緯あり）
- 年代選択（ドロップダウン: 10代/20代/...）→ **年齢入力（数値: 1〜120）** に変更
- コミット: `4760faa`

### 以前のセッション（本番反映済み）
- 管理者引き換え画面の2段階確認（`app/admin/redeem/page.tsx`）
- 管理者ログイン画面のパスワード表示切り替え（`app/admin/login/page.tsx`）
- Playwright E2E テスト環境（`playwright.config.ts`、`tests/redeem-flow.spec.ts`）
- スタンプ帳の3秒ポーリングによる受取完了ポップアップ
- 来場者の復元コードによる別端末引き継ぎ（BUG-001修正）

---

## 3. 未解決の問題・既知の注意点

> 新規バグ・機能要望は **`BUGS.md`** に追記すること（Claudeも自動参照する）。以下はアーキテクチャ上の注意点。

1. **スタンプ取得ロード時間**: 現状 0.5秒以上かかる場合がある（今後の課題）。1往復化・並列クエリ化は済み。Vercel コールドスタートが主因。
2. **age_group カラムに数値文字列を格納**: DBの `age_group TEXT` カラムに "25" のような数値文字列が入る。カラム名と実データが乖離しているが、マイグレーションは未実施。将来 `age INTEGER` カラムへの移行を検討。
3. **来場者ポップアップの手動確認**: 管理者が引き換え後3秒以内にポップアップが出るかは2画面同時での実機確認が必要。
4. **Playwright は port 3001 専用**: テスト実行前に `npm run dev -- -p 3001` が必要。
5. **復元コード未保持の旧端末**: recovery_code 機能より前に登録した端末は `/stamp-book` が表示されない（許容中）。
6. **段階の閾値編集は非遡及**: tier の threshold を変えても既存付与は再評価しない（label 編集は安全）。
7. **段階の削除はカスケード**: tier 削除で当該 `participant_rewards` も消える。削除時は確認ダイアログあり。
8. **本格的レート制限なし**: 申請数上限のみ。将来 Vercel KV / Upstash 導入を検討。
9. **本人確認は復元コード止まり**: 高価値特典では、コード共有/流出で他人引き換えの余地。将来メール/LINE連携で強化想定。
10. **lint**: `useEffect` 内で後方宣言の関数を呼ぶ等の既存パターン警告が残るがビルドは通る。`tsc --noEmit` はクリーン（ローカル環境。このリモート環境では node_modules の型が未インストールのためエラーが出るが無視してよい）。

---

## 4. 次にやること

### 候補（優先度順）
1. `age_group` カラムを `age INTEGER` にマイグレーション（現状は数値文字列が入っている）
2. 本人確認強化（メール/LINE連携）
3. 本格的レート制限（KV導入）
4. 体験系: ランキング、SNSシェア、プッシュ通知
5. 監査ログ（操作履歴）
6. 引き換え統計ダッシュボード（付与数・引換数・引換率）← 最低優先度
7. 取得者/スタンプ一覧の検索・フィルタ・ページング ← 最低優先度

---

## 5. 開発・デプロイの作法

- **ブランチ**: `main` は本番。機能ごとに feature ブランチ → `main` に ff マージ → push で自動デプロイ。
- **プランモード**: 変更前に必ずプランモードでユーザーに確認してから実装すること（直前セッションでニックネーム削除の手戻りが発生した教訓）。
- **DB変更を伴う場合の順序**: Supabase SQL Editor でマイグレーション実行 → その後 `main` マージ。逆順だと一時的に壊れる（過去に経験済み）。
- **port**: dev サーバーは通常 3000。別アプリが 3000 を占有している場合は `npm run dev -- -p 3001`。Playwright は port 3001 設定済み。
- **Playwright テスト**: `npx playwright install chromium` が初回必要。`TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD` を `.env.local` に要設定。テストは Supabase にテストデータを自動生成・削除する。
- **来場者の匿名識別**: `lib/storage.ts`（localStorage）。コード生成は `lib/code.ts`。
- **権限ヘルパー**: `lib/authMiddleware.ts`（`requireAdmin`/`isSuperAdmin`/`getProjectRole`等）。

---

## 6. 主要ファイルの地図

- 来場者: `app/event/[qr_token]/stamp/page.tsx`、`app/stamp-book/page.tsx`（テーマ対応済み）、`app/profile/page.tsx`（ニックネーム・性別・年代編集）、`app/register/page.tsx`、`components/RewardTicketModal.tsx`、`components/NicknameForm.tsx`、`components/StampCard.tsx`（テーマ・アイコン対応）
- 管理: `app/admin/login/page.tsx`、`app/admin/redeem/page.tsx`（2段階確認）、`app/admin/page.tsx`、`app/admin/projects/[id]/page.tsx`（テーマ選択UI）、`app/admin/events/new/page.tsx`（アイコン対応）、`app/admin/events/[id]/page.tsx`（アイコン対応）、`app/admin/super/page.tsx`
- API: `app/api/projects/**`（theme_id対応）、`app/api/events/**`（icon_url対応）、`app/api/events/upload-icon/route.ts`（新規）、`app/api/stamps/route.ts`、`app/api/stamp-book`（theme_id対応）、`app/api/rewards/redeem`、`app/api/participants/route.ts`（gender/age_group対応）
- テスト: `playwright.config.ts`、`tests/redeem-flow.spec.ts`
- 共通: `lib/supabase.ts` / `lib/authMiddleware.ts` / `lib/adminAuth.ts` / `lib/code.ts` / `lib/storage.ts` / `lib/themes.ts`（新規）/ `types/index.ts`
