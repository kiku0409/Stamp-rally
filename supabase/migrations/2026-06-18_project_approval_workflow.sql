-- =====================================================
-- Migration: events.admin_id → projects / project_members
-- 実行タイミング: このマイグレーションと対応コードのデプロイは同時に行うこと。
-- 旧コード（admin_id 参照）が動いている間に events.admin_id を消すと壊れるため。
-- =====================================================

-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- 2. RLS
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_all_service"        ON projects        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "project_members_all_service" ON project_members FOR ALL USING (auth.role() = 'service_role');

-- 3. 既存イベント移行用のデフォルトプロジェクトをスーパー管理者で作成
--    （<super_uid> = dee565bd-ba21-44a3-bd54-7aa1745b0600）
WITH p AS (
  INSERT INTO projects (name, description, status, created_by, approved_by, approved_at)
  VALUES ('既存イベント', '移行前に作成されたイベント', 'approved',
          'dee565bd-ba21-44a3-bd54-7aa1745b0600',
          'dee565bd-ba21-44a3-bd54-7aa1745b0600', NOW())
  RETURNING id
)
INSERT INTO project_members (project_id, user_id, role)
SELECT id, 'dee565bd-ba21-44a3-bd54-7aa1745b0600', 'owner' FROM p;

-- 4. events に project_id を追加し、既存イベントをデフォルトプロジェクトへ紐付け
ALTER TABLE events ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
UPDATE events
SET project_id = (SELECT id FROM projects WHERE name = '既存イベント' ORDER BY created_at LIMIT 1)
WHERE project_id IS NULL;
ALTER TABLE events ALTER COLUMN project_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);

-- 5. 旧カラム削除
ALTER TABLE events DROP COLUMN IF EXISTS admin_id;
