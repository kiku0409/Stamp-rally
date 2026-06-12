# スタンプラリー - ライブ来場デジタルスタンプアプリ

ライブイベント向けのデジタル来場スタンプアプリです。来場者はQRコードを読み取るだけでスタンプを獲得でき、スタンプ帳で参加履歴を楽しく記録できます。

## 機能

- QRコード読み取りによるスタンプ獲得
- ログイン不要（ニックネームのみ）
- スタンプ帳（来場履歴の一覧表示）
- 実績・称号システム
- 管理画面（イベント作成・QRコード生成・来場者数確認）
- 同一ライブの重複スタンプ防止

---

## Supabaseセットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](ht　tps://supabase.com) にアクセスしてアカウント作成
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
ADMIN_PASSWORD=your-admin-password
```

> `ADMIN_PASSWORD` は管理画面ログインに使用するパスワードです。任意の文字列を設定してください。

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

`/admin/login` にアクセスし、`.env.local` で設定した `ADMIN_PASSWORD` でログインします。

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
ADMIN_PASSWORD
```

### 3. デプロイ

「Deploy」ボタンをクリック。自動的にビルド・デプロイが実行されます。

以降、`main` ブランチへのプッシュで自動デプロイされます。

---

## データベース構造

```
events
├── id          UUID PK
├── title       TEXT
├── event_date  DATE
├── venue       TEXT
├── description TEXT
├── qr_token    UUID UNIQUE  -- QRコードに埋め込むトークン
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

- 称号・特典システム（5/10/20回参加バッジ）
- スタンプランキング
- SNSシェア機能
- プッシュ通知
- イベントシリーズ管理
