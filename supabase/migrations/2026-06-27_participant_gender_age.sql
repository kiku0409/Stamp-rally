-- 参加者に性別・年代フィールドを追加（任意）
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS gender    TEXT CHECK (gender    IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('10s', '20s', '30s', '40s', '50s+'));
