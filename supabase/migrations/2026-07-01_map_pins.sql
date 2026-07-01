-- Migration: events テーブルにマップピン位置情報カラムを追加
-- map_x / map_y はマップ画像上のパーセント座標（0〜100）

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS map_x     NUMERIC,
  ADD COLUMN IF NOT EXISTS map_y     NUMERIC,
  ADD COLUMN IF NOT EXISTS map_label TEXT,
  ADD COLUMN IF NOT EXISTS map_color TEXT;
