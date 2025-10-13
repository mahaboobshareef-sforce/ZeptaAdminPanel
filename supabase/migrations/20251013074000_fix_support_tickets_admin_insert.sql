/*
  # Fix support_tickets INSERT policy for admin
  
  Admin should be able to create tickets for any customer
*/

DROP POLICY IF EXISTS "Admins can create tickets for customers" ON support_tickets;

CREATE POLICY "Admins can create tickets for customers"
  ON support_tickets FOR INSERT
  WITH CHECK (
    is_admin_ctx() OR 
    customer_id = auth.uid()
  );
