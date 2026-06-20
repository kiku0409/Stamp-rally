# 引き継ぎメモ（HANDOFF）

最終更新: 2026-06-21 / 対象コミット: `df55084`（main・本番反映済み）

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
（`ADMIN_PASSWORD` は廃止済み）

### Supabase 設定の前提
- Authentication → Email の **「Confirm email」は OFF**（来場者ではなく管理者のセルフ登録を即ログイン可能にするため。ON に戻すと `/admin/signup` 後にログインできなくなる）。

---

## 2. 現在の実装状況（すべて本番反映済み）

### 認証・ロール
- 管理者: Supabase Auth（email+password）。スーパー管理者は `auth.users.raw_app_meta_data.role = 'super_admin'`。
- 来場者: 匿名。`localStorage`（`stamp_rally_participant`）の `participant_id` ＋ `recovery_code`。

### プロジェクト承認ワークフロー
- テーブル: `projects`（status: pending/approved/rejected, join_code, reject_reason）、`project_members`（owner/member）。
- フロー: セルフ登録 → `/admin/projects/new` で申請 → スーパー管理者が `/admin/super` で承認/却下（**却下理由**入力可）→ 承認済みプロジェクトでイベント作成。
- 共同編集: オーナーがメール招待 or **参加コード**（`/admin` の「参加コードで参加」）。
- 却下後: オーナーが内容修正して**再申請**（pending へ戻す）。
- 削除: オーナーが詳細から削除（スーパー承認不要・配下カスケード削除）。
- スーパー管理者は全プロジェクト/イベントを**閲覧のみ**（作成/編集/削除UIは出ない）＋承認/却下。

### スタンプ／スタンプ帳（来場者）
- イベントは `events.project_id` に属する。`event_stamps`（participant×event 一意）。
- スタンプ帳 `/stamp-book` は**プロジェクト単位**に自動グルーピング（`/api/stamp-book?code=...`）。
- 進捗「あと◯個で〜」、獲得特典チケット表示。左上ニックネームタップで `/profile`（ニックネーム・**復元コード**・リセット）。
- 旧称号システムは廃止（プロジェクト単位の特典段階に統合）。

### 特典（リワード）
- テーブル: `project_reward_tiers`（threshold, label / 複数段階・**編集可**）、`participant_rewards`（issued / `redeem_code`・`redeemed_at`・`redeemed_by`）。
- 付与: スタンプ取得時（`POST /api/stamps` の `issueRewards`）にプロジェクト内スタンプ数で閾値達成分を自動付与。新規付与は応答 `newRewards` で「特典獲得」演出。
- 来場者: 特典タップで `RewardTicketModal`（QR＝`redeem_code`＋名前、引換済表示）。
- **引き換え（QR）**: スタッフが `/admin/redeem` で QRスキャン or コード入力 → 名前・特典内容を即表示 → 「お渡し完了」1タップで使用済み化（`/api/rewards/redeem` GET=照合 / POST=使用済み、二重は409）。AdminLayout に「引き換え」常設リンク。
- 管理: プロジェクト詳細に段階の追加/編集/削除、**取得者一覧（引換状態つき）**、**CSV書き出し**（取得者・スタンプ）。

### セキュリティ・性能
- スタンプ帳読み取りは `recovery_code` を鍵に保護（participant_id だけでは読めない）。未使用の公開 `GET /api/stamps` は撤去。
- `POST /api/projects` に承認待ち申請数の上限（5件）。
- プロジェクト詳細は `GET /api/projects/[id]` が各イベントの `stampCount` を1クエリ集約（逐次fetch廃止）。`loadData` は try/finally。

### DBマイグレーション（全て適用済み・`supabase/migrations/`）
`2026-06-18_project_approval_workflow` / `2026-06-20_join_code` / `2026-06-20_participant_recovery_code` / `2026-06-20_reward_tiers` / `2026-06-21_redeem_reject`
スキーマ全体は `supabase/schema.sql`。

---

## 3. 未解決の問題・既知の注意点

1. **復元コード未保持の旧端末**: recovery_code 機能より前に登録した端末は localStorage にコードが無く、`/stamp-book` が表示されない（復元コード入力 or 再登録が必要）。実ユーザーほぼ皆無のため許容中。
2. **段階の閾値編集は非遡及**: tier の threshold を変えても既存の付与/取消は再評価しない（label 編集は安全）。
3. **段階の削除はカスケード**: tier 削除で当該 `participant_rewards` も消える（取得者記録が消える）。回避のため「編集」を用意済み。削除時は確認ダイアログあり。
4. **本格的レート制限なし**: 申請数上限のみ。連打/ボット対策は Vercel KV / Upstash 等の外部ストアが前提。
5. **本人確認は復元コード止まり**: 高価値特典では、コード共有/流出で他人引き換えの余地。将来メール/LINE連携で強化想定。
6. **詳細ページが長い／一覧に検索・ページングなし**: 取得者やスタンプが大量になるとつらい（要 検索/フィルタ/ページング）。
7. **本番のテストデータ汚染**: `e2e-*` アカウント・プロジェクト・匿名テスト参加者が残存。掃除SQL:
   ```sql
   DELETE FROM projects WHERE created_by IN (SELECT id FROM auth.users WHERE email LIKE 'e2e-%');
   DELETE FROM auth.users WHERE email LIKE 'e2e-%';
   ```
   また検証で `807efac3-...`（E2E夏フェス）の特典段階ラベルがテスト値（「APIテスト…」等）に書き換わっている。気になればラベルを戻す。
8. **lint**: `useEffect` 内で後方宣言の関数を呼ぶ等のリポジトリ既存パターン警告が残るが、Next 16 のビルドは lint をゲートにしないため**ビルドは通る**。`tsc --noEmit` はクリーン。
9. **メモリ**（`~/.claude/.../memory/pending-project-approval-workflow.md`）は「ブランチ実装・未デプロイ」と古い記述のまま（実際はデプロイ済み）。必要なら更新。

---

## 4. 次にやること（候補・README「将来的な拡張」と対応）

優先度は要相談。直近で価値が高い順の目安:
1. **引き換え運用の強化**: スキャン即・自動使用済み＋取り消しモード、引き換え統計（付与/引換数・引換率）。
2. **取得者/スタンプ一覧の検索・フィルタ・ページング**（実運用が増えたとき必須）。
3. **本人確認強化**: 復元コードに任意のメール/LINE連携を加算（端末間引き継ぎ＋なりすまし対策）。
4. **本格的レート制限**（KV導入）。
5. 体験系: スタンプランキング、SNSシェア、プッシュ通知。
6. 監査ログ（承認/却下・引き換えの操作履歴）。
7. 後片付け: 上記テストデータの削除、tierラベルの復元。

---

## 5. 開発・デプロイの作法（このプロジェクト固有）

- **ブランチ**: `main` は本番。機能ごとに feature ブランチ → `main` に ff マージ → push で自動デプロイ。
- **DB変更を伴う場合の順序**: 「Supabase SQL Editor でマイグレーション実行（無停止のため列追加は **DBデフォルト＋バックフィル** 付き）→ その後に `main` マージ＝デプロイ」。逆順だと一時的に壊れる（過去に経験済み）。各マイグレーションSQLは `supabase/migrations/` にある。
- **検証**: Playwright（chromium）で**本番URLを実機ドライブ**して E2E＋スクショ。スクリプトは**プロジェクト内**の一時dir（例 `.e2e/`）に置く（`/tmp` だと node_modules を解決できない）。終わったら掃除。`npx playwright install chromium` が必要なことがある。
- **Bash 出力**: このセッションではツール結果の relay が時々途切れた。重要な出力は `> /tmp/x.txt 2>&1` してから Read で読むと確実。
- **来場者の匿名識別**: `lib/storage.ts`（localStorage）。コード生成は `lib/code.ts`（`generateCode`/`normalizeCode`/`formatGrouped`、曖昧文字 0/1/O/I を除外）。
- **権限ヘルパー**: `lib/authMiddleware.ts`（`requireAdmin`/`isSuperAdmin`/`getProjectRole`/`isApprovedMember`/`getEmailMap`/`findUserByEmail`）。

---

## 6. 主要ファイルの地図

- 来場者: `app/event/[qr_token]/stamp/page.tsx`（スタンプ取得）、`app/stamp-book/page.tsx`、`app/profile/page.tsx`、`components/RewardTicketModal.tsx`、`components/QRScanner.tsx`
- 管理: `app/admin/page.tsx`（プロジェクト一覧＋コード参加）、`app/admin/projects/new`、`app/admin/projects/[id]/page.tsx`（イベント/段階/取得者/メンバー/削除/再申請）、`app/admin/super/page.tsx`（承認/却下）、`app/admin/redeem/page.tsx`（引き換え）、`components/AdminLayout.tsx`
- API: `app/api/projects/**`（一覧/詳細/承認/却下/メンバー/段階/取得者/スタンプCSV）、`app/api/events/**`、`app/api/stamps`、`app/api/stamp-book`、`app/api/participants`(+`/restore`)、`app/api/rewards/redeem`
- 共通: `lib/supabase.ts` / `lib/authMiddleware.ts` / `lib/adminAuth.ts` / `lib/code.ts` / `lib/csv.ts` / `lib/storage.ts` / `types/index.ts`
