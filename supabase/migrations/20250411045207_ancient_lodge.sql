/*
  # Add Media Storage Support

  1. New Tables
    - `step_media`
      - `id` (uuid, primary key)
      - `step_id` (bigint)
      - `team_id` (bigint)
      - `feature_id` (bigint)
      - `type` (text) - 'photo' or 'video'
      - `url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create bucket for step media files
    - Set up storage policies

  3. Security
    - Enable RLS
    - Add policies for public access (temporary)
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public access to step_media" ON step_media;
  DROP POLICY IF EXISTS "Allow public access to step-media storage" ON storage.objects;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Create step_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS step_media (
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

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'step_media_step_id_idx') THEN
    CREATE INDEX step_media_step_id_idx ON step_media(step_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'step_media_team_id_idx') THEN
    CREATE INDEX step_media_team_id_idx ON step_media(team_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'step_media_feature_id_idx') THEN
    CREATE INDEX step_media_feature_id_idx ON step_media(feature_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'step_media_type_idx') THEN
    CREATE INDEX step_media_type_idx ON step_media(type);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE step_media ENABLE ROW LEVEL SECURITY;

-- Add temporary public access policy
CREATE POLICY "Allow public access to step_media"
  ON step_media
  FOR ALL
  TO public
  USING (true);

-- Create storage bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('step-media', 'step-media', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for step-media bucket
DO $$
BEGIN
  CREATE POLICY "Allow public access to step-media storage"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'step-media');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_step_media_updated_at'
  ) THEN
    CREATE TRIGGER update_step_media_updated_at
      BEFORE UPDATE ON step_media
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;