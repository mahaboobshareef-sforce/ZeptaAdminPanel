# Zepta Delivery Agent Mobile App - Complete Implementation Prompt

Create a professional, production-ready delivery agent mobile application for efficient order delivery management with the following specifications:

## Tech Stack
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation 6+
- **State Management**: React Query (TanStack Query) + Zustand for local state
- **Database**: Supabase (PostgreSQL with Real-time subscriptions)
- **UI Components**: React Native Paper or NativeBase
- **Maps**: React Native Maps with turn-by-turn navigation
- **Location Services**: React Native Geolocation with background tracking
- **Camera**: React Native Camera (for delivery proof)
- **Notifications**: React Native Firebase Cloud Messaging

## Supabase Configuration
```
SUPABASE_URL=https://aigtxqdeasdjeeeasgue.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3R4cWRlYXNkamVlZWFzZ3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMjksImV4cCI6MjA3MDgyNTIyOX0.2A7bqrbSk9YjVmbSp3BachN48AvYPVoIH98Jdw4vozs
```

## Core Features to Implement

### 1. Authentication System
- **Email/Password Login** using Supabase Auth
- Remember me functionality
- Password reset
- Auto-login with secure token storage
- Account is created by Admin (role='delivery_agent')

**Login Flow:**
```typescript
// Agent logs in with credentials provided by admin
const { data, error } = await supabase.auth.signInWithPassword({
  email: agentEmail,
  password: agentPassword
});

// Fetch agent profile
const { data: profile } = await supabase
  .from('users')
  .select('*, store:stores(*)')
  .eq('id', data.user.id)
  .eq('role', 'delivery_agent')
  .single();
```

### 2. Dashboard/Home Screen
**Status Card (Top Section):**
- Agent status toggle: **Online/Offline**
- Current shift duration
- Today's stats:
  - Total deliveries completed
  - Pending deliveries
  - Total earnings (if commission-based)
  - Average rating

**Active Orders Section:**
- List of assigned orders (`status = 'assigned_delivery_partner' OR 'out_for_delivery'`)
- Order card showing:
  - Order ID
  - Customer name
  - Delivery address (truncated)
  - Order items count
  - COD amount (if applicable)
  - Distance from current location
  - Estimated delivery time
  - Priority badge (if urgent)
- Quick actions: "Navigate" & "View Details"

**Real-time Updates:**
- Subscribe to order assignments
- Sound/vibration alert for new orders
- Push notifications

**Database Queries:**
```sql
-- Get assigned orders
SELECT
  o.*,
  u.full_name as customer_name,
  u.mobile_number as customer_mobile,
  ca.address_line1, ca.address_line2, ca.city, ca.pincode,
  ca.latitude, ca.longitude, ca.delivery_notes
FROM orders o
JOIN users u ON o.customer_id = u.id
LEFT JOIN customer_addresses ca ON o.delivery_address_id = ca.id
WHERE o.delivery_agent_id = $agentId
AND o.status IN ('assigned_delivery_partner', 'out_for_delivery')
ORDER BY o.created_at ASC;

-- Get today's stats
SELECT
  COUNT(*) FILTER (WHERE status = 'delivered') as completed,
  COUNT(*) FILTER (WHERE status IN ('assigned_delivery_partner', 'out_for_delivery')) as pending
FROM orders
WHERE delivery_agent_id = $agentId
AND DATE(created_at) = CURRENT_DATE;
```

### 3. Order Details Screen
**Order Information:**
- Order ID and timestamp
- Current status with timeline/stepper:
  - Order Accepted by Store
  - Packed
  - **Assigned to You**
  - **Out for Delivery**
  - Delivered

**Customer Details:**
- Customer name
- Mobile number (click to call)
- Delivery address (full)
- Delivery notes/instructions
- Show on map button

**Order Items:**
- List all items with:
  - Product name
  - Variant/unit
  - Quantity
  - Price
- Show item images (small thumbnails)

**Payment Details:**
- Payment method (COD/Online)
- Order total
- If COD: Amount to collect
- If Online: Already paid

**Action Buttons:**
- "Start Delivery" (changes status to 'out_for_delivery')
- "Navigate" (opens Google Maps with destination)
- "Call Customer"
- "Report Issue"
- "Mark as Delivered"

### 4. Navigation & Tracking
**Features:**
- Integrated Google Maps showing:
  - Current location (blue dot)
  - Delivery destination (red marker)
  - Optimal route line
- Turn-by-turn navigation
- Distance and ETA display
- Traffic-aware routing

**Background Location Tracking:**
- Continuously update agent's location in `agent_location` table
- Send location every 10-30 seconds while on delivery
- Customer can see live tracking

**Location Update:**
```typescript
// Background location service
setInterval(async () => {
  const position = await getCurrentLocation();

  await supabase
    .from('agent_location')
    .upsert({
      agent_id: agentId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      updated_at: new Date().toISOString()
    });
}, 15000); // Update every 15 seconds
```

### 5. Order Delivery Completion
**Mark as Delivered Flow:**
1. **Take Delivery Proof:**
   - Capture photo of delivered order
   - Optional: Customer signature
   - Upload to Supabase Storage

2. **Collect Payment (if COD):**
   - Confirm amount collected
   - Mark payment as received

3. **Get Delivery OTP/Confirmation:**
   - Customer provides OTP (optional feature)
   - Or agent confirms delivery

4. **Update Order Status:**
   - Change status to 'delivered'
   - Add delivery timestamp
   - Update order activity log

**Delivery Completion API:**
```typescript
// Update order status
await supabase
  .from('orders')
  .update({
    status: 'delivered',
    status_updated_at: new Date().toISOString()
  })
  .eq('id', orderId);

// Update payment (if COD)
await supabase
  .from('payments')
  .update({
    status: 'paid'
  })
  .eq('order_id', orderId);

// Log activity
await supabase
  .from('order_activity_log')
  .insert({
    order_id: orderId,
    status: 'delivered',
    changed_by: agentId,
    note: 'Order delivered successfully',
    changed_at: new Date().toISOString()
  });

// Send notification to customer
await supabase
  .from('notifications')
  .insert({
    user_id: customerId,
    title: 'Order Delivered',
    message: 'Your order has been delivered successfully!',
    type: 'order',
    is_read: false
  });
```

### 6. Order History
**Features:**
- List all completed deliveries
- Filter by:
  - Date range (Today, This Week, This Month, Custom)
  - Status (Delivered, Cancelled)
- Search by order ID or customer name

**Order Card Display:**
- Order ID
- Customer name
- Delivery address
- Delivery date & time
- Amount (with COD badge if applicable)
- Distance traveled
- Delivery photo thumbnail

**Statistics:**
- Total deliveries this month
- Success rate
- Average delivery time
- Total distance covered

### 7. Earnings (Optional Feature)
**If Commission-Based:**
- Daily earnings breakdown
- Weekly/Monthly summary
- Earnings per delivery
- Pending settlement amount
- Payment history
- Download earning reports

**Calculation:**
- Base delivery fee
- Distance-based incentive
- Peak hour bonus
- Tips (if any)

### 8. Notifications
**Real-time Notifications:**
- New order assigned
- Order cancelled by customer/admin
- Order modifications
- Payment received confirmation
- System announcements

**Notification Types:**
- Push notifications (FCM)
- In-app notification center
- Sound and vibration alerts

**Database:** Uses `notifications` table
```sql
SELECT * FROM notifications
WHERE user_id = $agentId
ORDER BY created_at DESC;
```

### 9. Profile & Settings
**Profile Section:**
- Agent name
- Email & mobile number
- Assigned store (if any)
- Agent ID
- Profile photo
- Rating (from customers - optional)

**Work Settings:**
- Status: Online/Offline
- Availability hours
- Preferred delivery zones
- Vehicle type (bike, car, etc.)

**App Settings:**
- Notification preferences
- Map settings (traffic, satellite view)
- Language
- App version
- Help & Support
- Logout

### 10. Issue Reporting
**Report Problems During Delivery:**
- Issue categories:
  - Customer not available
  - Wrong address
  - Customer refused order
  - Damaged product
  - Safety concern
  - Other

**Reporting Flow:**
- Select issue type
- Add description
- Attach photo/video (optional)
- Submit to admin

**Creates Support Ticket:**
```typescript
await supabase
  .from('support_tickets')
  .insert({
    customer_id: customerId, // or agentId based on context
    order_id: orderId,
    category: 'Delivery',
    priority: 'high',
    subject: 'Delivery Issue',
    description: issueDescription,
    status: 'open'
  });
```

### 11. Real-time Order Management
**Order Status Updates:**
```typescript
// Subscribe to order updates for agent
supabase
  .channel('agent-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `delivery_agent_id=eq.${agentId}`
  }, (payload) => {
    // New order assigned - show notification
    showNotification('New Order Assigned!');
    playSound();
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `delivery_agent_id=eq.${agentId}`
  }, (payload) => {
    // Order updated - refresh list
  })
  .subscribe();
```

### 12. Offline Support
**Offline Capabilities:**
- Cache current active orders
- Queue actions when offline (mark delivered, update location)
- Sync when internet returns
- Show offline indicator
- Allow viewing cached order details

### 13. Help & Support
**Features:**
- FAQs for common issues
- Contact admin/support
- Emergency contact numbers
- In-app chat with support team
- Tutorial/Onboarding videos

## Design Guidelines

### Color Scheme
- Primary: Professional Blue - `#2563EB`
- Secondary: Orange for alerts - `#F59E0B`
- Success: Green - `#10B981`
- Background: White/Light gray - `#F9FAFB`
- Text: Dark gray - `#1F2937`
- Urgent: Red - `#EF4444`

### Typography
- Headings: Bold, 18-22px
- Body: Regular, 14-16px
- Buttons: Medium, 16px

### UI/UX Principles
- Bottom tab navigation (Home, Orders, History, Profile)
- Large, easy-to-tap buttons (delivery agents often wear gloves)
- High contrast for outdoor visibility
- Minimal text input requirements
- Quick actions accessible
- Voice commands (optional)
- One-handed operation friendly

## Performance Optimization
- Efficient background location tracking
- Minimize battery drain
- Optimize map rendering
- Cache frequently accessed data
- Compress uploaded images
- Lazy load order history

## Security Requirements
- Secure token storage (react-native-keychain)
- Location permissions properly requested
- Camera permissions for delivery proof
- No customer data stored insecurely
- Encrypted communication
- Session timeout for inactive agents

## Critical Features

### 1. Background Location Tracking
- Continue tracking even when app is in background
- Battery-efficient tracking
- Update location at optimal intervals
- Stop tracking when agent goes offline

### 2. Reliable Notifications
- Must not miss new order assignments
- Persistent notifications for active orders
- Sound alerts even in silent mode
- Custom ringtones for different notification types

### 3. Quick Actions
- Swipe gestures on order cards for quick actions
- Floating action button for marking delivered
- Quick call button always visible
- Emergency SOS button

## Edge Cases to Handle
- **Customer not available:** Allow agent to mark as "Attempted Delivery" with retry option
- **Wrong address:** Allow address correction or cancellation request
- **Product damaged:** Report issue with photo before delivery
- **Safety concerns:** Quick access to emergency contacts and issue reporting
- **App crashes:** Auto-save state and restore on relaunch
- **Network loss during delivery:** Queue updates and sync later
- **Battery low:** Reduce location update frequency

## Database Tables Used
- `users` - Agent profile (role='delivery_agent')
- `stores` - Assigned store details
- `orders` - Order assignments
- `order_items` - Items in each order
- `customer_addresses` - Delivery locations
- `agent_location` - Real-time GPS tracking
- `order_activity_log` - Delivery status logs
- `payments` - Payment collection
- `notifications` - Agent notifications
- `support_tickets` - Issue reporting

## Order Status Flow
```
assigned_delivery_partner (Order assigned to agent)
    ↓
out_for_delivery (Agent started delivery)
    ↓
delivered (Agent marked as delivered)
```

Agent can only update orders in these statuses.

## Permissions Required
- **Location**: Always (for background tracking)
- **Camera**: For delivery proof photos
- **Phone**: To call customers
- **Storage**: To save delivery photos
- **Notifications**: For order alerts

## Testing Requirements
- Test with real GPS coordinates
- Test offline scenarios
- Test background location tracking
- Battery drain testing
- Test with poor network conditions
- Test simultaneous multiple order handling
- Test on various Android and iOS devices

## Additional Features (Nice to Have)
- Voice navigation commands
- AR directions (for complex buildings)
- Chat with customer
- Multi-language support
- Dark mode
- Agent performance analytics
- Delivery heatmap
- Smart route optimization for multiple orders
- Proof of delivery with customer signature
- Tips collection feature

## Deliverables
1. Complete React Native app for delivery agents
2. Clean, modular code with TypeScript
3. Supabase integration
4. Background services configured
5. Map integration with navigation
6. Camera integration for delivery proof
7. Push notification setup
8. README with setup instructions
9. Build scripts for iOS and Android
10. Agent app manual/documentation

Build an efficient, reliable, and user-friendly delivery agent app that makes order delivery smooth and professional!
