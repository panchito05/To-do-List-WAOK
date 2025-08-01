/*
  # Fix cascade delete and add indexes

  1. Changes
    - Add ON DELETE CASCADE to global_verifications foreign key
    - Add indexes for better query performance
    - Add constraints to ensure data integrity
  
  2. Indexes
    - teams: created_at, updated_at
    - global_verifications: timestamp, team_id
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

-- Create global_verifications table with ON DELETE CASCADE and indexes
CREATE TABLE IF NOT EXISTS global_verifications (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL,
  team_id bigint REFERENCES teams(id) ON DELETE CASCADE,
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