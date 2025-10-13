/*
  # Create User Settings Table

  1. New Tables
    - user_settings: Stores user-specific application settings
      - id (uuid, primary key): Unique identifier
      - user_id (uuid, foreign key): References users table
      - notification_email (boolean): Email notifications enabled
      - notification_sms (boolean): SMS notifications enabled
      - notification_push (boolean): Push notifications enabled
      - notification_order_updates (boolean): Order update notifications
      - notification_marketing (boolean): Marketing email notifications
      - timezone (text): User preferred timezone
      - currency (text): User preferred currency
      - language (text): User preferred language
      - date_format (text): User preferred date format
      - items_per_page (integer): Items per page preference
      - dark_mode (boolean): Dark mode enabled
      - auto_refresh (boolean): Auto-refresh data enabled
      - created_at (timestamptz): Record creation timestamp
      - updated_at (timestamptz): Record last update timestamp

  2. Security
    - Enable RLS on user_settings table
    - Users can read their own settings
    - Users can insert their own settings
    - Users can update their own settings

  3. Notes
    - Each user has one settings record
    - Unique constraint on user_id
    - Default values provided
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification preferences
  notification_email boolean DEFAULT true,
  notification_sms boolean DEFAULT false,
  notification_push boolean DEFAULT true,
  notification_order_updates boolean DEFAULT true,
  notification_marketing boolean DEFAULT false,
  
  -- System preferences
  timezone text DEFAULT 'Asia/Kolkata',
  currency text DEFAULT 'INR',
  language text DEFAULT 'en',
  date_format text DEFAULT 'DD/MM/YYYY',
  items_per_page integer DEFAULT 20,
  
  -- UI preferences
  dark_mode boolean DEFAULT false,
  auto_refresh boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();