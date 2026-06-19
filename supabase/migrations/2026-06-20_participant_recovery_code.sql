-- =====================================================
-- Migration: participants.recovery_code（別端末からの復元用）
-- 列追加は後方互換（DBデフォルトで旧コードの作成も自動採番）。先にSQL→デプロイの順で無停止。
-- =====================================================

ALTER TABLE participants ADD COLUMN IF NOT EXISTS recovery_code TEXT;

-- デプロイ完了までの間、旧コード（recovery_code を渡さない）での作成も失敗しないよう
-- DBデフォルトで自動採番しておく（新コードは自前のコードを渡す）
ALTER TABLE participants ALTER COLUMN recovery_code SET DEFAULT upper(substr(md5(random()::text), 1, 12));

-- 既存行をバックフィル
UPDATE participants
SET recovery_code = upper(substr(md5(random()::text || id::text), 1, 12))
WHERE recovery_code IS NULL;

ALTER TABLE participants ALTER COLUMN recovery_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_recovery_code ON participants(recovery_code);
