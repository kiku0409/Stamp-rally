-- =====================================================
-- Migration: 特典段階（project_reward_tiers）＋付与記録（participant_rewards）
-- 新規テーブルのみ。既存列変更なし＝後方互換で無停止（先にSQL→デプロイの順でOK）。
-- =====================================================

CREATE TABLE IF NOT EXISTS project_reward_tiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  threshold  INT NOT NULL CHECK (threshold > 0),
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, threshold)
);

CREATE TABLE IF NOT EXISTS participant_rewards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  tier_id        UUID NOT NULL REFERENCES project_reward_tiers(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, tier_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_tiers_project            ON project_reward_tiers(project_id);
CREATE INDEX IF NOT EXISTS idx_participant_rewards_participant ON participant_rewards(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_rewards_project     ON participant_rewards(project_id);

ALTER TABLE project_reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_rewards  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reward_tiers_all_service"        ON project_reward_tiers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "participant_rewards_all_service" ON participant_rewards  FOR ALL USING (auth.role() = 'service_role');
