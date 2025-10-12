# Customer Support System - Complete Guide

## Overview

A comprehensive customer support system for handling customer complaints about damaged products, spoiled items, wrong orders, and other issues in your grocery delivery platform.

## Database Schema Verification

### ✅ All Tables Created and Verified

#### 1. `support_tickets` Table
Main table for tracking all customer issues.

**Columns:**
- `id` (uuid) - Primary key
- `ticket_number` (text) - Human-readable ticket ID (e.g., "TKT-2025-00001")
- `order_id` (uuid) - Reference to orders table
- `customer_id` (uuid) - Reference to users table
- `issue_type` (enum) - Type of issue
- `priority` (enum) - low, medium, high, critical
- `status` (enum) - open, in_progress, awaiting_customer, resolved, closed
- `subject` (text) - Brief description
- `description` (text) - Detailed issue description
- `affected_items` (jsonb) - Array of affected order items
- `resolution_type` (enum) - How issue was resolved
- `resolution_notes` (text) - Admin notes on resolution
- `refund_amount` (numeric) - Refund/credit amount
- `resolved_by` (uuid) - Admin who resolved
- `resolved_at` (timestamptz) - Resolution timestamp
- `created_at`, `updated_at` (timestamptz)

**Issue Types:**
- `damaged_product` - Product arrived damaged
- `spoiled_product` - Product is spoiled/expired
- `missing_items` - Items missing from order
- `wrong_items` - Wrong items delivered
- `delivery_issue` - Problem with delivery
- `quality_issue` - Product quality concerns
- `quantity_mismatch` - Wrong quantity delivered
- `packaging_issue` - Packaging problems
- `late_delivery` - Delivery was late
- `other` - Other issues

**Resolution Types:**
- `full_refund` - Full refund issued
- `partial_refund` - Partial refund issued
- `replacement` - Replacement order created
- `store_credit` - Store credit provided
- `no_action` - No action required
- `other` - Other resolution

#### 2. `ticket_messages` Table
Communication thread between customer and support team.

**Columns:**
- `id` (uuid) - Primary key
- `ticket_id` (uuid) - Reference to support_tickets
- `sender_id` (uuid) - User who sent message
- `sender_type` (enum) - customer, admin, system
- `message` (text) - Message content
- `is_internal_note` (boolean) - Flag for admin-only notes
- `created_at`, `updated_at` (timestamptz)

#### 3. `ticket_attachments` Table
Evidence photos and files uploaded by customers or admins.

**Columns:**
- `id` (uuid) - Primary key
- `ticket_id` (uuid) - Reference to support_tickets
- `message_id` (uuid) - Optional reference to specific message
- `file_url` (text) - URL to stored file
- `file_type` (text) - Type of file (image, document, etc.)
- `file_name` (text) - Original filename
- `file_size` (integer) - File size in bytes
- `uploaded_by` (uuid) - User who uploaded
- `created_at` (timestamptz)

### ✅ Security (Row Level Security)

All tables have comprehensive RLS policies:

**Support Tickets:**
- Customers can view only their own tickets
- Customers can create new tickets
- Customers can update their own open/awaiting tickets
- Admins can view and update all tickets

**Ticket Messages:**
- Customers can view messages on their tickets (excluding internal notes)
- Customers can create messages on their tickets
- Admins can view all messages including internal notes
- Admins can create messages and internal notes

**Ticket Attachments:**
- Customers can view and upload attachments on their tickets
- Admins can view and upload attachments on all tickets

### ✅ Auto-Notifications

**Trigger Functions Created:**

1. **`notify_new_support_ticket()`**
   - Fires when customer creates new ticket
   - Notifies all admin users
   - Creates notification with ticket details

2. **`notify_customer_on_admin_response()`**
   - Fires when admin sends message (non-internal)
   - Notifies customer of response
   - Creates notification linking to ticket

3. **`notify_customer_on_resolution()`**
   - Fires when ticket status changes to resolved/closed
   - Notifies customer of resolution
   - Creates notification with resolution info

### ✅ Helper Functions

**`generate_ticket_number()`**
- Generates unique ticket numbers
- Format: TKT-YYYY-NNNNN (e.g., TKT-2025-00001)
- Auto-increments per year

**`update_updated_at_column()`**
- Auto-updates `updated_at` timestamp on record changes
- Applied to support_tickets and ticket_messages

## Admin UI Features

### Support Tickets Page (`/support-tickets`)

**Dashboard Stats:**
- Open Tickets (red badge)
- In Progress Tickets (yellow badge)
- Resolved Tickets (green badge)
- Critical Priority Tickets (red badge)

**Filtering & Search:**
- Search by ticket number, customer name, or email
- Filter by status (all, open, in progress, awaiting customer, resolved, closed)
- Filter by priority (all, low, medium, high, critical)

**Ticket List View:**
- Ticket number (clickable)
- Customer name and email
- Issue type
- Subject line
- Priority badge
- Status badge
- Creation date
- View details button

**Ticket Detail Modal:**

1. **Ticket Information Section:**
   - Customer details (name, email, phone)
   - Order ID reference
   - Issue type
   - Creation timestamp

2. **Description Section:**
   - Full subject
   - Detailed description from customer

3. **Evidence Photos:**
   - Grid view of all uploaded images
   - Photos uploaded by customer showing damaged/spoiled products

4. **Communication Thread:**
   - Full conversation history
   - Customer messages (blue background)
   - Admin responses (gray background)
   - Internal notes (yellow background, admin-only)
   - Timestamps for all messages

5. **Send Response:**
   - Textarea for composing message
   - Checkbox for "Internal note" (customer won't see)
   - Send button

6. **Status Management:**
   - Dropdown to change ticket status
   - Dropdown to change priority
   - Updates immediately

7. **Resolution Section:**
   - Resolution type selector (refund, replacement, etc.)
   - Refund amount input (for refund/credit types)
   - Resolution notes textarea
   - "Resolve Ticket" button
   - Shows resolution details if already resolved

## Customer App Integration

### How Customers Raise Issues

**From Customer App (needs to be implemented in customer app):**

```typescript
// Example: Customer creates support ticket
const createSupportTicket = async (orderData: {
  order_id: string;
  issue_type: string;
  subject: string;
  description: string;
  affected_items?: any[];
}) => {
  // 1. Generate ticket number
  const { data: ticketNumber } = await supabase
    .rpc('generate_ticket_number');

  // 2. Create ticket
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      order_id: orderData.order_id,
      customer_id: user.id,
      issue_type: orderData.issue_type,
      priority: 'medium', // or calculate based on issue_type
      subject: orderData.subject,
      description: orderData.description,
      affected_items: orderData.affected_items || [],
    })
    .select()
    .single();

  return ticket;
};

// Example: Upload evidence photo
const uploadEvidence = async (ticketId: string, file: File) => {
  // 1. Upload to Supabase Storage
  const fileName = `${ticketId}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('support-evidence')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // 2. Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('support-evidence')
    .getPublicUrl(fileName);

  // 3. Create attachment record
  const { error } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      file_url: publicUrl,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
    });

  if (error) throw error;
};

// Example: Customer sends message
const sendMessage = async (ticketId: string, message: string) => {
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_type: 'customer',
      message: message,
      is_internal_note: false,
    });

  if (error) throw error;
};
```

## Workflow Example

### Typical Support Flow

1. **Customer Experience:**
   - Receives damaged tomatoes in order #12345
   - Opens order in app
   - Clicks "Report Issue" button
   - Selects issue type: "Damaged Product"
   - Writes description: "Tomatoes arrived crushed"
   - Takes photos of damaged tomatoes
   - Uploads 2 photos as evidence
   - Submits ticket
   - Receives ticket number: TKT-2025-00001

2. **Admin Notification:**
   - All admins receive notification
   - Notification shows: "New Support Ticket: TKT-2025-00001"
   - Message: "Customer raised issue: Tomatoes arrived crushed"

3. **Admin Action:**
   - Admin opens Support Tickets page
   - Sees ticket in "Open" status with "Medium" priority
   - Clicks "View" to see details
   - Reviews photos of crushed tomatoes
   - Changes status to "In Progress"
   - Sends message: "Sorry about that! We'll process a refund immediately."
   - Updates priority to "High"
   - Sets resolution type: "Partial Refund"
   - Enters refund amount: 50.00
   - Adds resolution notes: "Refunded ₹50 for damaged tomatoes"
   - Clicks "Resolve Ticket"

4. **Customer Notification:**
   - Customer receives notification: "Response on Ticket TKT-2025-00001"
   - Customer receives notification: "Ticket TKT-2025-00001 Resolved"
   - Customer can view resolution in their app

## Data You Can Track

### Analytics & Insights

With this system, you can analyze:

1. **Issue Frequency:**
   - How many damaged product complaints per week?
   - Which issue types are most common?
   - Trending issues over time

2. **Response Metrics:**
   - Average time to first response
   - Average resolution time
   - Resolution rate by issue type

3. **Financial Impact:**
   - Total refunds issued per month
   - Refund amount by issue type
   - Cost of damaged/spoiled products

4. **Product Quality:**
   - Which products get most complaints?
   - Quality issues by supplier
   - Seasonal patterns in spoilage

5. **Customer Satisfaction:**
   - Resolution acceptance rate
   - Repeat complainers
   - Escalation patterns

### Example Queries

```sql
-- Most common issue types
SELECT
  issue_type,
  COUNT(*) as ticket_count,
  AVG(refund_amount) as avg_refund
FROM support_tickets
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY issue_type
ORDER BY ticket_count DESC;

-- Average resolution time
SELECT
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours_to_resolve
FROM support_tickets
WHERE status IN ('resolved', 'closed');

-- Total refunds this month
SELECT
  COUNT(*) as refund_count,
  SUM(refund_amount) as total_refunds
FROM support_tickets
WHERE resolution_type IN ('full_refund', 'partial_refund')
  AND created_at > DATE_TRUNC('month', NOW());

-- Critical unresolved tickets
SELECT
  ticket_number,
  subject,
  customer_id,
  created_at
FROM support_tickets
WHERE priority = 'critical'
  AND status NOT IN ('resolved', 'closed')
ORDER BY created_at ASC;
```

## Next Steps

### For Customer App Implementation:

1. **Create Support Section in Customer App:**
   - "My Tickets" page to view all tickets
   - "Report Issue" button on order details
   - Form to create new ticket
   - Photo upload functionality
   - View ticket details and responses

2. **Set Up Supabase Storage:**
   ```sql
   -- Create storage bucket for evidence photos
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('support-evidence', 'support-evidence', true);

   -- Set up storage policies
   CREATE POLICY "Anyone can upload to support-evidence"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'support-evidence');

   CREATE POLICY "Anyone can view support-evidence"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'support-evidence');
   ```

3. **Implement Real-time Updates:**
   ```typescript
   // Subscribe to ticket updates
   supabase
     .channel('ticket-updates')
     .on('postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'support_tickets',
         filter: `customer_id=eq.${user.id}`
       },
       (payload) => {
         // Update UI when ticket changes
       }
     )
     .subscribe();

   // Subscribe to new messages
   supabase
     .channel('message-updates')
     .on('postgres_changes',
       {
         event: 'INSERT',
         schema: 'public',
         table: 'ticket_messages',
       },
       (payload) => {
         // Show new message in UI
       }
     )
     .subscribe();
   ```

## Summary

You now have a fully functional customer support system that:

✅ **Tracks all customer complaints** with detailed information
✅ **Stores evidence photos** of damaged/spoiled products
✅ **Enables two-way communication** between customers and support
✅ **Provides internal notes** for team coordination
✅ **Auto-generates notifications** for important events
✅ **Tracks resolutions and refunds** for accountability
✅ **Maintains security** with proper RLS policies
✅ **Scales easily** with your growing business

The admin interface is ready to use immediately. You just need to implement the customer-facing portion in your customer app using the examples provided above.
