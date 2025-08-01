/*
  # Add notes table

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `content` (text)
      - `updated_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policy for public access (temporary)
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to notes"
  ON notes
  FOR ALL
  TO public
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();