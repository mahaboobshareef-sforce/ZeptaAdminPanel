/*
  # Add Super Admin Role to User System

  1. Changes
    - Add 'super_admin' value to user_role enum type
    - This enables role-based access control with Super Admin having full access
    - Regular Admin will have restricted access to:
      * Purchase Management
      * Inventory Adjustments
      * Payments
      * Refunds
      * Profit Analysis
  
  2. Notes
    - Existing admin users remain as 'admin' role
    - You can manually promote an admin to super_admin using:
      UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
    - This is a non-breaking change - all existing functionality continues to work
*/

-- Add super_admin to the user_role enum (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' 
    AND t.oid = 17776
    AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;