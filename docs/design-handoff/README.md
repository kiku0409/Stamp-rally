# Handoff: スタンプラリー UI リデザイン（ライブ来場デジタルスタンプアプリ）

## Overview
ライブ会場の QR コードを読み取ってデジタルスタンプを集める来場者向けアプリの **UI リデザイン一式**です。来場者はログイン不要（ニックネームのみ）でスタンプを獲得し、スタンプ帳で参加履歴・称号を確認できます。管理者はイベントの作成・編集、QR コード生成、来場者数の確認を行います。

このハンドオフは、**新しいビジュアルデザイン**（フラット＋線画 SVG アイコン＋落ち着いた配色、絵文字なし）を、既存の Next.js + Supabase コードベースに実装し直すためのものです。旧 UI（ピンク／紫グラデーション・絵文字 ⭐📍 多用）を、本デザインで置き換えます。

---

## About the Design Files
このバンドルに含まれる `*.dc.html` ファイルは、**HTML で作成したデザインリファレンス**です。意図した見た目・挙動を示すプロトタイプであり、そのまま本番に貼り付けるコードではありません。

タスクは、これらの HTML デザインを **既存のコードベースの環境（Next.js App Router + React + Tailwind CSS + Supabase）に、その慣習・ライブラリを使って再現する**ことです。HTML をそのまま出荷するのではなく、既存の `app/`・コンポーネント・API ルートの構造に合わせて実装してください。

### ファイルの開き方
`*.dc.html` は同梱の `support.js` を読み込むため、フォルダごとローカルサーバーで開いてください（例: `npx serve` でフォルダを配信し、各 HTML を開く）。左サイドバーのナビゲーションで全 11 画面を切り替えられます。

---

## Fidelity
**High-fidelity（ハイファイ）**。最終的な配色・タイポグラフィ・余白・角丸・影・インタラクションまで作り込まれています。色・サイズ・フォントは下記トークンの値どおりにピクセル単位で再現してください。

---

## デザイン案（2 案）
| 案 | ファイル | アクセント | 方向性 |
|----|---------|-----------|--------|
| **Street（採用・メイン）** | `Stamp Rally Street.dc.html` | ワインレッド `#9C2A38` × 黒インク | 立体的なスタンプ、つや・影あり、管理画面はグレー地。質感重視。 |
| **Green（代替・保留）** | `Stamp Rally Green.dc.html` | グリーン `#17835D` 1 色 | よりミニマル・フラット。 |

> **実装は Street 案で進めてください。** Green 案は将来の方針転換・比較用の代替として保持しているもので、現時点で実装対象ではありません。

> 以降の詳細仕様は **Street 案**を基準に記載します。Green 案はアクセント色を緑系トークンに置き換えたもので、構造・レイアウト・タイポは共通です（対応表は末尾「Green 案の差分」を参照）。
> `*-print.dc.html` は全画面を 1 ページに並べた静的版（レビュー／印刷用）。実装の参照には影響しません。

---

## Design Tokens（Street 案）

### Colors
| トークン | 値 | 用途 |
|---------|-----|------|
| `--accent` | `#9C2A38` | アクセント（数値・リンク・進捗・強調文字） |
| `--accent-deep` | `#681622` | スタンプ内アイコン・濃いアクセント文字 |
| `--accent-soft` | `#F6E7EA` | アクティブナビ背景・淡いアクセント面 |
| `--accent-border` | `#E6C5CB` | アクセント系カードの枠線 |
| `--ink` | `#15161A` | 主要テキスト |
| `--muted` | `#6C6A6E` | 副次テキスト |
| `--faint` | `#A8A5A8` | 補助テキスト・未取得 |
| `--line` | `#E3E0DB` | 枠線・区切り線 |
| `--bg` | `#ECE9E4` | 統計タイルなどの面 |
| `--card` | `#FFFFFF` | カード背景 |
| `--red`（危険） | `#15161A` | 必須マーク `*`・削除文字（黒インク扱い） |
| `--red-border` | `#CCC9CB` | 削除ボタン枠線 |
| `--red-soft` | `#F1EFEA` | 削除ボタン hover 背景 |

### Gradients
| トークン | 値 |
|---------|-----|
| `--grad-accent`（ボタン） | `linear-gradient(180deg,#A63340 0%,#7A1E2B 100%)` |
| `--grad-soft`（称号カード） | `linear-gradient(165deg,#F8EBED 0%,#F1DBDF 100%)` |
| `--stamp-grad`（スタンプ面） | `radial-gradient(circle at 36% 26%,#FFFFFF 0%,#F6E8EB 46%,#E8C8CE 100%)` |
| 進捗バー fill | `linear-gradient(180deg,#A63340,#741C28)` |

### Shadows
| トークン | 値 |
|---------|-----|
| `--sh-btn` | `0 2px 6px rgba(90,16,26,.34), 0 7px 18px rgba(90,16,26,.22), inset 0 1px 0 rgba(255,255,255,.26)` |
| `--sh-card` | `0 1px 2px rgba(20,16,16,.06), 0 6px 18px rgba(20,16,16,.08)` |
| `--sh-stamp` | `0 5px 12px rgba(110,24,34,.22), inset 0 2px 4px rgba(255,255,255,.8), inset 0 -4px 7px rgba(110,26,36,.14)` |
| `--sh-phone`（端末枠） | `0 24px 60px rgba(20,16,16,.20), 0 6px 18px rgba(20,16,16,.10)` |

### Typography
- フォントファミリー: **`"Zen Kaku Gothic New"`**（Google Fonts, weights 400 / 500 / 700）、フォールバック `"Hiragino Sans", "Noto Sans JP", sans-serif`
- 主な使用サイズ（px）: 見出し `26 / 22 / 20 / 17`、本文 `15 / 14 / 13`、補助 `12 / 11`、ラベル `10`
- ウェイト: 700（見出し・強調・ボタン）/ 500（フォームラベル・副次）/ 400（本文）
- ラベルの字間: セクション小見出しは `letter-spacing: 0.08em`

### Spacing / Radius
- 角丸: スタンプ＝円形（`50%`）、カード＝`16px`、ボタン／入力＝`12px`、小ボタン／チップ＝`9px`、端末外枠＝`38px`、端末内画面＝`30px`
- 画面内パディング目安: 端末内コンテンツ `20–28px`、カード内 `14–18px`
- ボタン: 主要 `padding:14px` / フォントは 14–15px / 700

### スタンプ（重要モチーフ）
円形に `--stamp-grad` 背景＋`--sh-stamp` 影、内側に線画 SVG（音符アイコン）と日付（`M.D` 形式、例 `6.11`）。取得済みは `transform: rotate(-6deg)` で少し傾ける。未取得は背景透明＋`1.5px dashed var(--line)` ＋ `+` アイコン、傾きなし。

### アイコン
すべて **Lucide 風の線画 SVG**（`stroke="currentColor"`, `stroke-width:2`, round cap/join, fill:none）。絵文字は使用しない。使用アイコン: music（スタンプ）, award（称号）, qr-code, plus, check, user, lock, arrow-left, log-out, download, trash, pencil, alert-circle, map-pin。
> 実装では `lucide-react` 等の既存アイコンライブラリに置き換えるのが推奨。

---

## Screens / Views（全 11 画面）
端末モック内寸は **幅 382px / 高さ 760px**（内画面は角丸 30px のスクロール領域）。実装はレスポンシブなモバイル画面（max-width 約 420px 中央寄せ）として扱う。

各画面の完成イメージは `screenshots/street/`（メイン）および `screenshots/green/`（代替）に PNG で同梱しています（ファイル名は下記の画面名と対応）。

### 来場者フロー
1. **① ホーム** (`/`) — 中央にスタンプ円アイコン → タイトル「スタンプラリー」(26px/700) → サブ「ライブ来場デジタルスタンプ」→ 主要ボタン「スタンプ帳を見る」(grad-accent) → 補足文 → 区切り線下に控えめな「管理者ページ」リンク（faint 文字、hover で muted）。
2. **② ニックネーム登録** (`/event/[qr_token]/stamp` の初回) — user アイコン円 → 見出し「ニックネームを登録」(20px) → 中央寄せ input（max 20 文字、`{n}/20` カウンタ右寄せ）→ ボタン「スタンプ帳を作成する」。入力が空の間はボタン `disabled`。input focus 時は枠線 `--accent`。
3. **③ スタンプ取得中** — 中央にスピナー（`54px`, `3px` ボーダー、上端のみ `--accent`、`spin 0.8s linear infinite`）＋「スタンプ取得中...」。約 1.3 秒のローディング演出。
4. **④ スタンプ獲得** — `120px` のスタンプ円（rotate -6deg、内に music アイコン＋`M.D`）→「スタンプ獲得」(22px) → イベント名 → 会場・日時（`YYYY/MM/DD HH:mm`）→ 称号カード（grad-soft、進捗バー）→ ボタン「スタンプ帳を見る」→ 注記「同じライブのスタンプは1回のみ獲得できます」。
5. **④b 取得済み** — `120px` スタンプ円に check アイコン →「取得済みです」(20px, accent-deep) → 説明 → イベント名チップ → ボタン「スタンプ帳を見る」。同一ライブ重複時に表示。
6. **④c エラー** — グレー円に alert アイコン →「イベントが見つかりません」→ ボタン「トップへ戻る」。無効な `qr_token` 時。
7. **⑤ スタンプ帳** (`/stamp-book`) — 2 状態:
   - **参加者あり**: ヘッダー（アバター＝ニックネーム頭文字の円、名前、右に「獲得スタンプ」数値 22px/accent）→ 称号カード（award アイコン＋称号名＋`count / target`＋進捗バー＋「次の目標まで あと N 回」）→ 統計グリッド 2 列（総参加回数 / 獲得スタンプ、各 26px）→「ライブ一覧」見出し → ライブカードのリスト（取得済み＝スタンプ円＋`✓ YYYY/MM/DD 取得`、未取得＝破線円＋「未取得」）→ ボタン「QRを読み取ってスタンプ獲得」→ ゴーストボタン「端末の参加者情報をリセット」。
   - **参加者なし**: 空状態。スタンプ円＋「スタンプ帳」＋説明＋「QRを読み取る」＋「トップへ戻る」。

### 管理画面フロー（グレー地＋微細な斜めストライプ背景）
8. **⑥ 管理者ログイン** (`/admin/login`) — lock アイコン円 →「管理者ログイン」→ password input（中央寄せ）→ ボタン「ログイン」。`ADMIN_PASSWORD` で認証。
9. **⑦ ダッシュボード** (`/admin`) — 上部バー（`●管理画面` ＋ ログアウト）→ 統計グリッド 2 列（総スタンプ数 / 総参加者数、各 32px/accent）→「イベント一覧」見出し＋「＋新規作成」ボタン → イベントカードのリスト（タイトル、右に QR／編集ボタン、日付・会場、スタンプ取得数＝0 なら faint・1 以上は accent）。
10. **⑧ 新規イベント作成** (`/admin/events/new`) — 戻る矢印＋見出し → 白カード内フォーム（イベント名* / 開催日*（date）/ 会場名* / 説明（textarea）/「イベントを作成」ボタン）。`*` は必須。
11. **⑨ イベント編集** (`/admin/events/[id]/edit`) — 戻る矢印＋見出し → スタンプ取得数カード（grad-soft, 30px）→ QR コードカード（「表示する／閉じる」トグル → QR 画像＋ URL `https://stamp-rally.app/event/{token}/stamp`＋「QRコードをダウンロード」）→ 編集フォーム（同上＋「保存する」）→ 末尾に「このイベントを削除」ボタン（枠線＝red-border、hover で red-soft 背景）。

---

## Interactions & Behavior
- **ナビゲーション**: 各画面はルート遷移。プロトでは内部 state で切り替え。
- **ボタン押下**: `:active` で `transform: scale(0.98)`。
- **ボタン hover**: ゴースト／QR・編集ボタンは枠線・文字を accent 系へ。ナビ項目は背景 `#E6EAE6`、アクティブ項目は `--accent-soft` 背景＋accent-deep 文字＋700。
- **input focus**: 枠線を `--accent` に。
- **スタンプ取得演出**: QR 読み取り → ③ ローディング（約 1300ms）→ ④ 獲得 or ④b 取得済み。獲得スタンプには `stamp-pop` / `fade-up` のキーフレームを用意（`stamp-pop`: scale 0→1.08→1 ＆ rotate -15°→-6°）。
- **無効化**: ニックネーム未入力時は登録ボタン `disabled`。
- **確認ダイアログ**: イベント削除時に確認（`confirm('「{title}」を削除しますか？')`）。
- **QR ダウンロード**: 生成した QR 画像を `qr-{eventId}` としてダウンロード。
- **アコーディオン**: 編集画面の QR は表示／非表示トグル。

---

## State Management
プロトの内部 state（実装ではサーバー＋localStorage に対応付け）:
- `participant`（`{ participant_id, nickname }`）— **localStorage** に保存。存在判定で登録要否を分岐。
- `stamps` — 参加者の取得済みスタンプ一覧（`event_id`, `stamped_at`）。Supabase から取得。
- `screen` / ルート — 現在の画面。
- フォーム state（イベント作成・編集）。
- 管理ログイン状態（`ADMIN_PASSWORD` 照合、サーバー側 cookie 等）。

### 称号（実績）ロジック
参加回数 `count` に応じて称号と次目標を決定（プロト準拠）:
| count | 称号 | 次目標 |
|-------|------|--------|
| 1–4 | ライブデビュー | 5 回 |
| 5–9 | リピーター | 10 回 |
| 10–19 | 常連参加者 | 20 回 |
| 20+ | レジェンド参加者 | コンプリート |

進捗バー = `min(count / target * 100, 100)%`。
> 文言は案によって表記揺れあり（Green 案は「ライブデビュー → ライブ常連」等）。最終文言は実装前にプロダクト側と要確認。

---

## データモデル / API（既存コードベース）
`reference/types.ts` に TypeScript 型を同梱。Supabase スキーマ・ユーザーフローは元プロジェクトの `README.md` 参照。要点:
- **events**(id, title, event_date, venue, description, qr_token UNIQUE, created_at)
- **participants**(id, nickname, created_at)
- **event_stamps**(id, participant_id FK, event_id FK, stamped_at, **UNIQUE(participant_id, event_id)** ＝重複防止)
- フロー: QR → `/event/[qr_token]/stamp` → localStorage に participant があるか → なければニックネーム登録 → `event_stamps` に存在するか → なければ作成「獲得」／あれば「取得済み」。

---

## Assets
- フォント: Google Fonts「Zen Kaku Gothic New」(400/500/700)。
- アイコン: 線画 SVG（Lucide 相当）。実装では `lucide-react` 等に置換推奨。手描き不要。
- QR 画像: プロトはダミーの埋め込み画像。実装では `qrcode` 等で `qr_token` を含む URL から生成。
- 装飾画像なし（質感はグラデーション・影トークンで表現）。

---

## Green 案の差分（代替案を選ぶ場合）
構造・レイアウト・タイポ・余白は Street と共通。色トークンのみ差し替え:
| 役割 | Street | Green |
|------|--------|-------|
| accent | `#9C2A38` | `#17835D` |
| accent-deep | `#681622` | `#0E5C41` |
| accent-soft | `#F6E7EA` | `#E9F5EF` |
| accent-border | `#E6C5CB` | `#C5E4D5` |
| ink | `#15161A` | `#20241F` |
| bg | `#ECE9E4` | `#F5F7F5` |
| ボタングラデ | `#A63340→#7A1E2B` | `#1F9D70→#16805B` |
Green 案はより平面的（影・つやを抑える方向も可）。

---

## Files（このバンドル）
| ファイル | 内容 |
|---------|------|
| `Stamp Rally Street.dc.html` | **第一候補**デザイン。全 11 画面・インタラクティブ。 |
| `Stamp Rally Green.dc.html` | 代替（緑）デザイン。全 11 画面。 |
| `Stamp Rally Street-print.dc.html` | Street 全画面を 1 ページに並べた静的版（レビュー用）。 |
| `Stamp Rally Green-print.dc.html` | Green 全画面の静的版。 |
| `support.js` | `.dc.html` の実行に必要なランタイム（同フォルダに必須）。 |
| `reference/types.ts` | データモデルの TypeScript 型定義。 |
| `screenshots/street/*.png` | **Street 案**の全 9 主要画面の完成イメージ。 |
| `screenshots/green/*.png` | Green 案（代替）の全 9 主要画面の完成イメージ。 |

### 既存コードベース側の対応ファイル（参考）
リデザイン適用先（旧 UI を置き換える）: `app/page.tsx`, `app/stamp-book/page.tsx`, `app/event/[qr_token]/stamp/`, `app/admin/`（login, page, events/new, events/[id]/edit）, コンポーネント `StampCard.tsx`, `AchievementBadge.tsx`, `StampAcquired.tsx`, `NicknameForm.tsx`, `QRCodeDisplay.tsx`, `AdminLayout.tsx`, `globals.css`。
