/*
  # Fix notifications type constraint for support tickets
  
  Add 'support_ticket' to allowed notification types
*/

-- Drop existing constraint (there are duplicates)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with support_ticket included
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['order'::text, 'promo'::text, 'system'::text, 'support_ticket'::text]));
