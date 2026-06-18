-- =====================================================
-- Stamp Rally App - Supabase Schema
-- =====================================================
-- 認証は Supabase Auth（email + password）。管理者はセルフ登録し、
-- プロジェクト単位で承認ワークフローを通して運用する。
--   projects        … フェス/連続ライブ等のまとまり。承認制。
--   project_members … プロジェクトに所属する管理者（owner/member）。
--   events          … スタンプ帳。プロジェクトに属する。

-- Projects table
-- status: pending（申請中）/ approved（承認済）/ rejected（却下）
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

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Events table
-- project_id: 所属プロジェクト。プロジェクトの承認済みメンバーが編集できる。
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  event_date  DATE NOT NULL,
  venue       TEXT NOT NULL,
  description TEXT,
  qr_token    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participants table (no auth required)
CREATE TABLE IF NOT EXISTS participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event stamps table
CREATE TABLE IF NOT EXISTS event_stamps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stamped_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_stamps_participant ON event_stamps(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_stamps_event      ON event_stamps(event_id);
CREATE INDEX IF NOT EXISTS idx_events_qr_token         ON events(qr_token);
CREATE INDEX IF NOT EXISTS idx_events_project          ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON project_members(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- API はすべて service_role 経由でアクセスするため、書き込みは service_role に限定。
-- =====================================================

ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stamps    ENABLE ROW LEVEL SECURITY;

-- Projects / members: service role only
CREATE POLICY "projects_all_service"        ON projects        FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "project_members_all_service" ON project_members FOR ALL USING (auth.role() = 'service_role');

-- Events: public read（来場者がQRからイベント情報を取得）, service role write
CREATE POLICY "events_select_public" ON events FOR SELECT USING (true);
CREATE POLICY "events_all_service"   ON events FOR ALL    USING (auth.role() = 'service_role');

-- Participants / event stamps: service role only
CREATE POLICY "participants_all_service" ON participants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "event_stamps_all_service" ON event_stamps FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- スーパー管理者の作成
-- =====================================================
-- Authentication → Users で管理者ユーザーを作成後、その UID に対して実行：
--
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
-- WHERE id = '<UID>';
