/*
  # Schema Update
  
  1. Changes
    - Update teams table to use bigint IDs instead of UUID
    - Update global_verifications table to reference bigint team_id
*/

-- Drop existing tables and dependencies
DROP TABLE IF EXISTS global_verifications;
DROP TABLE IF EXISTS teams;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create global_verifications table
CREATE TABLE IF NOT EXISTS global_verifications (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL,
  team_id bigint REFERENCES teams(id),
  team_name text NOT NULL,
  feature_id bigint NOT NULL,
  feature_number integer NOT NULL,
  feature_name text NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

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