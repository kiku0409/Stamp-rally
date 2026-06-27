# 引き継ぎメモ（HANDOFF）

最終更新: 2026-06-27 / ブランチ: `claude/trading-partner-history-vvtz7r`

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

## 2. 現在の実装状況（未コミット・このセッションの成果）

### 今セッションで実装・完了済み（未コミット）

#### A. 管理者引き換え画面の2段階確認（`app/admin/redeem/page.tsx`）
ともやさんフィードバック対応。ステートマシンを全面刷新。

```
scan → loading → preview → confirm（NEW）→ redeeming → done（NEW）
```

- **preview（未引き換え）**: 「引き換えする」ボタン → POST はせず `confirm` へ
- **preview（引き換え済み）**: 赤バナーで日時表示
- **confirm（NEW）**: 黄色注意テキスト「引き換えると取り消せません」＋「確定（引き換える）」/「戻る」
- **done（NEW）**: 大きな緑チェック＋「引き換え完了！」＋名前・特典名
- Playwright E2E で10サイクル全パス確認済み（15.8秒）

#### B. 来場者スタンプ帳の受取完了ポップアップ（`app/stamp-book/page.tsx`）
3秒ポーリングで `redeemed_at` の `null → 非null` 変化を検出しポップアップ表示。

- `useEffect` で `setInterval(3000)` + `prevUnredeemedRef`（Map: redeem_code→label）で前回の未引き換え状態を追跡
- 変化検出 → `redeemPopup` state セット → 3.5秒後自動クローズ（タップでも閉じる）
- 未引き換え報酬がゼロになったら `clearInterval` でポーリング停止
- 全画面オーバーレイ: 緑チェック + 「受取完了！」+ 特典名
- ※ Playwright 外のため手動確認が必要（管理者が引き換え → 3秒以内にポップアップ出るか）

#### C. 管理者ログイン画面のパスワード表示切り替え（`app/admin/login/page.tsx`）
- `showPassword` state + `Eye`/`EyeOff` アイコン（lucide-react）
- パスワード入力欄の右端にトグルボタン（`tabIndex={-1}` でタブ移動を妨げない）

#### D. Playwright E2E テスト環境（新規）
- `playwright.config.ts`: port 3001 で起動（port 3000 は別アプリが占有）
- `tests/redeem-flow.spec.ts`: `beforeAll` で Supabase service role によりテストデータ自動生成 → 10サイクル実行 → `afterAll` でクリーンアップ
- `@playwright/test` + `dotenv` を devDependencies に追加

### 過去セッションの実装（本番反映済み）
詳細は前回 HANDOFF の「2. 現在の実装状況」を参照（認証・ロール、プロジェクト承認ワークフロー、スタンプ、特典 など）。

---

## 3. 未解決の問題・既知の注意点

1. **来場者ポップアップ（B）の手動確認が未完了**: Playwright はブラウザ単体テスト。実際に管理者が引き換えた後3秒以内にポップアップが出るかは、2画面（管理者・来場者）を同時に開いた状態での実機確認が必要。
2. **Playwright は port 3001 専用**: `playwright.config.ts` の `baseURL` と `webServer` が port 3001 に設定。`npm run dev` は通常 3000 起動のため、テスト実行前に `npm run dev -- -p 3001` が必要（または Playwright の `webServer` が自動起動）。
3. **今セッションの変更は未コミット**: `app/admin/redeem/page.tsx`、`app/stamp-book/page.tsx`、`app/admin/login/page.tsx`、`playwright.config.ts`、`tests/`、`package.json`、`.env.local.example` がステージング前。
4. **`test-results/` が未追跡**: `.gitignore` に追加推奨。
5. **復元コード未保持の旧端末**: recovery_code 機能より前に登録した端末は `/stamp-book` が表示されない（許容中）。
6. **段階の閾値編集は非遡及**: tier の threshold を変えても既存付与は再評価しない。
7. **lint**: `useEffect` 内で後方宣言の関数を呼ぶ等の既存パターン警告が残るがビルドは通る。

---

## 4. 次にやること

### 最優先（次セッション冒頭）
1. **今セッションの変更をコミット & main にマージ**
   - 対象: `app/admin/redeem/page.tsx`、`app/stamp-book/page.tsx`、`app/admin/login/page.tsx`、`playwright.config.ts`、`tests/redeem-flow.spec.ts`、`package.json`、`package-lock.json`、`.env.local.example`
   - `test-results/` を `.gitignore` に追加してからコミット
   - Vercel 本番に自動デプロイされることを確認

2. **来場者ポップアップの実機確認**（2画面同時）
   - スタンプ帳を開いたまま、管理者が `/admin/redeem` で同一参加者の特典を引き換え
   - 3秒以内に「受取完了！」ポップアップが出るか確認

### その後の候補（優先度順）
3. 引き換え統計ダッシュボード（付与数・引換数・引換率）
4. 取得者/スタンプ一覧の検索・フィルタ・ページング
5. 本人確認強化（メール/LINE連携）
6. 本格的レート制限（KV導入）
7. 体験系: ランキング、SNSシェア、プッシュ通知
8. 監査ログ（操作履歴）

---

## 5. 開発・デプロイの作法

- **ブランチ**: `main` は本番。機能ごとに feature ブランチ → `main` に ff マージ → push で自動デプロイ。
- **DB変更を伴う場合の順序**: Supabase SQL Editor でマイグレーション実行 → その後 `main` マージ。逆順だと一時的に壊れる（過去に経験済み）。
- **port**: dev サーバーは通常 3000。別アプリが 3000 を占有している場合は `npm run dev -- -p 3001`。Playwright は port 3001 設定済み。
- **Playwright テスト**: `npx playwright install chromium` が初回必要。`TEST_ADMIN_EMAIL`/`TEST_ADMIN_PASSWORD` を `.env.local` に要設定。テストは Supabase にテストデータを自動生成・削除する。
- **来場者の匿名識別**: `lib/storage.ts`（localStorage）。コード生成は `lib/code.ts`。
- **権限ヘルパー**: `lib/authMiddleware.ts`（`requireAdmin`/`isSuperAdmin`/`getProjectRole`等）。

---

## 6. 主要ファイルの地図

- 来場者: `app/event/[qr_token]/stamp/page.tsx`、`app/stamp-book/page.tsx`、`app/profile/page.tsx`、`components/RewardTicketModal.tsx`
- 管理: `app/admin/login/page.tsx`（パスワード表示切り替え追加）、`app/admin/redeem/page.tsx`（2段階確認）、`app/admin/page.tsx`、`app/admin/projects/[id]/page.tsx`、`app/admin/super/page.tsx`
- API: `app/api/projects/**`、`app/api/events/**`、`app/api/stamps`、`app/api/stamp-book`、`app/api/rewards/redeem`
- テスト: `playwright.config.ts`、`tests/redeem-flow.spec.ts`
- 共通: `lib/supabase.ts` / `lib/authMiddleware.ts` / `lib/adminAuth.ts` / `lib/code.ts` / `lib/storage.ts` / `types/index.ts`
