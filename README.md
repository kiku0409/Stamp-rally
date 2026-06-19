# スタンプラリー - ライブ来場デジタルスタンプアプリ

**🔗 アプリURL: https://stamp-rally-kappa.vercel.app**
（管理画面: https://stamp-rally-kappa.vercel.app/admin/login ／ 新規登録: `/admin/signup`）

QRをかざすだけで、ライブの思い出が貯まる。  
来場者は会場のQRを読み取るだけでスタンプを獲得。ログイン不要、ニックネームだけで参加できます。運営はプロジェクト（フェスや連続ライブ）単位でイベントとQRをノーコードで管理し、来場データや特典付与状況を取得できます。

---

## ユーザーガイド

### 来場者の使い方

#### スタンプ獲得は、3ステップ

**1. 会場のQRを読み取る**  
スマホのカメラでQRを読むだけ。アプリDLも不要。

**2. その場でスタンプ獲得**  
初回はニックネームを登録。あとは押すだけで完了。

**3. スタンプ帳で確認**  
スタンプ帳は**プロジェクト（フェス／連続ライブ）ごと**にまとまって表示。同じライブは1回のみ。

#### 集めるほど、特典がもらえる

**特典チケット**  
プロジェクトごとに「◯個で特典」を**複数段階**設定可能。スタンプが規定数に達すると特典チケットを自動付与。「あと◯個で〜」の進捗も一目で。

**ログイン不要のまま**  
データは端末に紐づくので、面倒な会員登録なしで続けられます。

**復元コードで引き継ぎ**  
発行される**復元コード**を控えておけば、機種変更や情報リセット後も別端末でスタンプ帳を復元できます（左上のニックネームをタップ→ユーザー情報で確認）。

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

#### 特典を設定し、取得者を把握

**特典段階を設定**  
プロジェクトごとに「◯個で特典」を複数段階で設定。達成者には自動で特典チケットが付与されます。

**取得者一覧**  
どの参加者がどの特典を獲得したか（ニックネーム・段階・日時）を管理画面で確認できます。

---

### まとめ — かざす、貯まる、もらえる

| 来場者 | 運営 | ルール |
|--------|------|--------|
| QRをかざすだけ。ログイン不要でスタンプと特典が貯まる。復元コードで端末間引き継ぎ。 | プロジェクト単位でイベント・QR・特典をノーコード管理し、来場/特典データが見える。 | 同じライブのスタンプは1回のみ。特典はプロジェクト単位の規定数で付与。 |

---

## 機能

- QRコード読み取りによるスタンプ獲得（ログイン不要・ニックネームのみ）
- スタンプ帳を**プロジェクト単位**で表示
- **特典チケット**（プロジェクトごとに複数段階の閾値で自動付与・来場者表示・管理者の取得者一覧）
- **復元コード**による別端末からのスタンプ帳引き継ぎ
- ユーザー情報画面（ニックネーム・復元コード・参加者情報のリセット）
- 管理画面（イベント作成・QRコード生成・来場者数/取得者の確認）
- 同一ライブの重複スタンプ防止
- プロジェクト承認ワークフロー（セルフ登録 → 申請 → スーパー管理者の承認 → 複数管理者で共同編集、コード参加・プロジェクト削除対応）

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
- **共同編集**: プロジェクトのオーナーは詳細画面から、登録済みの管理者を**メールアドレスで招待**できます。また各プロジェクトの**参加コード**を共有すれば、相手が `/admin` の「参加コードで参加」から自分で参加できます。
- **特典段階**: オーナーはプロジェクト詳細で「◯個で特典」を複数設定でき、達成者一覧（取得者）も確認できます。
- **プロジェクト削除**: オーナーは詳細画面からプロジェクトを削除できます（スーパー管理者の承認は不要。配下のイベント・スタンプも削除）。

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
├── id            UUID PK
├── nickname      TEXT
├── recovery_code TEXT UNIQUE      -- 別端末からの復元コード
└── created_at    TIMESTAMPTZ

event_stamps
├── id             UUID PK
├── participant_id UUID FK → participants.id
├── event_id       UUID FK → events.id
├── stamped_at     TIMESTAMPTZ
└── UNIQUE(participant_id, event_id)  -- 重複防止

project_reward_tiers              -- プロジェクトごとの特典段階（複数）
├── id          UUID PK
├── project_id  UUID FK → projects.id
├── threshold   INT              -- 付与に必要なスタンプ数
├── label       TEXT             -- 特典名
└── UNIQUE(project_id, threshold)

participant_rewards               -- 誰がどの段階を獲得したか
├── id             UUID PK
├── participant_id UUID FK → participants.id
├── tier_id        UUID FK → project_reward_tiers.id
├── project_id     UUID FK → projects.id
├── issued_at      TIMESTAMPTZ
└── UNIQUE(participant_id, tier_id)
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

- **特典の引き換え（使用済み化）** — スタッフが特典チケットを引き換え済みにする導線（次の実装予定）
- スタンプランキング
- SNSシェア機能
- プッシュ通知
