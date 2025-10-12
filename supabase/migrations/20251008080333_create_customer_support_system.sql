/*
  # Customer Support & Issue Management System

  ## Overview
  Comprehensive system for handling customer complaints about damaged, spoiled, or incorrect orders.
  Enables full communication tracking, evidence collection, and resolution management.

  ## 1. New Tables

  ### `support_tickets`
  Main table for tracking all customer issues and complaints
  - `id` - Unique ticket identifier
  - `ticket_number` - Human-readable ticket number (e.g., "TKT-2024-00001")
  - `order_id` - Reference to the problematic order
  - `customer_id` - Customer who raised the issue
  - `issue_type` - Type of complaint (damaged, spoiled, missing, wrong_item, etc.)
  - `priority` - Urgency level (low, medium, high, critical)
  - `status` - Current state (open, in_progress, resolved, closed)
  - `subject` - Brief description
  - `description` - Detailed issue description
  - `resolution_type` - How it was resolved (refund, replacement, compensation, etc.)
  - `resolution_notes` - Admin notes on resolution
  - `resolved_by` - Admin who resolved the ticket
  - `resolved_at` - When it was resolved
  - Timestamps

  ### `ticket_messages`
  Communication thread between customer and support team
  - `id` - Message identifier
  - `ticket_id` - Reference to support ticket
  - `sender_id` - User who sent the message
  - `sender_type` - Whether sender is customer or admin
  - `message` - Message content
  - `is_internal_note` - Flag for admin-only notes
  - Timestamps

  ### `ticket_attachments`
  Images and files uploaded as evidence (damaged/spoiled products)
  - `id` - Attachment identifier
  - `ticket_id` - Reference to support ticket
  - `message_id` - Optional reference to specific message
  - `file_url` - URL to stored image/file
  - `file_type` - Type of file (image, document, etc.)
  - `uploaded_by` - User who uploaded
  - Timestamps

  ## 2. Security
  - Enable RLS on all tables
  - Customers can view/update only their own tickets
  - Admins can view and manage all tickets
  - Internal notes visible only to admins

  ## 3. Notifications
  - Auto-notify admins when new ticket is created
  - Notify customer when admin responds
  - Notify customer when ticket is resolved
*/

-- Create enum types for support system
DO $$ BEGIN
  CREATE TYPE ticket_issue_type AS ENUM (
    'damaged_product',
    'spoiled_product',
    'missing_items',
    'wrong_items',
    'delivery_issue',
    'quality_issue',
    'quantity_mismatch',
    'packaging_issue',
    'late_delivery',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'awaiting_customer',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resolution_type AS ENUM (
    'full_refund',
    'partial_refund',
    'replacement',
    'store_credit',
    'no_action',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_sender_type AS ENUM (
    'customer',
    'admin',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_type ticket_issue_type NOT NULL DEFAULT 'other',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  description text NOT NULL,
  affected_items jsonb DEFAULT '[]',
  resolution_type resolution_type,
  resolution_notes text,
  refund_amount numeric(10,2),
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_refund_amount CHECK (refund_amount IS NULL OR refund_amount >= 0)
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type message_sender_type NOT NULL DEFAULT 'customer',
  message text NOT NULL,
  is_internal_note boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  message_id uuid REFERENCES ticket_messages(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_name text,
  file_size integer,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_order ON support_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);

-- Enable RLS on all tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets

-- Customers can view their own tickets
CREATE POLICY "Customers can view own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Customers can create tickets
CREATE POLICY "Customers can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their own open tickets
CREATE POLICY "Customers can update own open tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid() AND status IN ('open', 'awaiting_customer'))
  WITH CHECK (customer_id = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (is_admin_ctx());

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

-- RLS Policies for ticket_messages

-- Customers can view messages on their tickets (excluding internal notes)
CREATE POLICY "Customers can view own ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id
      AND customer_id = auth.uid()
    )
    AND is_internal_note = false
  );

-- Customers can create messages on their tickets
CREATE POLICY "Customers can create messages on own tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_messages.ticket_id
      AND customer_id = auth.uid()
    )
    AND sender_id = auth.uid()
    AND sender_type = 'customer'
    AND is_internal_note = false
  );

-- Admins can view all messages including internal notes
CREATE POLICY "Admins can view all messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (is_admin_ctx());

-- Admins can create messages and internal notes
CREATE POLICY "Admins can create messages"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_ctx());

-- RLS Policies for ticket_attachments

-- Customers can view attachments on their tickets
CREATE POLICY "Customers can view own ticket attachments"
  ON ticket_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_attachments.ticket_id
      AND customer_id = auth.uid()
    )
  );

-- Customers can upload attachments to their tickets
CREATE POLICY "Customers can upload attachments"
  ON ticket_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_attachments.ticket_id
      AND customer_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
  ON ticket_attachments
  FOR SELECT
  TO authenticated
  USING (is_admin_ctx());

-- Admins can upload attachments
CREATE POLICY "Admins can upload attachments"
  ON ticket_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_ctx());

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  year_part text;
  sequence_num integer;
  ticket_num text;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM support_tickets
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  ticket_num := 'TKT-' || year_part || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_messages_updated_at ON ticket_messages;
CREATE TRIGGER update_ticket_messages_updated_at
  BEFORE UPDATE ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when ticket is created
CREATE OR REPLACE FUNCTION notify_new_support_ticket()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    reference_id,
    reference_type
  )
  SELECT 
    u.id,
    'support_ticket',
    'New Support Ticket: ' || NEW.ticket_number,
    'Customer raised issue: ' || NEW.subject,
    NEW.id,
    'ticket'
  FROM users u
  WHERE u.role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification on new ticket
DROP TRIGGER IF EXISTS trigger_notify_new_ticket ON support_tickets;
CREATE TRIGGER trigger_notify_new_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_support_ticket();

-- Function to notify customer when admin responds
CREATE OR REPLACE FUNCTION notify_customer_on_admin_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type = 'admin' AND NEW.is_internal_note = false THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    )
    SELECT 
      st.customer_id,
      'support_response',
      'Response on Ticket ' || st.ticket_number,
      'Support team responded to your ticket',
      st.id,
      'ticket'
    FROM support_tickets st
    WHERE st.id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify customer on admin response
DROP TRIGGER IF EXISTS trigger_notify_customer_response ON ticket_messages;
CREATE TRIGGER trigger_notify_customer_response
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_on_admin_response();

-- Function to notify customer when ticket is resolved
CREATE OR REPLACE FUNCTION notify_customer_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    )
    VALUES (
      NEW.customer_id,
      'support_resolved',
      'Ticket ' || NEW.ticket_number || ' Resolved',
      'Your support ticket has been resolved',
      NEW.id,
      'ticket'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify customer on resolution
DROP TRIGGER IF EXISTS trigger_notify_resolution ON support_tickets;
CREATE TRIGGER trigger_notify_resolution
  AFTER UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_on_resolution();