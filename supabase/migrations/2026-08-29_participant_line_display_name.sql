-- =====================================================
-- Migration: participants.line_display_name（LINE表示名を管理者CSVで見せる用）
-- LINEログイン時に id_token の name（LINE表示名）を保存する。
-- 先方要望: スタンプ取得者CSVに「LINE連携」「LINE表示名」列を出す。
-- 表示名は本人がLINE上で自由に変更できるため本名とは限らない。連携/復元のたびに最新値で上書き。
-- 列追加のみで後方互換。先にSQL→デプロイの順で無停止。
-- =====================================================

ALTER TABLE participants ADD COLUMN IF NOT EXISTS line_display_name TEXT;

COMMENT ON COLUMN participants.line_display_name IS 'LINE表示名（LINEログイン時のid_token name）。連携/復元のたびに更新。未連携は NULL';
