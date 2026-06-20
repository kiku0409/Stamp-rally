-- =====================================================
-- Migration: 特典引き換え（redeem_code/redeemed_at/redeemed_by）＋ 却下理由（reject_reason）
-- 列追加のみ。DBデフォルトで旧コードの付与も自動採番（無停止）。先にSQL→デプロイ。
-- =====================================================

-- participant_rewards: 引き換え用
ALTER TABLE participant_rewards ADD COLUMN IF NOT EXISTS redeem_code TEXT;
ALTER TABLE participant_rewards ALTER COLUMN redeem_code SET DEFAULT upper(substr(md5(random()::text), 1, 10));
UPDATE participant_rewards SET redeem_code = upper(substr(md5(random()::text || id::text), 1, 10)) WHERE redeem_code IS NULL;
ALTER TABLE participant_rewards ALTER COLUMN redeem_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_rewards_redeem_code ON participant_rewards(redeem_code);

ALTER TABLE participant_rewards ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE participant_rewards ADD COLUMN IF NOT EXISTS redeemed_by UUID REFERENCES auth.users(id);

-- projects: 却下理由
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reject_reason TEXT;
