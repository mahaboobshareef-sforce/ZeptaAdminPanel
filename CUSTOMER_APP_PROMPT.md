# Zepta Customer Mobile App - Complete Implementation Prompt

Create a modern, production-ready mobile e-commerce application for grocery and vegetable delivery with the following specifications:

## Tech Stack
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation 6+
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL with Real-time subscriptions)
- **UI Components**: React Native Paper or NativeBase
- **Maps**: React Native Maps with location services
- **Image Handling**: React Native Fast Image
- **Payment Integration**: Razorpay or similar (for online payments)

## Supabase Configuration
```
SUPABASE_URL=https://aigtxqdeasdjeeeasgue.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3R4cWRlYXNkamVlZWFzZ3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNDkyMjksImV4cCI6MjA3MDgyNTIyOX0.2A7bqrbSk9YjVmbSp3BachN48AvYPVoIH98Jdw4vozs
```

## Core Features to Implement

### 1. Authentication System
- **Email/Password Login & Registration** using Supabase Auth
- OTP verification for mobile numbers
- Social login (Google, Apple - optional)
- Password reset functionality
- Auto-login with secure token storage
- Profile management (edit name, email, mobile)

**Database**: Uses `auth.users` and `public.users` tables with role='customer'

### 2. Home Screen
**Layout:**
- Search bar at top for product search
- Promotional banners carousel (from `promotional_banners` table)
- Category grid (vegetables & grocery from `categories` table)
- Featured products section (products with `is_featured=true`)
- "Shop by Category" section
- Recent orders quick access

**Features:**
- Real-time banner updates
- Pull-to-refresh
- Location-based store selection
- Smooth scrolling with FlatList optimization

**API Queries:**
```sql
-- Get active banners
SELECT * FROM promotional_banners
WHERE status = 'active'
AND (start_date IS NULL OR start_date <= NOW())
AND (end_date IS NULL OR end_date >= NOW())
ORDER BY sort_order;

-- Get categories
SELECT * FROM categories
WHERE parent_id IS NULL
ORDER BY name;

-- Get featured products with variants
SELECT p.*, pv.*
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_featured = true AND p.is_active = true
```

### 3. Product Catalog
**Features:**
- Category-wise product listing
- Subcategory navigation with breadcrumbs
- Grid/List view toggle
- Filter by: Price range, Availability, Discount
- Sort by: Price (low-high, high-low), Name, Popularity
- Product search with auto-suggestions
- Lazy loading with infinite scroll

**Product Card Display:**
- Product image
- Product name
- Price (show original + discount price if available)
- Unit label (e.g., "500g", "1kg")
- "Add to Cart" button with quantity selector
- Stock availability indicator
- Discount percentage badge

**Database Schema:**
```typescript
// Products with variants
products: {
  id, name, description, image_url, is_featured, is_active, category_id
}
product_variants: {
  id, product_id, unit_label, price, discount_price, sku, barcode, status
}
store_inventory: {
  store_id, variant_id, stock_quantity, low_stock_threshold
}
```

### 4. Product Detail Page
- High-quality image gallery
- Product name and description
- Variant selector (different sizes/weights)
- Price display (original + discount)
- Stock availability
- Add to cart with quantity adjustment
- Related products section
- Product reviews/ratings (if available)

### 5. Shopping Cart
**Features:**
- List all cart items with images
- Quantity increase/decrease buttons
- Remove item functionality
- Apply coupon code
- Price breakdown:
  - Subtotal (sum of items)
  - Discount (from coupon)
  - Delivery charges
  - **Grand Total**
- Proceed to checkout button
- Empty cart state with "Continue Shopping"

**Cart Management:**
- Store cart in AsyncStorage + sync with backend
- Real-time price updates
- Stock validation before checkout
- Cart persistence across app sessions

**Coupon Validation:**
```sql
-- Validate coupon
SELECT * FROM coupons
WHERE code = $1
AND status = 'active'
AND (start_date IS NULL OR start_date <= NOW())
AND (end_date IS NULL OR end_date >= NOW())
AND (usage_limit IS NULL OR used_count < usage_limit)
```

### 6. Address Management
**Features:**
- List all saved addresses (from `customer_addresses` table)
- Add new address with map picker
- Edit existing addresses
- Delete addresses
- Set default address
- Address validation with Google Places API
- Detect current location via GPS
- Search address with autocomplete

**Address Form Fields:**
- Label (Home, Work, Other)
- Address Line 1 & 2
- City, State, Pincode
- Latitude & Longitude (auto-filled from map)
- Delivery notes/instructions
- "Set as default" toggle

### 7. Checkout Flow
**Step 1: Address Selection**
- Show all saved addresses
- Select delivery address
- Option to add new address

**Step 2: Order Summary**
- Review cart items
- Selected delivery address
- Apply/remove coupon
- Price breakdown

**Step 3: Payment Method**
- Cash on Delivery (COD)
- Online Payment (Razorpay/Stripe)
- Show payment method icons

**Step 4: Place Order**
- Create order in database
- Deduct inventory
- Send order confirmation
- Navigate to order tracking

**Order Creation API:**
```typescript
// Create order
INSERT INTO orders (
  customer_id, store_id, delivery_address_id,
  status, payment_method, payment_status,
  discount_amount, delivery_charges, order_total
) VALUES (...);

// Create order items
INSERT INTO order_items (order_id, variant_id, quantity, price)
VALUES (...);

// Update inventory
UPDATE store_inventory
SET stock_quantity = stock_quantity - $quantity
WHERE variant_id = $variant_id;
```

### 8. Order Tracking
**Real-time Order Status:**
- `pending` → Order placed
- `order_accepted` → Store accepted
- `packed` → Order packed
- `assigned_delivery_partner` → Agent assigned
- `out_for_delivery` → On the way (show live location)
- `delivered` → Completed
- `cancelled` → Cancelled (show reason)

**Features:**
- Order status timeline/stepper
- Live delivery agent location on map (using `agent_location` table)
- Agent contact details (call/message)
- Estimated delivery time
- Order details (items, price, address)
- Cancel order option (if status is pending/order_accepted)
- Reorder functionality

**Real-time Subscription:**
```typescript
// Subscribe to order status updates
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `customer_id=eq.${userId}`
  }, (payload) => {
    // Update UI with new status
  })
  .subscribe();

// Subscribe to agent location
supabase
  .channel('agent-location')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'agent_location',
    filter: `agent_id=eq.${agentId}`
  }, (payload) => {
    // Update agent marker on map
  })
  .subscribe();
```

### 9. Order History
- List all past orders (newest first)
- Filter by status (All, Delivered, Cancelled)
- Search orders by order ID or items
- Order cards showing:
  - Order ID
  - Date & time
  - Status badge
  - Total amount
  - Item count
  - Thumbnail images of items
- Tap to view full order details
- Reorder button
- Download invoice (if delivered)

### 10. Notifications
- Real-time push notifications using FCM
- In-app notification center
- Notification types:
  - Order status updates
  - Promotional offers
  - Coupon codes
  - Delivery alerts
- Mark as read functionality
- Notification badge count

**Database:** Uses `notifications` table
```sql
SELECT * FROM notifications
WHERE user_id = $userId
ORDER BY created_at DESC;
```

### 11. Profile & Settings
**Profile Section:**
- Display user name, email, mobile
- Edit profile option
- Profile picture upload (optional)

**Settings:**
- Saved addresses management
- Payment methods (saved cards - optional)
- Notifications preferences
- Language selection
- App version info
- Terms & Conditions
- Privacy Policy
- Contact Support
- Logout

### 12. Support System
**Features:**
- View support tickets (from `support_tickets` table)
- Create new ticket with:
  - Order selection (optional)
  - Issue category (Order, Delivery, Payment, Product, Other)
  - Priority (Low, Medium, High)
  - Description
  - Attachment upload
- View ticket replies (from `support_replies` table)
- Real-time chat-like interface
- Ticket status tracking (Open, In Progress, Resolved, Closed)

**Support Queries:**
```sql
-- Get customer tickets
SELECT st.*, o.id as order_id
FROM support_tickets st
LEFT JOIN orders o ON st.order_id = o.id
WHERE st.customer_id = $userId
ORDER BY st.created_at DESC;

-- Get ticket replies
SELECT sr.*, u.full_name as responder_name
FROM support_replies sr
JOIN users u ON sr.responder_id = u.id
WHERE sr.ticket_id = $ticketId
ORDER BY sr.created_at ASC;
```

### 13. Search Functionality
- Global product search
- Search by product name, category, or keywords
- Search history
- Popular searches
- Voice search (optional)
- Barcode scanner to search products

## Design Guidelines

### Color Scheme
- Primary: Vibrant green (fresh/organic theme) - `#10B981`
- Secondary: Orange for CTAs - `#F59E0B`
- Background: White/Light gray - `#F9FAFB`
- Text: Dark gray - `#1F2937`
- Error: Red - `#EF4444`
- Success: Green - `#10B981`

### Typography
- Headings: Bold, 18-24px
- Body: Regular, 14-16px
- Captions: 12px

### UI/UX Principles
- Bottom tab navigation (Home, Categories, Cart, Orders, Profile)
- Floating action button for cart (with item count badge)
- Smooth animations and transitions
- Loading skeletons instead of spinners
- Empty states with illustrations
- Error handling with retry options
- Offline mode support (show cached data)
- Haptic feedback on actions
- Pull-to-refresh on all list screens

## Performance Optimization
- Image lazy loading and caching
- FlatList with optimized rendering
- Memoization for expensive computations
- Debounced search
- React Query for efficient data fetching & caching
- Background data sync
- Minimize bundle size

## Security Requirements
- Secure storage for auth tokens (react-native-keychain)
- API calls only with authenticated users
- Input validation and sanitization
- HTTPS only
- No sensitive data in logs
- Proper error messages (don't expose internals)

## Testing Requirements
- Unit tests for utilities and helpers
- Integration tests for API calls
- E2E tests for critical flows (login, checkout)
- Test on both iOS and Android
- Test different screen sizes

## Additional Features (Nice to Have)
- Dark mode support
- Wishlist/Favorites
- Product ratings & reviews
- Referral program
- Wallet/Credits system
- Scheduled delivery
- Subscription orders (weekly/monthly)
- Recipe suggestions based on products
- Multi-language support

## Database Tables Reference
All data is stored in Supabase PostgreSQL. Key tables:
- `users` - Customer profiles
- `stores` - Store locations
- `categories` - Product categories
- `products` - Product catalog
- `product_variants` - Product sizes/weights
- `store_inventory` - Stock levels per store
- `orders` - Customer orders
- `order_items` - Items in each order
- `customer_addresses` - Delivery addresses
- `coupons` - Discount coupons
- `promotional_banners` - Home screen banners
- `notifications` - Push notifications
- `support_tickets` - Customer support tickets
- `support_replies` - Support ticket messages
- `agent_location` - Real-time delivery agent GPS
- `payments` - Payment records
- `refunds` - Refund transactions

Row Level Security (RLS) is enabled on all tables. Customers can only access their own data.

## Deliverables
1. Complete React Native app with all features
2. Clean, modular code structure
3. TypeScript interfaces for all data types
4. Supabase client configuration
5. Environment variables setup
6. README with setup instructions
7. API documentation
8. Build scripts for iOS and Android

Build a beautiful, fast, and user-friendly customer app that makes grocery shopping delightful!
