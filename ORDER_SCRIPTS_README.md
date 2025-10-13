# Order Creation Scripts for Zepta Admin

These SQL scripts help you create realistic orders with proper inventory reduction and revenue tracking.

## 📁 Available Scripts

### 1. `create-orders-with-inventory-reduction.sql`
**Main comprehensive script** - Creates 20 orders with full details

**Features:**
- ✅ Reduces `stock_quantity` in `store_inventory`
- ✅ Creates orders with 2-3 items per order
- ✅ Generates payment records
- ✅ Creates order activity logs
- ✅ Mix of order statuses (delivered, pending, out for delivery, etc.)
- ✅ Both COD and Online payment methods
- ✅ Random discounts (10% of orders)
- ✅ Assigns delivery agents to relevant orders
- ✅ Shows summary statistics after creation

**What it tracks:**
- Total orders created
- Total revenue generated
- Paid vs pending orders
- Low stock items after order fulfillment
- Recent orders with details
- Revenue by store

### 2. `quick-create-orders.sql`
**Quick script** - Creates 10 orders (safe to run multiple times)

**Features:**
- ✅ Creates 10 orders each time you run it
- ✅ Automatically checks stock availability
- ✅ Reduces inventory
- ✅ Creates payment records
- ✅ Simple and fast execution
- ✅ Safe to run repeatedly

**Perfect for:**
- Testing the admin panel
- Seeing real-time inventory changes
- Generating more test data quickly

### 3. `verify-inventory-and-revenue.sql`
**Analytics & verification script** - Shows comprehensive reports

**Reports included:**
1. **Stock Levels by Store** - Total products and items per store
2. **Low Stock Alert** - Items below threshold that need restocking
3. **Revenue Summary** - Total orders, revenue, discounts, avg order value
4. **Revenue by Store** - Performance of each Zepta store
5. **Daily Revenue** - Last 30 days revenue breakdown
6. **Top Selling Products** - Best performers by revenue
7. **Payment Method Breakdown** - COD vs Online split
8. **Order Status Distribution** - Orders by status
9. **Recent Orders** - Last 10 orders with details
10. **Top Customers** - Highest spending customers

## 🚀 How to Use

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click "New Query"

### Step 2: Run the Main Script
1. Copy the entire content of `create-orders-with-inventory-reduction.sql`
2. Paste into SQL Editor
3. Click **Run** or press `Ctrl/Cmd + Enter`
4. Wait for execution (takes 10-30 seconds)
5. Check the results in the bottom panel

**Expected output:**
```
NOTICE: === Starting Order Creation with Inventory Reduction ===
NOTICE: Created 5 orders...
NOTICE: Created 10 orders...
NOTICE: Created 15 orders...
NOTICE: Created 20 orders...
NOTICE: === Order Creation Complete ===
NOTICE: Total orders created: 20
NOTICE: Total revenue: ₹18,450.00
NOTICE: Paid orders: 17
```

### Step 3: Verify Inventory Changes
1. Copy content of `verify-inventory-and-revenue.sql`
2. Paste into SQL Editor
3. Click **Run**
4. Review all the reports

### Step 4: Create More Orders (Optional)
1. Copy content of `quick-create-orders.sql`
2. Run it as many times as you want
3. Each run creates 10 new orders
4. Great for testing and demos

## 📊 What Gets Updated

### Database Tables Modified:
1. **`orders`** - New orders created
2. **`order_items`** - Items added to orders
3. **`store_inventory`** - ⚠️ **STOCK REDUCED** (this is what you wanted!)
4. **`payments`** - Payment records created
5. **`order_activity_log`** - Activity tracking

### Data Generated:
- Real customer orders (from your 15 customers)
- Proper product variants with prices
- Inventory reductions (you'll see quantities decrease)
- Revenue data (for Analytics page)
- Payment records (for Payments page)
- Order history (for Orders page)

## 💡 Use Cases

### For Testing Admin Panel:
1. **Orders Page** - See real orders with customer names
2. **Inventory Page** - Watch stock levels decrease
3. **Analytics Page** - View revenue charts and statistics
4. **Payments Page** - Track COD and Online payments
5. **Dashboard** - See updated order counts and revenue

### For Demo/Presentation:
1. Run `quick-create-orders.sql` before demo
2. Show real-time inventory changes
3. Display revenue analytics
4. Demonstrate order management

### For Development Testing:
1. Test low stock alerts
2. Verify inventory reduction logic
3. Test order status workflows
4. Validate revenue calculations

## ⚠️ Important Notes

### Stock Safety:
- Scripts automatically check stock availability
- Never reduces stock below 2 units (safety buffer)
- Skips orders if insufficient stock
- Shows warnings if stock unavailable

### Data Integrity:
- ✅ All foreign keys maintained
- ✅ Proper timestamps
- ✅ Valid order statuses
- ✅ Correct payment status based on delivery status
- ✅ Delivery agents assigned only to relevant orders

### Revenue Tracking:
- ✅ Orders marked as 'paid' when delivered
- ✅ Online payments automatically marked as 'paid'
- ✅ COD orders marked 'paid' only when delivered
- ✅ Proper discount calculations
- ✅ Delivery charges included

## 🔄 Run Multiple Times

All scripts are **safe to run multiple times**:
- They create NEW orders each time
- They don't duplicate or overwrite existing data
- Stock continues to decrease (realistic)
- Revenue continues to increase

## 📈 Expected Results

After running the main script once, you should see:
- **~75 total orders** (55 existing + 20 new)
- **~₹60,000-80,000 total revenue** (varies based on items)
- **Stock reduced** by 40-80 units across various products
- **Multiple low stock alerts** (items below threshold)

## 🛠️ Troubleshooting

### "No stock available" messages:
- **Solution**: Some stores may have run out of specific items
- Run the inventory adjustment page to restock
- Or focus on stores with higher stock

### "Error creating order" messages:
- **Normal**: Script continues with next order
- Happens when constraints aren't met
- Check the specific error message

### Revenue not showing in Analytics:
- **Check**: Make sure orders have `payment_status = 'paid'`
- **Verify**: Orders must be in valid date range
- **Refresh**: The Analytics page cache

## 📞 Need More Data?

### To create 100 orders:
Change `FOR i IN 1..20 LOOP` to `FOR i IN 1..100 LOOP` in the main script

### To create larger orders:
Modify the quantity calculations:
```sql
v_qty1 := LEAST((RANDOM() * 10 + 1)::INTEGER, v_qty1 - 1);
```

### To create orders from specific date:
Modify the created_at timestamp:
```sql
NOW() - INTERVAL '1 day' * 7  -- Last 7 days only
```

## ✅ Quick Checklist

Before running scripts:
- [ ] You have 15 customers created
- [ ] Stores have inventory (stock_quantity > 0)
- [ ] You have delivery agents
- [ ] You're in Supabase SQL Editor

After running scripts:
- [ ] Check Orders page - see new orders
- [ ] Check Inventory page - see reduced stock
- [ ] Check Analytics page - see revenue data
- [ ] Run verify script - see reports

---

**Happy testing! 🎉**

Your Zepta admin panel should now have realistic order data with proper inventory tracking and revenue calculations.
