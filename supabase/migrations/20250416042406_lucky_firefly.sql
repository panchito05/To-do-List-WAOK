/*
  # Add files support to notes table

  1. Changes
    - Add files column to notes table to store file metadata
    - Create index on the files column for better query performance
*/

-- Add files column to notes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'files'
  ) THEN
    ALTER TABLE notes ADD COLUMN files jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index for the files column
CREATE INDEX IF NOT EXISTS notes_files_idx ON notes USING gin (files);