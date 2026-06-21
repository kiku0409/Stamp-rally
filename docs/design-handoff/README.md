# デザイン仕様（現行実装）

最終更新: 2026-06-21

現在本番稼働中のスタンプラリーアプリのデザイン仕様です。
実装済みのカラートークン・タイポグラフィ・アニメーション・コンポーネントスタイルをまとめています。

---

## テーマ概要

- **アクセントカラー**: ターコイズ系（`#0A938C`）
- **デザインモチーフ**: チケット半券風カード、デジタルスタンプ
- **フォント**: Zen Kaku Gothic New（本文）＋ Roboto Mono（復元コード等）
- **アイコン**: lucide-react（線画SVG）

---

## カラートークン（`app/globals.css` @theme）

| トークン（Tailwind） | 値 | 用途 |
|---|---|---|
| `accent` | `#0A938C` | アクセント全般（ボタン・進捗・強調） |
| `accent-deep` | `#07615C` | 濃いアクセント（アイコン・深色） |
| `accent-text` | `#0A7A74` | アクセント文字色 |
| `soft` | `#EAF6F5` | アクセント系の淡い面 |
| `teal-border` | `#ACDAD8` | アクセント系カードの枠線 |
| `screen-bg` | `#F1F8F7` | 画面背景 |
| `track` | `#D8EEED` | 進捗バー背景 |
| `ink` | `#17302E` | 主要テキスト |
| `muted` | `#5A7B74` | 副次テキスト |
| `faint` | `#8DA8A5` | 補助テキスト・未取得 |
| `line` | `#DCE8E6` | 枠線・区切り線 |
| `danger` | `#C2463B` | 危険操作（削除等） |
| `danger-border` | `#E7C3BE` | 削除ボタン枠線 |
| `danger-soft` | `#FBF1F0` | 削除ボタンhover背景 |

---

## グラデーション・シャドウ（CSS クラス）

| クラス名 | 値 | 用途 |
|---|---|---|
| `.btn-brand` | `linear-gradient(180deg, #1E9C95 0%, #087A74 100%)` + shadow | 主要ボタン |
| `.stamp-face` | `radial-gradient(circle at 36% 26%, #FFF 0%, #E2F2F1 46%, #98D2CF 100%)` + shadow | 取得済みスタンプ円 |
| `.bg-grad-soft` | `linear-gradient(165deg, #EDFAF8 0%, #DBF1EE 100%)` | 復元コード・特典カード背景 |
| `.header-grad` | `linear-gradient(160deg, #17A399 0%, #076B63 100%)` | ページヘッダー背景 |
| `.progress-grad` | `linear-gradient(180deg, #19A99F, #0A7E77)` | 進捗バーfill |
| `.card-shadow` | `0 1px 2px rgba(7,60,56,.05), 0 6px 18px rgba(7,60,56,.07)` | 白カード影 |
| `.admin-bg` | `#F1F8F7` | 管理者画面背景 |

---

## タイポグラフィ

- **フォント**: `Zen Kaku Gothic New`（400 / 500 / 700）、フォールバック `sans-serif`
- **等幅**: `Roboto Mono`（400 / 500）— 復元コード表示に使用（`var(--font-mono)`）
- **主な使用サイズ（px）**: 見出し `22 / 20 / 17`、本文 `15 / 14 / 13`、補助 `12 / 11`、ラベル `10`
- **ウェイト**: 700（見出し・強調・ボタン）/ 500（フォームラベル）/ 400（本文）

---

## アニメーション

| クラス名 | キーフレーム | 用途 |
|---|---|---|
| `.animate-stamp-pop` | scale 0→1.08→1 & rotate -15°→-8°→-6°、0.45s ease-out | スタンプ取得演出 |
| `.animate-fade-up` | opacity 0→1 & translateY 12px→0、0.35s ease-out | テキスト・カードのフェードイン |

---

## スタンプ

- **取得済み**: 円形（`50%`）、`.stamp-face` 背景＋影、内側に lucide アイコン＋日付（`M.D` 形式）、`rotate(-6deg)` で傾き
- **未取得**: 背景透明＋`border-dashed`（`line`色）＋`+` アイコン、傾きなし
- **取得演出**: `.animate-stamp-pop` → `.animate-fade-up` で詳細情報フェードイン

---

## 主要コンポーネント

| ファイル | 役割 |
|---|---|
| `app/page.tsx` | ホーム（スタンプ帳へのエントリー） |
| `app/stamp-book/page.tsx` | スタンプ帳（プロジェクト単位グルーピング、特典表示） |
| `app/profile/page.tsx` | ユーザー情報・ニックネーム編集・復元コード表示 |
| `app/event/[qr_token]/stamp/page.tsx` | QR読み取り後のスタンプ取得画面 |
| `components/StampCard.tsx` | スタンプ1枚分のUI |
| `components/StampAcquired.tsx` | スタンプ獲得演出コンポーネント |
| `components/RewardTicketModal.tsx` | 特典チケットのモーダル（QR・引換済表示） |
| `components/NicknameForm.tsx` | ニックネーム登録フォーム |
| `components/QRScanner.tsx` | QRスキャナー（`@zxing/browser`） |
| `components/QRCodeDisplay.tsx` | QRコード生成表示（`qrcode`） |
| `components/AdminLayout.tsx` | 管理者画面共通レイアウト |

---

## 画面一覧（現行実装）

### 来場者フロー
1. **ホーム** `/` — スタンプ帳へのエントリー
2. **ニックネーム登録** `/event/[qr_token]/stamp`（初回） — NicknameForm
3. **スタンプ取得中** — ローディングスピナー（accent色、約1.3秒演出）
4. **スタンプ獲得** — stamp-pop アニメ、イベント名・日時、特典進捗
5. **取得済み** — check アイコン、「取得済みです」
6. **スタンプ帳** `/stamp-book` — プロジェクト単位グルーピング、特典チケット一覧
7. **プロフィール** `/profile` — ニックネーム編集、復元コード表示、リセット

### 管理者フロー
8. **ログイン** `/admin/login`
9. **プロジェクト一覧** `/admin` — プロジェクト申請・参加コード入力
10. **プロジェクト申請** `/admin/projects/new`
11. **プロジェクト詳細** `/admin/projects/[id]` — イベント・特典段階・取得者・メンバー管理
12. **イベント作成** `/admin/events/new`
13. **イベント編集** `/admin/events/[id]`
14. **特典引き換え** `/admin/redeem` — QRスキャン or コード入力
15. **スーパー管理者** `/admin/super` — プロジェクト承認/却下

---

## スクリーンショット

`screenshots/` 配下のPNGは旧デザイン案（Street/Green）のもので、現行UIとは異なります。
現行UIの確認は本番URL（https://stamp-rally-kappa.vercel.app）を参照してください。
