# 開発進捗・引き継ぎメモ

最終更新: 2026-06-14

---

## 現在の状態

**本番URL:** https://stamp-rally-kappa.vercel.app  
**リポジトリ:** github.com/kiku0409/Stamp-rally (main ブランチ)  
**作業ディレクトリ:** /home/kiku2/stamp_rally

### デザイン
緑ミニマル（Green）デザインを採用・本番適用済み。

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
- `ADMIN_PASSWORD`

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

- [ ] **カラーバリエーション検討・変更**（色・デザインの微調整、決まり次第再実装）
- [ ] 上記が決まったら `main` に反映してデプロイ

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
