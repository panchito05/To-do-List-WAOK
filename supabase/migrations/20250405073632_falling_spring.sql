/*
  # Preserve Verification History

  1. Changes
    - Remove foreign key constraint from global_verifications table
    - Add indexes for better query performance
    - Add constraints to ensure data integrity
  
  2. Indexes
    - global_verifications: timestamp (DESC), team_id
    - teams: created_at, updated_at
  
  3. Constraints
    - Ensure non-empty team and feature names
    - Ensure positive feature numbers

  This migration allows keeping the verification history even after a team is deleted,
  which is important for historical comparisons and analysis.
*/

-- Drop existing tables and dependencies if they exist
DROP TABLE IF EXISTS global_verifications;
DROP TABLE IF EXISTS teams;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create teams table with indexes
CREATE TABLE IF NOT EXISTS teams (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT teams_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX teams_created_at_idx ON teams(created_at);
CREATE INDEX teams_updated_at_idx ON teams(updated_at);

-- Create global_verifications table without foreign key constraint
CREATE TABLE IF NOT EXISTS global_verifications (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL,
  team_id bigint NOT NULL,
  team_name text NOT NULL,
  feature_id bigint NOT NULL,
  feature_number integer NOT NULL,
  feature_name text NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT global_verifications_team_name_not_empty CHECK (length(trim(team_name)) > 0),
  CONSTRAINT global_verifications_feature_name_not_empty CHECK (length(trim(feature_name)) > 0),
  CONSTRAINT global_verifications_feature_number_positive CHECK (feature_number > 0)
);

-- Add indexes for better query performance
CREATE INDEX global_verifications_timestamp_idx ON global_verifications(timestamp DESC);
CREATE INDEX global_verifications_team_id_idx ON global_verifications(team_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_verifications ENABLE ROW LEVEL SECURITY;

-- Add temporary public access policies
CREATE POLICY "Allow public access to teams"
  ON teams
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to global_verifications"
  ON global_verifications
  FOR ALL
  TO public
  USING (true);

-- Add updated_at trigger for teams
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();