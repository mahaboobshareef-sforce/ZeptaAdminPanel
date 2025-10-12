# Complete Testing Guide - Multi-Store Grocery Admin Panel

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Test Data Setup](#test-data-setup)
4. [Testing Checklist](#testing-checklist)
5. [Common Test Scenarios](#common-test-scenarios)

---

## System Overview

### What This Application Does

This is a **comprehensive admin panel** for managing a multi-store grocery delivery business. Think of it like managing multiple supermarkets from one central dashboard.

**Key Capabilities:**
- Manage multiple store locations (e.g., Guntur Main, Vijayawada Central)
- Track inventory at two levels: bulk stock and retail packages
- Process customer orders with delivery tracking
- Manage delivery agents and their assignments
- Monitor revenue, profits, and business analytics
- Handle payments, refunds, and coupons

### Two-Level Inventory System (Important!)

**1. Bulk Inventory** (Raw Materials)
- This is your warehouse stock in base units (kg, liters, etc.)
- Example: 100 kg of rice in the warehouse
- Updated when you make purchases from suppliers

**2. Retail Inventory** (Packaged Products)
- These are ready-to-sell packages
- Example: 50 bags of 1kg rice, 30 bags of 500g rice
- Customers buy from retail inventory
- Reserved when orders are placed, deducted when delivered

---

## Getting Started

### 1. Initial Setup

**Database:** Already configured and running via Supabase

**Start the Application:**
```bash
npm run dev
```
The app will open at `http://localhost:5173`

### 2. Load Test Data

**Option A: Using Browser Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
```javascript
import('/src/lib/insertDummyData.ts').then(m => m.insertDummyData())
```

**Option B: Create a temporary page**
Add a button in `src/App.tsx` to trigger data insertion.

**What Gets Created:**
- 3 Stores (2 in Guntur, 1 in Vijayawada)
- 10 Product Categories
- 20 Products with 60 Variants
- 30 Customers
- 8 Delivery Agents
- 40 Orders (various statuses)
- 180 Inventory records
- 25 Customer addresses
- 2 Active coupons
- 20 Notifications

### 3. Test Login Credentials

**Format:** Any customer email with password `password123`

**Sample Logins:**
- venkata.ramesh@gmail.com / password123
- lakshmi.devi@gmail.com / password123
- suresh.kumar@gmail.com / password123

**Delivery Agents:**
- ramu@zepta.com / password123
- babu.rao@zepta.com / password123

---

## Testing Checklist

### ✅ Module 1: Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout functionality
- [ ] Session persistence (refresh page while logged in)

### ✅ Module 2: Dashboard
- [ ] Dashboard loads all statistics
- [ ] Revenue metrics display correctly
- [ ] Order count matches Orders page
- [ ] Charts render properly (if implemented)
- [ ] Recent orders section shows data

### ✅ Module 3: Stores Management
- [ ] View all stores
- [ ] Create new store with address
- [ ] Edit store details
- [ ] Activate/deactivate store
- [ ] Delete store (should check for dependencies)
- [ ] Search stores by name

### ✅ Module 4: Categories & Products
**Categories:**
- [ ] View all categories
- [ ] Create new category
- [ ] Edit category name
- [ ] Delete category (should prevent if products exist)

**Products:**
- [ ] View all products
- [ ] Filter by category
- [ ] Search products by name
- [ ] Create new product
- [ ] Upload product image (URL-based)
- [ ] Mark product as featured
- [ ] Activate/deactivate product

**Product Variants:**
- [ ] Add variant to product (e.g., 500g, 1kg)
- [ ] Set different prices for variants
- [ ] Add discount price
- [ ] Generate SKU automatically
- [ ] Edit variant details
- [ ] Delete variant

### ✅ Module 5: Inventory Management

**Retail Inventory (Store-level):**
- [ ] View inventory for all stores
- [ ] Filter by store
- [ ] Search by product name
- [ ] View stock levels per variant
- [ ] See low stock alerts
- [ ] Check reserved quantities
- [ ] Manual stock adjustment (add/remove)

**Bulk Inventory:**
- [ ] View bulk stock overview
- [ ] See total, reserved, and available quantities
- [ ] View weighted average cost
- [ ] Calculate stock value
- [ ] See how many retail units can be made
- [ ] Filter by store
- [ ] Search products

**Inventory Adjustments:**
- [ ] Record stock adjustment
- [ ] Select adjustment type (damage, expired, correction)
- [ ] Add notes/reason
- [ ] View adjustment history
- [ ] See who made adjustment and when

### ✅ Module 6: Purchase Management
- [ ] View all purchases
- [ ] Create new purchase order
- [ ] Select supplier
- [ ] Add multiple products to purchase
- [ ] Set purchase costs
- [ ] Confirm purchase (updates bulk inventory)
- [ ] View purchase history
- [ ] Filter by date range
- [ ] See total purchase value

### ✅ Module 7: Orders Management
- [ ] View all orders
- [ ] Filter by status (pending, delivered, etc.)
- [ ] Filter by payment status
- [ ] Search by order ID or customer
- [ ] View order details
- [ ] Update order status
- [ ] Assign delivery agent
- [ ] View delivery address
- [ ] Check payment details
- [ ] Cancel order
- [ ] Process refund

**Order Status Flow:**
1. pending
2. order_accepted
3. packed
4. assigned_delivery_partner
5. out_for_delivery
6. delivered

### ✅ Module 8: Delivery Agents
- [ ] View all agents
- [ ] Create new agent
- [ ] Assign agent to store
- [ ] View agent's current location
- [ ] See assigned orders
- [ ] View agent performance metrics
- [ ] Activate/deactivate agent
- [ ] View delivery history
- [ ] See agent ratings

### ✅ Module 9: Users & Customers
- [ ] View all users
- [ ] Filter by role (customer, agent, admin)
- [ ] Search by name or email
- [ ] View customer details
- [ ] See customer order history
- [ ] View customer addresses
- [ ] Activate/deactivate user
- [ ] View registration date

### ✅ Module 10: Financial Management

**Payments:**
- [ ] View all payments
- [ ] Filter by status (pending, paid, failed)
- [ ] Filter by method (COD, Online)
- [ ] View transaction details
- [ ] Mark payment as received (for COD)
- [ ] See payment provider info

**Refunds:**
- [ ] View all refunds
- [ ] Create refund for order
- [ ] Set refund amount
- [ ] Add refund reason
- [ ] Process refund
- [ ] View refund status
- [ ] Filter by date

**Profit Analysis:**
- [ ] View overall profit/loss
- [ ] See product-wise profit
- [ ] View store-wise performance
- [ ] Date range filtering
- [ ] Export reports (if implemented)

### ✅ Module 11: Marketing

**Coupons:**
- [ ] View all coupons
- [ ] Create new coupon
- [ ] Set discount type (percentage/fixed)
- [ ] Set minimum order value
- [ ] Set usage limits
- [ ] Set validity period
- [ ] Activate/deactivate coupon
- [ ] Track usage count

**Banners:**
- [ ] View all banners
- [ ] Create promotional banner
- [ ] Upload banner image
- [ ] Link to category or product
- [ ] Set display period
- [ ] Set sort order
- [ ] Activate/deactivate banner

### ✅ Module 12: Reviews & Ratings
- [ ] View all product ratings
- [ ] View all delivery agent ratings
- [ ] Filter by rating score
- [ ] Read customer feedback
- [ ] Respond to reviews (if implemented)
- [ ] Delete inappropriate reviews

### ✅ Module 13: Analytics
- [ ] View sales trends
- [ ] See top-selling products
- [ ] View revenue by store
- [ ] Monitor order volumes
- [ ] See customer acquisition metrics
- [ ] Track delivery performance

---

## Common Test Scenarios

### Scenario 1: Complete Order Lifecycle
**Goal:** Test entire order flow from creation to delivery

1. **View Orders** → Navigate to Orders page
2. **Select Pending Order** → Click on any order with "pending" status
3. **Accept Order** → Change status to "order_accepted"
4. **Pack Order** → Update status to "packed"
5. **Assign Agent** → Select delivery agent, status → "assigned_delivery_partner"
6. **Out for Delivery** → Update to "out_for_delivery"
7. **Complete Delivery** → Mark as "delivered"
8. **Verify Payment** → Check payment status updated to "paid"
9. **Check Inventory** → Verify stock deducted from retail inventory

**Expected Result:** Order completes successfully, inventory updates, payment recorded.

---

### Scenario 2: Purchase to Stock Flow
**Goal:** Record supplier purchase and verify inventory update

1. **Navigate to Purchase Management**
2. **Create New Purchase:**
   - Select supplier
   - Choose store location
   - Add products (e.g., 50kg rice)
   - Set purchase cost (e.g., ₹40 per kg)
   - Total: ₹2,000
3. **Confirm Purchase**
4. **Navigate to Bulk Inventory**
5. **Verify Stock:**
   - Find rice in the list
   - Check quantity increased by 50kg
   - Verify weighted average cost updated

**Expected Result:** Bulk inventory increases, cost averaging works correctly.

---

### Scenario 3: Low Stock Alert Test
**Goal:** Verify low stock warnings work

1. **Navigate to Inventory**
2. **Find Product with Low Stock** (quantity < low_stock_threshold)
3. **Verify Warning Badge** shows (yellow/red)
4. **Create Purchase** to replenish
5. **Verify Alert Disappears** after stock update

**Expected Result:** System correctly identifies and alerts on low stock.

---

### Scenario 4: Coupon Application Test
**Goal:** Test discount functionality

1. **Navigate to Coupons**
2. **View Existing Coupon** (e.g., WELCOME50)
3. **Note Conditions:**
   - Min order: ₹200
   - Discount: ₹50 off
4. **Go to Orders**
5. **Find Order > ₹200**
6. **Apply Coupon Code** (if functionality exists)
7. **Verify Discount Applied**

**Expected Result:** Coupon reduces order total correctly.

---

### Scenario 5: Multi-Store Inventory Test
**Goal:** Verify store-specific inventory isolation

1. **Navigate to Inventory**
2. **Filter by Store 1** (e.g., Guntur Main)
3. **Note product X stock:** 50 units
4. **Switch to Store 2** (e.g., Vijayawada Central)
5. **Check same product X:** Different stock level
6. **Create order from Store 1**
7. **Verify:** Only Store 1 inventory affected

**Expected Result:** Each store maintains independent inventory.

---

### Scenario 6: Agent Assignment Test
**Goal:** Test delivery agent workflow

1. **Navigate to Delivery Agents**
2. **View Active Agents**
3. **Note agent assigned store**
4. **Go to Orders**
5. **Assign order to agent** (must be from same store)
6. **Try assigning to wrong store agent** → Should fail or warn
7. **Check agent's order list**
8. **Update order to delivered**
9. **Verify agent completion count**

**Expected Result:** Agents can only handle orders from their assigned store.

---

### Scenario 7: Refund Processing
**Goal:** Test refund workflow

1. **Navigate to Orders**
2. **Find delivered order** with payment status "paid"
3. **Note order total** (e.g., ₹450)
4. **Go to Refunds**
5. **Create new refund:**
   - Select the order
   - Set refund amount: ₹450 (full refund)
   - Reason: "Damaged product"
6. **Process Refund**
7. **Verify payment status** updated

**Expected Result:** Refund recorded, payment status reflects refund.

---

### Scenario 8: Product Variant Stock Calculation
**Goal:** Verify bulk-to-retail conversion

1. **Navigate to Bulk Inventory**
2. **Find Rice** with 100kg available bulk stock
3. **Check Variant Availability column:**
   - 1kg variant: Should show 100 units possible
   - 5kg variant: Should show 20 units possible
   - 10kg variant: Should show 10 units possible
4. **Place order for 10 bags of 5kg rice** (50kg total)
5. **Check bulk inventory:** Reserved = 50kg, Available = 50kg
6. **Mark order as delivered**
7. **Verify:** Total quantity reduced by 50kg

**Expected Result:** System correctly calculates packageable units.

---

### Scenario 9: Search and Filter Test
**Goal:** Test search functionality across modules

**Products:**
- Search "tomato" → Should find tomato products
- Filter by category "Vegetables"
- Search within filtered results

**Orders:**
- Search by customer name
- Filter by date range
- Filter by payment method
- Combine multiple filters

**Inventory:**
- Search product name
- Filter by store
- Filter by low stock only

**Expected Result:** All searches return accurate results.

---

### Scenario 10: Data Integrity Test
**Goal:** Verify foreign key constraints and cascading

1. **Try to delete category with products** → Should prevent or cascade
2. **Try to delete store with inventory** → Should prevent or cascade
3. **Try to delete product with orders** → Should prevent
4. **Delete delivery agent** → Orders should remain but agent = null
5. **Deactivate product** → Should not appear in new orders

**Expected Result:** Data relationships maintained, no orphaned records.

---

## Performance Testing

### Load Testing Points
- [ ] Dashboard with 1000+ orders
- [ ] Inventory page with 500+ items
- [ ] Product search with 100+ products
- [ ] Orders list pagination
- [ ] Analytics with large date range

### Expected Response Times
- Dashboard load: < 2 seconds
- Search results: < 500ms
- Order status update: < 1 second
- Inventory query: < 1 second

---

## Security Testing

### Authentication
- [ ] Cannot access pages without login
- [ ] Session expires after timeout
- [ ] Logout clears session

### Authorization (RLS)
- [ ] Users only see data they're authorized for
- [ ] Cannot modify other users' data via API
- [ ] Admin vs. regular user permissions

---

## Browser Testing

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

Test responsive design:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## Known Issues / Edge Cases

1. **Empty States:** Verify UI shows helpful messages when no data
2. **Network Errors:** Test behavior when API calls fail
3. **Concurrent Updates:** Two users editing same record
4. **Image Loading:** Handle broken image URLs
5. **Large Numbers:** Test with orders > ₹1,00,000
6. **Date Boundaries:** Test with past/future dates
7. **Special Characters:** Product names with symbols

---

## Quick Test Script

**15-Minute Smoke Test:**
1. Login ✓
2. View Dashboard ✓
3. Check Orders page ✓
4. Open one order detail ✓
5. View Products list ✓
6. Check Inventory page ✓
7. View Bulk Inventory ✓
8. Check Delivery Agents ✓
9. View Payments ✓
10. Check Analytics ✓
11. Logout ✓

If all 11 steps work, core functionality is operational.

---

## Reporting Bugs

When you find an issue, document:
1. **What you were doing** (steps to reproduce)
2. **What you expected** to happen
3. **What actually happened**
4. **Browser and screen size**
5. **Any error messages** (check browser console)
6. **Screenshots** if visual issue

---

## Advanced Testing

### SQL Query Testing
Access Supabase dashboard to:
- Verify RLS policies work
- Check database constraints
- Test complex queries
- Validate data types

### API Testing
Use browser DevTools Network tab to:
- Monitor API calls
- Check request/response data
- Verify error handling
- Test loading states

---

## Test Data Cleanup

To reset and start fresh:
1. The dummy data script clears all data first
2. Re-run `insertDummyData()` function
3. Or manually delete records from Supabase dashboard

---

## Support Contacts

- Database: Check Supabase logs
- Frontend Errors: Browser console
- Auth Issues: Supabase Auth logs

---

## Conclusion

This admin panel is a comprehensive system with many interconnected features. Focus on:
1. **Core flows first** (orders, inventory, purchases)
2. **Data integrity** (relationships maintained)
3. **User experience** (intuitive, fast, helpful)

The two-level inventory system is the most complex part - ensure you understand how bulk stock converts to retail variants.

Happy testing! 🚀
