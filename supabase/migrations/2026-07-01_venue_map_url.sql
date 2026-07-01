-- projects.venue_map_url がコード上は参照されているが実DBに存在せず、
-- 会場マップ画像の保存が "column projects.venue_map_url does not exist" で
-- 常に失敗していた（フロント側でPUTのエラーチェック漏れのため無反応に見えた）。
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_map_url TEXT;
