# 開発進捗・引き継ぎメモ

最終更新: 2026-06-18

---

## 現在の状態

**本番URL:** https://stamp-rally-kappa.vercel.app  
**リポジトリ:** github.com/kiku0409/Stamp-rally (main ブランチ)  
**作業ディレクトリ:** /home/kiku2/stamp_rally

### デザイン
チケット半券デザイン × ターコイズトーナル（#0A938C 系）を採用・本番適用済み（2026-06-17）。
ミシン目・バーコード・Roboto Mono を用いたチケット半券の意匠。フォントは Zen Kaku Gothic New + Roboto Mono。
（旧: 緑ミニマル / ピンク デザイン。トークン表は旧緑デザインの記録のため参考値）

| トークン | 値 |
|---------|-----|
| `brand` | #17835D（メイングリーン） |
| `brand-deep` | #0E5C41 |
| `brand-soft` | #E9F5EF |
| `brand-border` | #C5E4D5 |
| `page` | #F5F7F5 |
| `rule` | #E4E8E3 |
| `ink` | #20241F |
| `subtle` | #6E756E |
| `faint` | #A2A8A1 |

ボタン: グラデーション `#1F9D70 → #16805B` + ドロップシャドウ  
スタンプ円: ラジアルグラデ + インナーシャドウ（`.stamp-acquired`）  
管理画面: 斜めストライプ背景（`.admin-bg`）

### 技術スタック
- Next.js 16.2.9（App Router, Turbopack）
- Tailwind CSS v4（`@import "tailwindcss"` + `@theme {}` カスタムトークン）
- Supabase（DB）
- Vercel（デプロイ）
- lucide-react（アイコン）
- Zen Kaku Gothic New（フォント、next/font/google 経由）

### Vercel 環境変数（設定済み）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- ~~`ADMIN_PASSWORD`~~（2026-06-18 のマルチテナント対応で不要に。削除可）

---

## 管理者認証（2026-06-18 マルチテナント対応）

単一の `ADMIN_PASSWORD` 認証を廃止し、**Supabase Auth（email + password）** に全面移行。
管理者は複数アカウントを持て、各管理者は **自分が作成したイベントのみ** 閲覧・編集・削除できる（分離型マルチテナント）。

### 仕組み
- ログイン: `supabase.auth.signInWithPassword()`。セッションは Supabase が localStorage で管理
- API 認証: `Authorization: Bearer <access_token>` ヘッダー。サーバーは `supabase.auth.getUser(token)` で検証（`lib/authMiddleware.ts` の `requireAdmin`）
- イベント所有者: `events.admin_id`（`auth.users(id)` 参照、NOT NULL）。作成時に自動セット、更新/削除時に所有者チェック
- スーパー管理者: `auth.users.raw_app_meta_data` の `role: "super_admin"` で識別（※この段階の `/admin/admins` 画面は後述のプロジェクト承認ワークフローで `/admin/super` に置き換え済み）

現スーパー管理者: `kikiki.4673@gmail.com`（UID: `dee565bd-ba21-44a3-bd54-7aa1745b0600`）

---

## プロジェクト承認ワークフロー（2026-06-18）

上記の `events.admin_id`（イベント単一所有者）から **プロジェクト単位の承認制** へ移行。

### モデル
- `projects`（フェス/連続ライブ等。status: pending/approved/rejected）
- `project_members`（owner/member。1プロジェクトに複数管理者）
- `events.admin_id` → `events.project_id`
- 管理者はセルフ登録 → プロジェクト申請 → スーパー管理者が承認 → そのプロジェクトで自由にイベント作成
- オーナーが他の登録済み管理者をメール招待で追加
- スーパー管理者は全プロジェクト・全イベントを**閲覧のみ**＋承認/却下

### 主な関連ファイル
| ファイル | 役割 |
|---------|------|
| `lib/authMiddleware.ts` | `requireAdmin` / `isSuperAdmin` / `getProjectRole` / `isApprovedMember` / `getEmailMap` / `findUserByEmail` |
| `app/api/projects/**` | 申請・一覧・詳細・承認/却下・メンバー招待 |
| `app/admin/signup` | セルフ登録 |
| `app/admin/projects/**` | 一覧（/admin）・申請・詳細（イベント＋メンバー管理） |
| `app/admin/super` | 承認待ち承認/却下・全体閲覧 |

### DB マイグレーション
`supabase/migrations/2026-06-18_project_approval_workflow.sql`
- 既存イベントはスーパー管理者の「既存イベント」プロジェクトへ移行
- **マイグレーションSQLとコードデプロイは同時に行う**（admin_id 依存の旧コードが動いている間に列を消すと壊れる）

### Supabase 設定
- Authentication → Email の「Confirm email」は OFF 推奨（セルフ登録後すぐ利用可能にするため）

---

## 実装済み機能

1. QRスキャン → スタンプ取得（重複チェック・取得日時表示）
2. ニックネーム登録（初回のみ、localStorage 保存）
3. スタンプ帳（来場者ホーム）
4. 称号システム（ライブデビュー → リピーター → 常連参加者 → レジェンド）
5. 管理ダッシュボード（総スタンプ数・総参加者数）
6. イベント作成・編集・削除
7. イベント複製機能
8. 管理画面 QR ボタン（イベント一覧から直接 QR モーダル）
9. スタンプ取得者一覧（イベントタップ → ニックネームと取得日時のボトムシート）
10. 取得済み QR 再スキャン時にイベント名と取得日時を表示
11. 管理者マルチテナント対応（Supabase Auth・イベント所有者分離）
12. プロジェクト承認ワークフロー（セルフ登録・プロジェクト申請/承認・複数管理者の共同編集・スーパー管理者の閲覧専用一括管理）

---

## ブランチ構成

| ブランチ | 内容 |
|--------|------|
| `main` | 本番。緑デザイン適用済み |
| `design/handoff-ui` | Street（ワインレッド）デザインの作業ブランチ。参照用に残存 |

---

## デザインバリエーション（handoff ドキュメント）

`docs/design-handoff/` に Street / Green 両案の HTML モックアップとスクリーンショットあり。

| 案 | 色 | 状態 |
|----|-----|------|
| Green（現採用） | #17835D | main に適用済み |
| Street | #9C2A38（ワインレッド） | `design/handoff-ui` ブランチに実装あり |

---

## 今後の予定

- [x] ~~カラーバリエーション検討・変更~~ → ターコイズ × チケット半券デザインに確定・適用済み（2026-06-17）
- [x] ~~管理者マルチテナント対応~~ → Supabase Auth + イベント所有者分離で実装・デプロイ済み（2026-06-18）

### 別プロジェクト（fes-stamp-rally）
- リポジトリ: github.com/kiku0409/fes-stamp-rally
- 作業ディレクトリ: /home/kiku2/fes-stamp-rally
- 内容: サーキットフェス向けQRスタンプラリー（地図UI・特典進捗など）
- 状態: stamp_rally をベースに初期コミット済み。未着手

---

## Vercel CLI メモ

```bash
vercel whoami          # ログイン確認
vercel --prod          # 本番デプロイ（/home/kiku2/stamp_rally から実行）
vercel env ls          # 環境変数一覧
# 環境変数追加は必ず printf を使う（echo は末尾改行が混入する）
printf "VALUE" | vercel env add VAR_NAME production
```
