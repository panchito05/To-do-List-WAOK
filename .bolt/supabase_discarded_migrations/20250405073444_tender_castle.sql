/*
  # Remove foreign key constraint from global_verifications

  1. Changes
    - Remove foreign key constraint from global_verifications table
    - This allows keeping verification history even after a team is deleted
    - team_id becomes a regular bigint column
*/

-- Drop existing foreign key constraint
ALTER TABLE global_verifications DROP CONSTRAINT IF EXISTS global_verifications_team_id_fkey;

-- Modify team_id column to be a regular bigint
ALTER TABLE global_verifications ALTER COLUMN team_id TYPE bigint;

-- Add index on team_id for better query performance
CREATE INDEX IF NOT EXISTS global_verifications_team_id_idx ON global_verifications(team_id);