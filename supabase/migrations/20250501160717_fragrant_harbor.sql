/*
  # Add team ordering support
  
  1. Changes
    - Add `order` column to teams table
    - Add index for better query performance
    - Update existing teams with sequential order
*/

-- Add order column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS "order" integer;

-- Create index for order column
CREATE INDEX IF NOT EXISTS teams_order_idx ON teams("order");

-- Update existing teams with sequential order
WITH ordered_teams AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM teams
)
UPDATE teams
SET "order" = ordered_teams.row_num
FROM ordered_teams
WHERE teams.id = ordered_teams.id;