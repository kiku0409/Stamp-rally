-- =====================================================
-- Migration: projects.join_code（シリアルコード参加用）
-- 列追加は後方互換（旧コードは join_code を無視）なので、先にSQL→デプロイの順で安全。
-- =====================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS join_code TEXT;

-- 既存行にランダムな8桁コードをバックフィル
UPDATE projects
SET join_code = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE join_code IS NULL;

ALTER TABLE projects ALTER COLUMN join_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_join_code ON projects(join_code);
