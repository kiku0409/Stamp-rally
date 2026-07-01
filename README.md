# スタンプラリー — ライブ来場デジタルスタンプアプリ

**本番URL: https://stamp-rally-kappa.vercel.app**  
管理画面: `/admin/login` ／ 新規登録: `/admin/signup`

QRをかざすだけで、ライブの思い出が貯まる。  
来場者はアプリDL・ログイン不要。運営はプロジェクト（フェス・連続ライブ）単位でイベントとQRをブラウザだけで管理できます。

---

## 来場者の使い方

### スタンプ獲得は 3 ステップ

1. **QRをスキャン** — 会場に掲示されたQRをスマホで読み取る
2. **スタンプ獲得** — 初回だけニックネームを登録。以降は即取得
3. **スタンプ帳で確認** — プロジェクト（フェス）ごとに一覧表示。スタンプ数・進捗・引換券がまとまって見える

### スタンプ帳の 4 タブ

| タブ | 内容 |
|------|------|
| ホーム | 選択中プロジェクトのみ表示（フォトカルーセル・スタンプ進捗・タイムテーブル・会場マップ） |
| スタンプ | 取得済みスタンプ一覧（イベント名・アイコン・日時） |
| 引換券 | 獲得した特典チケット一覧（引換用QRコード表示） |
| ユーザー | ニックネーム・参加者情報・復元コード（アクティブプロジェクトのテーマカラーで表示） |

### ホーム画面

- **選択中プロジェクトのみ** 表示（複数参加の場合はチップで切り替え）
- **フォトカルーセル** — 運営がアップロードしたプロジェクト写真を横スクロールで閲覧（無制限）
- **タイムテーブル** — 会場のタイムテーブル画像（設定されている場合に表示）
- **会場マップ＋スタンプスポットピン** — 会場マップ画像上にスタンプスポットのピンを表示（設定されている場合）。未獲得は青丸＋A/B/Cラベル、獲得済みはテーマカラー＋チェックマーク。ピンをタップすると詳細カード（獲得案内またはQRスキャンボタン）が表示される

### プロジェクトテーマ

スタンプ帳のヘッダー・ボトムナビ・アクセントカラーがアクティブなプロジェクトのテーマカラーに自動切り替わります。ユーザー情報ページのヘッダーも同様のテーマカラーで表示されます。QRスキャンで訪れたプロジェクトが自動でアクティブになります。

### 特典チケット

スタンプが規定数に達すると特典チケットを自動付与。タップで引換用QRが表示され、スタッフにスキャンしてもらうと引き換え完了（一回限り）。プロジェクトごとに複数段階を設定可能。

### 復元コードで端末引き継ぎ

発行される**復元コード**を控えておけば、機種変更後も別端末でスタンプ帳を復元できます（ユーザー情報タブ → 復元コードで確認）。

---

## 運営の使い方

### アカウント・プロジェクト

1. **セルフ登録** — `/admin/signup` でメールアドレス＋パスワードでアカウント作成
2. **プロジェクト申請** — フェスや連続ライブなどの単位で申請（名称・説明・テーマカラーを設定）
3. **スーパー管理者が承認** — 承認されるとイベントの作成・QR発行が可能になる
4. **共同編集** — オーナーがメール招待または**参加コード**共有で他の管理者を追加できる

> スーパー管理者は全プロジェクト・全イベントを閲覧し、申請の承認/却下のみ行います（他プロジェクトの編集は不可）。

### イベントとQRコード

- イベントごとに**QRコードを自動発行**。ダウンロードして会場に掲示するだけ
- イベントに**アイコン画像**を設定可能（スタンプ帳・取得完了画面に表示）
- 名称・日付・会場・説明はあとから編集可
- イベントごとのスタンプ取得数をリアルタイムで確認
- **マップ上のピン位置設定** — プロジェクトに会場マップを登録済みなら、マップ画像をクリックするだけでそのイベントのピン位置（X%/Y%）とラベルを設定できる

### 動的QRコード（スロット型）

路上ライブなど「1枚のQRで時間帯ごとに異なるアーティストのスタンプを押したい」場合に使うタイムスロット機能です。

1. **スロットを作成**（例: "ステージA"）— 物理的に印刷するQR 1枚に対応
2. **タイムテーブルを設定** — 時間帯ごとにアーティスト（イベント）を割り当て
3. **QRを印刷して掲示** — スキャン時刻に応じて自動的に対応イベントのスタンプページへリダイレクト

時間外のスキャンには「受付時間外」エラーと次回開始時刻を表示します。

管理画面: プロジェクト詳細 → 「スロット管理（動的QR）」

### 特典管理と引き換え

- プロジェクトごとに「◯個で特典」を**複数段階**で設定（ラベル・個数を後から編集可）
- 達成者一覧（ニックネーム・段階・日時・引き換え状態）を管理画面で確認
- スタッフは `/admin/redeem` で来場者の特典QRをスキャン → 名前と特典を確認 → 「お渡し完了」で使用済み化
- CSV書き出し（特典取得者・スタンプ取得者）

---

## 機能一覧

### 来場者
- QRスキャンによるスタンプ獲得（ログイン不要・ニックネームのみ）
- スタンプ帳 4タブ構成（ホーム・スタンプ・引換券・ユーザー）
- プロジェクト別テーマカラー（ヘッダー・ボトムナビが自動切り替え）
- 特典チケット自動付与・引換用QR表示
- 会場マップ上のスタンプスポットピン表示（獲得状況が一目でわかる）
- 復元コードによる別端末引き継ぎ
- 同一ライブの重複スタンプ防止

### 運営（管理者）
- プロジェクト承認ワークフロー（申請 → 承認/却下＋却下理由 → 修正再申請）
- テーマカラー選択（プロジェクト設定でスタンプ帳のUIカラーを変更）
- **プロジェクト写真** — カルーセル用写真を無制限アップロード・並び替え・削除
- **タイムテーブル画像** — ホーム画面のタイムテーブルセクションに表示する画像を設定
- **会場マップ画像** — ホーム画面の会場マップセクションに表示する画像を設定
- **マップピン** — イベント編集画面でマップをクリックしてスタンプスポットの位置を設定。来場者のマップ上に獲得状況が表示される
- イベントごとのアイコン画像設定
- **動的QRコード（スロット型）** — タイムテーブルで時間帯ごとにイベントを割り当て
- 複数管理者での共同編集（メール招待・参加コード）
- QRコード発行・ダウンロード
- 特典段階の設定・編集
- 特典引き換え（スキャン方式、二重防止）
- 取得者一覧・CSV書き出し（性別・年齢を含む）
- スーパー管理者による全プロジェクト閲覧・承認管理

---

## セットアップ

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` の内容を実行してDBを作成
3. **Authentication → Email → Confirm email を OFF** に設定（管理者がセルフ登録後すぐ利用できるようにするため）
4. **Storage → New bucket** で `event-icons` という名前の**Public**バケットを作成（イベントアイコン・プロジェクト写真・タイムテーブル・会場マップの画像アップロード先）

> `supabase/migrations/` 配下は本番DBへの変更履歴。新しくセットアップする場合は `schema.sql` だけで最新スキーマになる（都度 migrations は不要）。

### 2. 環境変数

`.env.local.example` をコピーして設定:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. スーパー管理者の設定

`/admin/signup` でアカウントを作成した後、Supabase SQL Editor で以下を実行:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE id = '<UID>';
```

### 4. ローカル起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開き、`/admin/login` から管理画面へ。

---

## Vercelデプロイ

1. Vercel でリポジトリをインポート
2. Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を追加
3. デプロイ実行。以降は `main` への push で自動デプロイ

---

## データベース構造

```
projects
├── id              UUID PK
├── name            TEXT
├── description     TEXT
├── status          TEXT              -- pending / approved / rejected
├── theme_id        TEXT              -- テーマカラーID
├── venue_map_url   TEXT              -- 会場マップ画像URL
├── timetable_url   TEXT              -- タイムテーブル画像URL
├── join_code       TEXT UNIQUE       -- 参加コード
├── created_by      UUID FK → auth.users.id
├── approved_by     UUID FK → auth.users.id
├── approved_at     TIMESTAMPTZ
└── created_at      TIMESTAMPTZ

project_images                     -- カルーセル用写真（無制限）
├── id          UUID PK
├── project_id  UUID FK → projects.id ON DELETE CASCADE
├── image_url   TEXT
├── sort_order  INT
└── created_at  TIMESTAMPTZ

project_members
├── id         UUID PK
├── project_id UUID FK → projects.id
├── user_id    UUID FK → auth.users.id
├── role       TEXT               -- owner / member
└── UNIQUE(project_id, user_id)

events
├── id          UUID PK
├── title       TEXT
├── event_date  DATE
├── venue       TEXT
├── description TEXT
├── qr_token    UUID UNIQUE        -- QRコードに埋め込むトークン
├── icon_url    TEXT               -- アイコン画像URL
├── map_x       NUMERIC            -- 会場マップ上のX座標（0〜100%）
├── map_y       NUMERIC            -- 会場マップ上のY座標（0〜100%）
├── map_label   TEXT               -- ピンラベル（A/B/C等）
├── map_color   TEXT               -- 将来の色分け用（現在未使用）
├── project_id  UUID FK → projects.id
└── created_at  TIMESTAMPTZ

slots                              -- 動的QR: 物理QR 1枚に対応
├── id          UUID PK
├── project_id  UUID FK → projects.id
├── name        TEXT               -- 管理用名称（例: ステージA）
├── slot_token  TEXT UNIQUE        -- QRに埋め込むトークン
└── created_at  TIMESTAMPTZ

slot_schedules                     -- 動的QR: 時間帯ごとのイベント割り当て
├── id         UUID PK
├── slot_id    UUID FK → slots.id
├── event_id   UUID FK → events.id
├── start_at   TIMESTAMPTZ
├── end_at     TIMESTAMPTZ
└── created_at TIMESTAMPTZ

participants
├── id            UUID PK
├── nickname      TEXT
├── recovery_code TEXT UNIQUE      -- 別端末からの復元コード
├── gender        TEXT
├── age_group     TEXT             -- 実年齢を文字列で格納（例: "25"）
└── created_at    TIMESTAMPTZ

event_stamps
├── id             UUID PK
├── participant_id UUID FK → participants.id
├── event_id       UUID FK → events.id
├── stamped_at     TIMESTAMPTZ
└── UNIQUE(participant_id, event_id)   -- 重複防止

project_reward_tiers               -- プロジェクトごとの特典段階
├── id          UUID PK
├── project_id  UUID FK → projects.id
├── threshold   INT                -- 付与に必要なスタンプ数
├── label       TEXT               -- 特典名
└── UNIQUE(project_id, threshold)

participant_rewards                -- 誰がどの段階を獲得したか
├── id             UUID PK
├── participant_id UUID FK → participants.id
├── tier_id        UUID FK → project_reward_tiers.id
├── project_id     UUID FK → projects.id
├── redeem_code    TEXT UNIQUE     -- 引換用QRに埋め込むコード
├── redeemed_at    TIMESTAMPTZ
├── redeemed_by    UUID FK → auth.users.id
├── issued_at      TIMESTAMPTZ
└── UNIQUE(participant_id, tier_id)
```

---

## ユーザーフロー

### 通常QR（静的）

```
会場のQRをスキャン
    ↓
/event/[qr_token]/stamp
    ↓
localStorage に participant_id あり？
  No → ニックネーム登録 → 参加者作成 → localStorage保存
  Yes → そのまま続行
    ↓
event_stamps に (participant_id, event_id) あり？
  Yes → 「取得済みです」
  No  → スタンプ作成 → 「スタンプ獲得！」→ 特典チェック → 新特典があれば通知
```

### 動的QR（スロット型）

```
スロットQRをスキャン
    ↓
/slot/[slot_token]（Server Component）
    ↓
現在時刻で slot_schedules を検索
    ↓
一致あり → redirect("/event/[qr_token]/stamp") → 通常スタンプフロー
一致なし → 「受付時間外」エラー + 次回開始時刻を表示
```

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16.2.9（App Router / Turbopack） |
| スタイル | Tailwind CSS v4 |
| 言語 | TypeScript |
| DB / Auth | Supabase（PostgreSQL + Supabase Auth） |
| デプロイ | Vercel（`main` push で自動デプロイ） |
| QRスキャン | `@zxing/browser` |
| QR生成 | `qrcode` |
| フォント | Zen Kaku Gothic New + Roboto Mono |
