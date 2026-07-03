-- SCHEMA-001 対応: projects.theme_id を本番DBの実態（NOT NULL）に合わせる
--
-- 背景: 本番DBでは theme_id が NOT NULL だが、schema.sql は nullable と記載されており
-- 乖離していた（2026-07-03 E2Eテスト整備中に発覚。BUGS.md SCHEMA-001）。
-- このマイグレーションは fresh セットアップ時に本番と同じ制約を再現するためのもの。
-- 本番には既に NOT NULL が付いているため、本番で実行しても無害（冪等）。

ALTER TABLE projects ALTER COLUMN theme_id SET DEFAULT 'teal';
UPDATE projects SET theme_id = 'teal' WHERE theme_id IS NULL;
ALTER TABLE projects ALTER COLUMN theme_id SET NOT NULL;
