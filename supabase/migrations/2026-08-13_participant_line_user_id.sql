-- =====================================================
-- Migration: participants.line_user_id（LINEログインによる本人特定用）
-- LINEログイン連携で取得した userId(sub) を保持し、別端末・LINEアプリ内
-- ブラウザからのスタンプ帳復元と、将来のMessaging API配信の土台にする。
-- 列追加のみで後方互換。先にSQL→デプロイの順で無停止。
-- =====================================================

ALTER TABLE participants ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- 1 LINEアカウント = 1 participant（NULLはUNIQUE制約の対象外なので未連携多数でも問題なし）
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_line_user_id ON participants(line_user_id);
