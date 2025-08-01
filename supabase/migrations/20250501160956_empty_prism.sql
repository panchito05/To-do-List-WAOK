/*
  # Add order column to teams table

  1. Changes
    - Add order column to teams table if it doesn't exist
    - Create index for order column
    - Update existing teams with sequential order based on creation date
*/

-- Add order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'order'
  ) THEN
    ALTER TABLE teams ADD COLUMN "order" integer;
  END IF;
END $$;

-- Create index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'teams_order_idx'
  ) THEN
    CREATE INDEX teams_order_idx ON teams("order");
  END IF;
END $$;

-- Update existing teams with sequential order
WITH ordered_teams AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM teams
  WHERE "order" IS NULL
)
UPDATE teams
SET "order" = ordered_teams.row_num
FROM ordered_teams
WHERE teams.id = ordered_teams.id;