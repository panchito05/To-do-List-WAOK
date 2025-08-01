/*
  # Add step media support
  
  1. New Tables
    - `step_media`
      - `id` (uuid, primary key)
      - `step_id` (bigint)
      - `team_id` (bigint)
      - `feature_id` (bigint)
      - `type` (text - photo/video)
      - `url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Storage
    - Create step-media bucket
    - Add public access policy
  
  3. Security
    - Enable RLS
    - Add public access policy
*/

-- Drop existing objects to ensure clean state
DROP TABLE IF EXISTS step_media CASCADE;
DROP POLICY IF EXISTS "Allow public access to step-media storage" ON storage.objects;

-- Create step_media table
CREATE TABLE step_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id bigint NOT NULL,
  team_id bigint NOT NULL,
  feature_id bigint NOT NULL,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT step_media_url_not_empty CHECK (length(trim(url)) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS step_media_step_id_idx ON step_media(step_id);
CREATE INDEX IF NOT EXISTS step_media_team_id_idx ON step_media(team_id);
CREATE INDEX IF NOT EXISTS step_media_feature_id_idx ON step_media(feature_id);
CREATE INDEX IF NOT EXISTS step_media_type_idx ON step_media(type);

-- Enable RLS
ALTER TABLE step_media ENABLE ROW LEVEL SECURITY;

-- Add public access policy
CREATE POLICY "Allow public access to step_media"
  ON step_media
  FOR ALL
  TO public
  USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('step-media', 'step-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for step-media bucket
CREATE POLICY "Allow public access to step-media storage"
  ON storage.objects
  FOR ALL
  TO public
  USING (bucket_id = 'step-media');

-- Add updated_at trigger
CREATE TRIGGER update_step_media_updated_at
  BEFORE UPDATE ON step_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();