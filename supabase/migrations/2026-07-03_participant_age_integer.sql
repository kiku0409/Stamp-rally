-- ============================================================================
-- 参加者の年齢を INTEGER 化する移行（participants.age_group TEXT → age INTEGER）
--
-- ⚠️⚠️⚠️ 重要 ⚠️⚠️⚠️
-- 先に本番 Supabase SQL Editor でこのファイルを実行してから main へマージすること。
-- （このブランチのコードは INSERT/UPDATE/SELECT で age カラムを参照するため、
--   カラム未作成のままデプロイすると participants API が 500 になる）
-- ============================================================================

-- 1) age カラム追加（nullable）
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS age INTEGER;

COMMENT ON COLUMN participants.age IS '実年齢（整数）。age_group TEXT からの移行先';

-- 2) backfill: 数値文字列（新形式 "25" 等）のみ変換。
--    旧形式「20代」等は数値を推測せず age は NULL のまま残す（表示は age_group にフォールバック）。
UPDATE participants
SET age = age_group::integer
WHERE age_group ~ '^[0-9]+$' AND age IS NULL;

-- 3) age_group カラムは削除しない。
--    レガシー表示フォールバック（「20代」等の表示・CSV出力）がまだ読むため残置する。
--    DROP COLUMN は全コードが age のみを参照するようになった後の後続クリーンアップで行うこと。
COMMENT ON COLUMN participants.age_group IS '[DEPRECATED] 旧形式の年齢文字列（例: "25", "20代"）。読み取りフォールバック用に残置。移行完了後に削除予定';
