/*
  # Fix Support Tickets - Allow Admins to Create Tickets

  1. Changes
    - Add policy to allow admins/super_admins to create support tickets for any customer
    - This enables customer service representatives to create tickets on behalf of customers

  2. Security
    - Only authenticated users with admin role can create tickets for others
    - Customers can still create their own tickets
*/

-- Drop existing policy if it exists to recreate
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'support_tickets' 
    AND policyname = 'Admins can create tickets for customers'
  ) THEN
    DROP POLICY "Admins can create tickets for customers" ON support_tickets;
  END IF;
END $$;

-- Allow admins to create support tickets for any customer
CREATE POLICY "Admins can create tickets for customers"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_ctx());
