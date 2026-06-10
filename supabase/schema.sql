-- =====================================================
-- Stamp Rally App - Supabase Schema
-- =====================================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  event_date  DATE NOT NULL,
  venue       TEXT NOT NULL,
  description TEXT,
  qr_token    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
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

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stamps  ENABLE ROW LEVEL SECURITY;

-- Events: public read, service role write
CREATE POLICY "events_select_public"
  ON events FOR SELECT USING (true);

CREATE POLICY "events_all_service"
  ON events FOR ALL USING (auth.role() = 'service_role');

-- Participants: service role only
CREATE POLICY "participants_all_service"
  ON participants FOR ALL USING (auth.role() = 'service_role');

-- Event stamps: service role only
CREATE POLICY "event_stamps_all_service"
  ON event_stamps FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Sample data (optional)
-- =====================================================

-- INSERT INTO events (title, event_date, venue, description)
-- VALUES
--   ('東京公演 2026', '2026-07-01', 'Zepp Tokyo', '夏の東京ライブ！'),
--   ('横浜公演 2026', '2026-07-08', 'YOKOHAMA ARENA', '横浜でお会いしましょう'),
--   ('名古屋公演 2026', '2026-07-15', 'Zepp Nagoya', '名古屋の熱いファンへ');
