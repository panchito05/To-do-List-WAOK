/*
  # Chat System Implementation
  
  1. New Tables
    - `chat_rooms` - Stores all chat rooms/channels
    - `chat_messages` - Stores all messages
    - `chat_users` - Stores user info and permissions
    - `chat_room_users` - Maps users to rooms they can access
  
  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access controls
    
  3. Features
    - Real-time messaging
    - User permissions and roles
    - Admin controls for moderation
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chat_rooms_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create chat_users table
CREATE TABLE IF NOT EXISTS chat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  is_admin boolean DEFAULT false,
  is_moderator boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chat_users_username_not_empty CHECK (length(trim(username)) > 0),
  CONSTRAINT chat_users_display_name_not_empty CHECK (length(trim(display_name)) > 0)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- Create chat_room_users table (mapping table for room members)
CREATE TABLE IF NOT EXISTS chat_room_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false, -- Room-specific admin
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_room_users_room_id_idx ON chat_room_users(room_id);
CREATE INDEX IF NOT EXISTS chat_room_users_user_id_idx ON chat_room_users(user_id);

-- Enable RLS on all tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_users ENABLE ROW LEVEL SECURITY;

-- Add policies for public access (temporary - should be replaced with proper auth)
CREATE POLICY "Allow public access to chat_rooms" ON chat_rooms FOR ALL TO public USING (true);
CREATE POLICY "Allow public access to chat_users" ON chat_users FOR ALL TO public USING (true);
CREATE POLICY "Allow public access to chat_messages" ON chat_messages FOR ALL TO public USING (true);
CREATE POLICY "Allow public access to chat_room_users" ON chat_room_users FOR ALL TO public USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_users_updated_at
  BEFORE UPDATE ON chat_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a default General chat room
INSERT INTO chat_rooms (name, description, is_private) 
VALUES ('General', 'General discussion channel for all users', false)
ON CONFLICT DO NOTHING;