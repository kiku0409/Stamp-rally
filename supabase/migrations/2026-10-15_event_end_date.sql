-- =====================================================
-- Migration: events.end_date（複数日開催イベントの終了日）
-- 2日間通しのイベント等で、スタンプ表示を「10/17–18」のような期間表記にするため。
-- NULL = 単日開催（従来どおり event_date のみ表示）。
-- スタンプ取得の可否には使わない（取得は従来どおり日付制限なし）。
-- 列追加のみで後方互換。先にSQL→デプロイの順で無停止。
-- =====================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_end_date_check;
ALTER TABLE events ADD CONSTRAINT events_end_date_check CHECK (end_date IS NULL OR end_date >= event_date);

COMMENT ON COLUMN events.end_date IS '複数日開催の終了日。NULL は単日開催（event_date のみ）';
