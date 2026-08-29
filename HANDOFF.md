# 引き継ぎメモ（HANDOFF）

- 更新日時: 2026-08-29 JST
- ブランチ: `main`
- 直近作業: LINEログイン連携の実チャネル設定・ローカルE2E完了・本番反映（残: 実機E2E）
- ⚠️ 注意: 2026-08-13/29 のLINE作業は Mac（/Users/kiku/dev/projects/Stamp-rally）で、2026-07-03 の作業は自宅WSL2 PC で行われ、**Mac側が origin を pull しないまま進めていた**。08-29 に rebase で統合済み（age INTEGER 移行にLINE登録APIも追従）。**作業開始時は必ず `git pull` すること**

次のセッションがこれだけ読めば再開できるようにまとめた運用・状態メモ。

---

## 0. 直近セッション（2026-07-03・自宅ローカルPC）の完了事項

- **全機能E2Eテスト整備 完了**（HANDOFF旧優先度1）: Playwright 15テスト全緑。管理者認証／スタンプ取得／来場者タブ・PJ切替／マップピン／プロフィール／承認／スタンプCSV／引換10サイクル。共通部品は `tests/helpers.ts`（service roleシード・afterAllクリーンアップ・`__playwright_test__` タグ）。実行は自宅WSL2 PC（`.env.local` に TEST_ADMIN_EMAIL/PASSWORD 必須、`npx playwright test`）
- **GitHub Actions CI 追加**: `.github/workflows/e2e.yml`。main への push / PR 毎に実DB+実ブラウザで全E2E実行。**GitHub Secrets 5つ（SUPABASE 3키 + TEST_ADMIN 2つ）の設定が必要**（未設定だとCIは失敗する）
- **age_group → age INTEGER 移行 完了**: `participants.age INTEGER` 追加（本番SQL適用済み・数値文字列18行backfill済み）。書き込みは age/age_group 二重書き込み、読み取りは age 優先・レガシー（「20代」等）フォールバック。CSVのJSONフィールド名は `age_group` のまま維持（互換）。`age_group` カラムは後日削除予定
- **SCHEMA-001 修正**: `projects.theme_id` は本番で NOT NULL だが schema.sql が nullable 記載だった乖離を修正（`2026-07-03_theme_id_not_null.sql`）
- **README・docs/slide-content.md 最新化**＋**オーナー向けPDF刷新**（`docs/オーナー向け使い方ガイド.pdf`、編集用ソース `docs/owner-guide-source.html`。HTML編集→Chromiumで `page.pdf()` 再生成）
- **資料齟齬の修正**: 引き換えボタンは「お渡し完了」ではなく「引き換えする」→「確定（引き換える）」の2段階（README/slide-content/PDF全て修正済み）

---

## 1. 基本情報

| 項目 | 値 |
|------|-----|
| 本番URL | https://stamp-rally-kappa.vercel.app |
| 管理画面 | `/admin/login`（新規登録 `/admin/signup`） |
| リポジトリ | github.com/kiku0409/Stamp-rally（`main`） |
| 作業ディレクトリ | /home/kiku2/stamp_rally（自宅WSL2 PC。旧: /Users/kiku/dev/projects/Stamp-rally） |
| デプロイ | Vercel（`main` への push で自動デプロイ） |
| スーパー管理者 | `kikiki.4673@gmail.com`（UID: `dee565bd-ba21-44a3-bd54-7aa1745b0600`） |
| E2Eテスト | `npx playwright test`（15本・実DB。要 .env.local の TEST_ADMIN_*） |

### 技術スタック
- Next.js 16.2.9（App Router / Turbopack）、Tailwind CSS v4、TypeScript
- Supabase（DB ＋ Auth ＋ Storage）、Vercel
- lucide-react、`@zxing/browser`（QRスキャン）、`qrcode`（QR生成）
- フォント: Zen Kaku Gothic New ＋ Roboto Mono

---

## 2. 現在の実装状況

### 直近セッション（2026-08-13）: LINEログイン連携

**概要**: 参加者がLINEアカウントと紐付けて本人特定できる機能。6月に先方(EMC)と合意した「10月サーキットフェス向けLINE紐付け」構想の実装（経緯: `docs/contractor-conversation-summary.md` / `docs/improvement-memo.md`）。将来のMessaging APIセグメント配信の土台として `participants.line_user_id` を保持する（配信機能は未実装・スコープ外）。

**実装内容**:
- OAuth 2.0認可コードフロー(LINE Login v2.1)を新規依存なしで実装。id_token検証はLINEの検証API(`/oauth2/v2.1/verify`)に委譲
- `lib/lineAuth.ts` — authorize URL組み立て / トークン交換 / verify / HMAC署名cookie / returnTo検証
- Route Handler 3本: `app/api/auth/line/{login,callback,complete}/route.ts`。completeが紐付け本体で5ステータス（linked=既存参加者に紐付け / new=新規1回目→登録フォーム / registered=新規登録 / restored=別端末復元 / conflict=別participantに紐付き済み→自動付け替えせずUIで選択）
- `app/auth/line/complete/page.tsx` — コールバック後にlocalStorageのparticipant_idを添えてcomplete APIを叩くクライアントページ
- `line_user_id` はDBと署名付き短命httpOnly cookieのみに存在。APIレスポンス・localStorage・URLには`line_linked: boolean`のみ
- UI: profile(連携カード) / stamp-book未ログイン / register / event/[qr_token]/stamp の4画面に `components/LineLoginButton.tsx` を組み込み
- 復元コードAPI(`/api/participants/restore`)がgender/age/age_group/line_linkedも返すよう改修（復元後のプロフィール表示が正しくなる）
- DBマイグレーション: `supabase/migrations/2026-08-13_participant_line_user_id.sql`（+schema.sql両方更新）
- ドキュメント更新: README / docs/slide-content.md / BUGS.md(BUG-001に根本対策追記)
- 検証済み: `npm run build` 成功。curlでOAuth配管をスモークテスト済み（login 302+cookie / returnToオープンリダイレクト拒否 / キャンセル・state不一致リダイレクト / cookie署名改ざん・期限切れ401）

**2026-08-29 セッションで完了したこと（設定・検証）**:
- **方針確定**: 公式LINE「目撃録」（EMC側が管理者、ユーザーは運用担当者で権限不足）とは**紐づけない**。先方が2026-08-27にLINEで「個人のLINEログインだけでOK、公式LINEの友だち集めはパワープレイでやる」と了承。Messaging APIセグメント配信・同意画面の友だち追加(bot_prompt)・リッチメニュー連携は**スコープ外**。先方希望の「公式LINE→スタンプラリー誘導」は目撃録のあいさつ/リッチメニューにURL・QRを貼るだけ（開発不要）
- **LINE Developers**: ユーザー自身の名義でプロバイダー「スタンプラリー」を新規作成 → LINEログインチャネル「スタンプラリー」作成（**チャネルID `2011317697`**、ステータス**開発中**）。コールバックURL2本（localhost / stamp-rally-kappa.vercel.app）登録済み
- Supabaseマイグレーション `2026-08-13_participant_line_user_id.sql` **本番適用済み**（REST経由で列存在を確認）
- `.env.local` に3変数設定済み。**Vercel Production にも3変数設定済み**（`APP_BASE_URL=https://stamp-rally-kappa.vercel.app`）
- **ローカルE2E 5シナリオ全て成功**: 既存参加者「きく」に紐付け(linked) / 別端末復元(restored、シークレットウィンドウ) / キャンセル・state不一致(curlでコールバックに直接送信 → `?line_error=cancelled` / `failed` へリダイレクト) / 新規登録(new→registered、表示名がニックネーム初期値に入る) / 競合(conflict UI「別のスタンプ帳と連携済みです」表示)
- `.env.local.example` に平文で入っていた `TEST_ADMIN_PASSWORD` をダミー値に置換

**残作業**:
1. **本番での実機E2E**（スマホ・LINEアプリ内ブラウザ）: 本番URLをLINEトークに貼ってタップ → 未登録状態で「LINEでログイン」→ 連携/復元できるか。あわせてPC本番でプロフィールから連携→シークレットウィンドウで復元
2. **テストデータ片付け**: 参加者「テスト太郎」（ローカルE2Eで作成、ユーザーのLINEに紐付き）を SQL Editor で削除 → `DELETE FROM participants WHERE nickname = 'テスト太郎';`（削除済みか要確認: `SELECT nickname FROM participants WHERE line_user_id IS NOT NULL;`）
3. **イベント前にチャネルを「公開」にする**: LINE Developers > スタンプラリー > チャネル上部の「開発中」→「公開」。開発中のままだと**チャネル管理者以外はログインできない**
4. 先方に「LINEログインで取れるのは表示名のみ。年齢・性別はLINEから取得できず登録時に本人入力」を伝えておく（先方が年齢取得を期待していた可能性あり）
5. 既知の表示仕様: `line_linked` は localStorage のフラグで、SQLで `line_user_id` を消しても画面は「連携済み」のまま（ログアウト→復元コードで再取得すると更新）。通常運用では連携が外れることはないので対応不要

### 過去セッション（2026-07-01 その2）で実施したこと

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

0. **LINEログイン連携の残作業**（§2の「残作業」参照: 本番実機E2E・テスト太郎削除・イベント前にチャネル「公開」）。LINEログインのE2Eテスト（Playwright）は未作成 — LINE側の認可画面を自動化できないため、`/api/auth/line/complete` を署名cookie直叩きでテストする形なら追加可能
1. ~~全機能のブラウザ検証~~ → **完了**（Playwright E2E 15本・CI化済み。2026-07-03）
2. ~~`age_group` → `age INTEGER` マイグレーション~~ → **完了**（2026-07-03。`age_group` カラムの削除だけ将来のクリーンアップとして残る。LINE登録APIも `lib/participantAge.ts` 経由で二重書き込みに追従済み 2026-08-29）
3. **GitHub Secrets の設定**（ユーザー作業）: リポジトリ Settings → Secrets and variables → Actions に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` の5つ。設定しないとCIは失敗し続ける
4. 本格的レート制限（KV導入）
5. ランキング、SNSシェア等の体験系機能
6. 引き換え統計ダッシュボード ← 最低優先度
7. 取得者/スタンプ一覧のフィルタ・ページング ← 最低優先度
8. `participants.age_group` カラム削除（レガシー「20代」形式データの扱いを決めてから）

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

**LINEログイン連携**
- `lib/lineAuth.ts` — OAuth/署名cookieヘルパー（環境変数 `LINE_LOGIN_CHANNEL_ID`/`LINE_LOGIN_CHANNEL_SECRET`/`APP_BASE_URL`）
- `app/api/auth/line/login/route.ts` — 認可開始（state/nonce発行→LINEへ302）
- `app/api/auth/line/callback/route.ts` — state検証・トークン交換・id_token検証
- `app/api/auth/line/complete/route.ts` — 紐付け本体（linked/new/registered/restored/conflict）
- `app/auth/line/complete/page.tsx` — 完了ページ（localStorage連携・登録フォーム・競合UI）
- `components/LineLoginButton.tsx` — 共通ボタン（profile/stamp-book/register/event stampの4画面）

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
