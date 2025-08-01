/*
  # Initial Schema Setup

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `features` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `global_verifications`
      - `id` (text, primary key)
      - `timestamp` (bigint)
      - `team_id` (uuid)
      - `team_name` (text)
      - `feature_id` (bigint)
      - `feature_number` (integer)
      - `feature_name` (text)
      - `steps` (jsonb)
      - `comments` (jsonb)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (temporary until auth is implemented)
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create global_verifications table
CREATE TABLE IF NOT EXISTS global_verifications (
  id text PRIMARY KEY,
  timestamp bigint NOT NULL,
  team_id uuid REFERENCES teams(id),
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

-- Add temporary public access policies (will be replaced with proper auth policies later)
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