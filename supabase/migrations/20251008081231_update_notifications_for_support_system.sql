/*
  # Update Notifications Table for Support System

  ## Overview
  Adds reference tracking columns to notifications table to properly link notifications
  to their source entities (tickets, orders, etc.)

  ## Changes
  1. Add `reference_id` column - UUID to link to the related entity
  2. Add `reference_type` column - Text to identify the entity type (ticket, order, etc.)

  ## Security
  - No changes to existing RLS policies
  - Maintains backward compatibility with existing notifications
*/

-- Add reference columns to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_type text;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;