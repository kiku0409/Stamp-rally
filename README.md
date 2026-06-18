# スタンプラリー - ライブ来場デジタルスタンプアプリ

QRをかざすだけで、ライブの思い出が貯まる。  
来場者は会場のQRを読み取るだけでスタンプを獲得。ログイン不要、ニックネームだけで参加できます。運営はイベントとQRをノーコードで管理し、来場データを取得できます。

---

## ユーザーガイド

### 来場者の使い方

#### スタンプ獲得は、3ステップ

**1. 会場のQRを読み取る**  
スマホのカメラでQRを読むだけ。アプリDLも不要。

**2. その場でスタンプ獲得**  
初回はニックネームを登録。あとは押すだけで完了。

**3. スタンプ帳で確認**  
参加履歴と称号がたまっていく。同じライブは1回のみ。

#### 通うほど、称号が育つ

**称号で達成感**  
参加回数に応じて「ライブデビュー → リピーター → 常連 → レジェンド」と昇格。次の目標までの進捗も一目で。

**参加履歴と統計**  
獲得スタンプ・総参加回数が並ぶ。行ったライブが思い出として残ります。

**ログイン不要のまま**  
データは端末に紐づくので、面倒な会員登録なしで続けられます。

---

### 運営の使い方

#### プロジェクト単位で運用、承認制

1. **セルフ登録** — メールアドレスとパスワードでアカウント作成
2. **プロジェクトを申請** — フェスや連続ライブなどの単位で申請
3. **スーパー管理者が承認** — 承認されるとそのプロジェクト内でイベントを自由に作成できる
4. **複数人で共同編集** — プロジェクトのオーナーが他の管理者を招待できる

> スーパー管理者は全プロジェクト・全イベントを閲覧でき、プロジェクト申請の承認/却下を行います（他人のイベントの編集はしません）。

#### QRを発行して、貼るだけ

**専用QRを自動発行**  
イベントごとにQRコードを生成。ダウンロードして会場に掲示するだけ。

**いつでも編集**  
名称・日付・会場・説明をあとから変更。情報の差し替えも簡単。

**取得数をその場で把握**  
イベントごとのスタンプ取得数を確認。リピート来場のデータが残ります。

---

### まとめ — かざす、貯まる、見える

| 来場者 | 運営 | ルール |
|--------|------|--------|
| QRをかざすだけ。ログイン不要でスタンプと称号が貯まる。 | イベントとQRをノーコードで管理し、来場データが見える。 | 同じライブのスタンプは1回のみ獲得できる。 |

---

## 機能

- QRコード読み取りによるスタンプ獲得
- ログイン不要（ニックネームのみ）
- スタンプ帳（来場履歴の一覧表示）
- 実績・称号システム
- 管理画面（イベント作成・QRコード生成・来場者数確認）
- 同一ライブの重複スタンプ防止
- プロジェクト承認ワークフロー（セルフ登録 → 申請 → スーパー管理者の承認 → 複数管理者で共同編集）

---

## Supabaseセットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) にアクセスしてアカウント作成
2. 「New project」でプロジェクトを作成
3. プロジェクト名・データベースパスワードを設定

### 2. データベース作成

Supabase ダッシュボードの **SQL Editor** を開き、`supabase/schema.sql` の内容をすべて貼り付けて実行してください。

### 3. APIキーの取得

Supabase ダッシュボードの **Settings → API** から以下を取得：

| キー | 説明 |
|------|------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon / public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

---

## 環境変数設定

`.env.local.example` をコピーして `.env.local` を作成します。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> 管理者認証は Supabase Auth（email + password）を使用します。`ADMIN_PASSWORD` は不要です。

---

## 管理者・プロジェクトの仕組み

- **セルフ登録**: 管理者は `/admin/signup` でアカウントを作成できます（Authentication → Email の「Confirm email」を OFF にしておくと登録後すぐ利用できます）。
- **スーパー管理者**: 最初の管理者を Authentication → Users で作成し、その UID に対して以下を実行してスーパー管理者にします。

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE id = '<UID>';
```

- **プロジェクト**: 管理者は `/admin/projects/new` でプロジェクトを申請。スーパー管理者が `/admin/super` で承認すると、そのプロジェクト内でイベントを作成できます。
- **共同編集**: プロジェクトのオーナーは詳細画面から、登録済みの管理者をメールアドレスで招待できます。

---

## ローカル起動方法

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 管理画面

`/admin/login` にアクセスし、Supabase Auth に登録した管理者のメールアドレスとパスワードでログインします。各管理者は自分が所属する承認済みプロジェクトのイベントのみ閲覧・編集・削除できます。スーパー管理者は `/admin/super` で承認・全体閲覧を行います。

---

## Vercelデプロイ方法

### 1. Vercelアカウント作成・プロジェクト接続

1. [Vercel](https://vercel.com) にアクセスしてGitHubアカウントでログイン
2. 「New Project」からこのリポジトリをインポート

### 2. 環境変数設定

Vercel の **Settings → Environment Variables** に以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 3. デプロイ

「Deploy」ボタンをクリック。自動的にビルド・デプロイが実行されます。

以降、`main` ブランチへのプッシュで自動デプロイされます。

---

## データベース構造

```
projects
├── id          UUID PK
├── name        TEXT
├── description TEXT
├── status      TEXT             -- pending / approved / rejected
├── created_by  UUID FK → auth.users.id  -- 申請者
├── approved_by UUID FK → auth.users.id
├── approved_at TIMESTAMPTZ
└── created_at  TIMESTAMPTZ

project_members
├── id          UUID PK
├── project_id  UUID FK → projects.id
├── user_id     UUID FK → auth.users.id
├── role        TEXT             -- owner / member
└── UNIQUE(project_id, user_id)

events
├── id          UUID PK
├── title       TEXT
├── event_date  DATE
├── venue       TEXT
├── description TEXT
├── qr_token    UUID UNIQUE      -- QRコードに埋め込むトークン
├── project_id  UUID FK → projects.id  -- 所属プロジェクト
└── created_at  TIMESTAMPTZ

participants
├── id          UUID PK
├── nickname    TEXT
└── created_at  TIMESTAMPTZ

event_stamps
├── id             UUID PK
├── participant_id UUID FK → participants.id
├── event_id       UUID FK → events.id
├── stamped_at     TIMESTAMPTZ
└── UNIQUE(participant_id, event_id)  -- 重複防止
```

---

## ユーザーフロー

```
会場のQRコードを読み取る
        ↓
/event/[qr_token]/stamp にアクセス
        ↓
localStorage に participant_id があるか？
  No → ニックネーム登録 → 参加者作成 → localStorage保存
  Yes → そのまま続行
        ↓
event_stamps に (participant_id, event_id) が存在するか？
  Yes → 「取得済みです」表示
  No  → スタンプ作成 → 「スタンプ獲得！」表示
```

---

## 将来的な拡張

- スタンプランキング
- SNSシェア機能
- プッシュ通知
- イベントシリーズ管理
