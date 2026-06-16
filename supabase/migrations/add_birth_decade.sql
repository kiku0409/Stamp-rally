-- Add birth_decade column to existing participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS birth_decade TEXT;
