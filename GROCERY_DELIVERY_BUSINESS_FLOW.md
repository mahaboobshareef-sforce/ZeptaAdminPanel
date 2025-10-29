# 🥬 Grocery & Vegetables Delivery - Complete Business Flow Guide

This document explains how the admin panel works for a grocery and vegetable delivery business, focusing on **business operations** rather than technical implementation.

---

## 📋 Table of Contents

1. [Business Overview](#business-overview)
2. [Dashboard - The Control Center](#dashboard---the-control-center)
3. [Managing Categories](#managing-categories)
4. [Managing Products & Variants](#managing-products--variants)
5. [Purchase Management - Buying Stock](#purchase-management---buying-stock)
6. [Inventory Management](#inventory-management)
7. [Bulk Inventory Updates](#bulk-inventory-updates)
8. [Inventory Adjustments](#inventory-adjustments)
9. [Order Management](#order-management)
10. [Revenue & Profit Analysis](#revenue--profit-analysis)
11. [Complete Business Example](#complete-business-example)

---

## 🏪 Business Overview

### What Type of Business Is This?

This is a **grocery and vegetable delivery service** where:
- You purchase fresh produce and groceries from wholesalers/farmers
- You store them in your warehouse/dark store
- Customers order through an app
- You deliver to their doorstep within 10-30 minutes

Think of it like: **Blinkit, Zepto, Swiggy Instamart, BigBasket Now**

### Key Business Challenges

1. **Multiple Units**: Same product sold in different quantities
   - Tomatoes: 250g, 500g, 1kg, 2kg
   - Milk: 500ml, 1L
   - Rice: 1kg, 5kg, 10kg

2. **Perishability**: Products expire quickly
   - Need to track freshness
   - Manage spoilage/damage

3. **Price Fluctuation**: Vegetable prices change daily
   - Buy tomatoes at ₹40/kg today
   - Next week might be ₹60/kg

4. **Bulk Purchase, Small Sales**:
   - Buy 100kg potatoes from farmer
   - Sell in 500g, 1kg, 2kg packets

---

## 🎯 Dashboard - The Control Center

### What You See First

When you log into the admin panel, the **Dashboard** is your home screen. It shows:

**Today's Overview:**
- **Total Orders**: 156 orders today
- **Revenue**: ₹45,670 earned today
- **Pending Orders**: 12 orders waiting to be processed
- **Low Stock Alerts**: 8 items running low

**Quick Stats:**
- Orders by status (Pending, Confirmed, Out for Delivery, Delivered)
- Top selling products today
- Active delivery agents and their current status
- Recent orders list

**Actions You Can Take:**
- Click on pending orders to process them
- View low stock items and reorder
- See which delivery agents are free
- Check today's revenue vs yesterday

### Why This Matters

The dashboard gives you a **snapshot of your entire business** in one screen. You can quickly identify:
- If orders are piling up (need more staff)
- If products are running out (need to reorder)
- If delivery agents are overwhelmed (need more drivers)
- If sales are up or down compared to yesterday

---

## 📂 Managing Categories

### What Are Categories?

Categories help **organize your products** so customers can find them easily.

### Category Structure for Grocery Business

```
Fruits & Vegetables
├── Fresh Vegetables
│   ├── Leafy Greens (Spinach, Cabbage, Lettuce)
│   ├── Root Vegetables (Potato, Onion, Carrot)
│   └── Other Vegetables (Tomato, Capsicum, Brinjal)
├── Fresh Fruits
│   ├── Seasonal Fruits (Mango, Watermelon)
│   └── Regular Fruits (Apple, Banana, Orange)

Dairy & Bakery
├── Milk & Cream
├── Bread & Buns
└── Eggs

Staples & Cooking
├── Rice & Grains
├── Dals & Pulses
└── Cooking Oil

Beverages
├── Tea & Coffee
├── Cold Drinks
└── Juices

Snacks & Packaged Foods
├── Chips & Namkeen
├── Biscuits & Cookies
└── Instant Foods
```

### How to Manage Categories

**Step 1: Go to "Categories" Tab**
- Click on "Categories" in the sidebar
- You see a list of all your categories in a tree structure

**Step 2: Create a New Category**
- Click "Add Category"
- Enter category name: "Fresh Vegetables"
- Upload a category image (optional)
- Select parent category (if it's a sub-category)
- Set display order (controls position on app)
- Mark as active/inactive
- Save

**Step 3: Edit or Reorder Categories**
- Drag and drop categories to reorder them
- Edit names, images, or parent categories
- Deactivate categories you don't want to show

**Business Example:**

```
Scenario: Launching a new "Organic Vegetables" section

Step 1: Create parent category "Organic Vegetables"
Step 2: Add sub-categories:
  - Organic Leafy Greens
  - Organic Root Vegetables
  - Organic Exotic Vegetables
Step 3: Upload attractive images for each
Step 4: Set display order to show at top
Step 5: Mark all as active
```

### Why This Matters

Good category organization means:
- Customers find products faster
- You can run category-specific promotions
- Analytics show which categories sell most
- Easy to manage large product catalogs

---

## 🥬 Managing Products & Variants

### Understanding Products vs Variants

This is the **most important concept** for grocery business.

**Product** = The base item (e.g., "Tomato")
**Variant** = Different quantities/packages (e.g., "250g", "500g", "1kg")

### Why Use Variants?

**Without Variants (❌ Wrong Way):**
```
You create separate products:
- Tomato 250g
- Tomato 500g
- Tomato 1kg
- Tomato 2kg

Problem: If you want to update tomato price, description, or image,
you have to edit 4 separate products!
```

**With Variants (✅ Right Way):**
```
Product: Tomato
- Description: Fresh red tomatoes
- Images: [tomato1.jpg, tomato2.jpg]
- Category: Fresh Vegetables

Variants:
- 250g → ₹20 (SKU: TOM-250)
- 500g → ₹35 (SKU: TOM-500)
- 1kg → ₹65 (SKU: TOM-1K)
- 2kg → ₹120 (SKU: TOM-2K)

Benefit: Update description/image once, applies to all variants!
```

### How to Create Products with Variants

**Step 1: Go to "Products" Tab**
- Click "Products" in sidebar
- You see a list of all products

**Step 2: Click "Add New Product"**

**Step 3: Fill Basic Information**
- **Product Name**: "Tomato" (simple, clear name)
- **Category**: Select "Fresh Vegetables"
- **Description**: "Fresh, juicy red tomatoes sourced daily from local farms"
- **Upload Images**: Add 2-3 clear product photos
- **Base Price**: ₹60 (this is just a reference, variants will have actual prices)
- **Cost Price**: ₹40/kg (what you paid to farmer)
- **MRP**: ₹80/kg
- **SKU**: TOM (base SKU)
- **Tags**: Add tags like "fresh", "local", "vegetables"
- **Mark as Active**: Yes
- **Featured Product**: Yes (if you want to highlight it)

**Step 4: Add Variants**

Click "Add Variant" and for each quantity:

**Variant 1: 250g Pack**
- **Variant Name**: "250g"
- **SKU**: TOM-250 (unique identifier)
- **Selling Price**: ₹20
- **Cost Price**: ₹10 (250g = 0.25kg × ₹40/kg)
- **Attributes**: {"weight": "250g", "unit": "grams"}
- **Active**: Yes

**Variant 2: 500g Pack**
- **Variant Name**: "500g"
- **SKU**: TOM-500
- **Selling Price**: ₹35
- **Cost Price**: ₹20 (500g = 0.5kg × ₹40/kg)
- **Attributes**: {"weight": "500g", "unit": "grams"}
- **Active**: Yes

**Variant 3: 1kg Pack**
- **Variant Name**: "1kg"
- **SKU**: TOM-1K
- **Selling Price**: ₹65
- **Cost Price**: ₹40
- **Attributes**: {"weight": "1kg", "unit": "kilograms"}
- **Active**: Yes

**Variant 4: 2kg Pack**
- **Variant Name**: "2kg"
- **SKU**: TOM-2K
- **Selling Price**: ₹120
- **Cost Price**: ₹80
- **Attributes**: {"weight": "2kg", "unit": "kilograms"}
- **Active**: Yes

**Step 5: Save Product**

Now you have **1 product with 4 variants**!

### More Product Examples

#### Example 1: Milk (Liquid Measure)

**Product: Fresh Cow Milk**

Variants:
- 500ml → ₹25 (SKU: MILK-500ML) | Cost: ₹18
- 1 Liter → ₹45 (SKU: MILK-1L) | Cost: ₹32
- 2 Liters → ₹85 (SKU: MILK-2L) | Cost: ₹60

Attributes:
- {"volume": "500ml", "unit": "milliliters"}
- {"volume": "1L", "unit": "liters"}
- {"volume": "2L", "unit": "liters"}

#### Example 2: Rice (Bulk Items)

**Product: Basmati Rice**

Variants:
- 1kg → ₹120 (SKU: RICE-BAS-1K) | Cost: ₹85
- 5kg → ₹550 (SKU: RICE-BAS-5K) | Cost: ₹400
- 10kg → ₹1,050 (SKU: RICE-BAS-10K) | Cost: ₹780

Attributes:
- {"weight": "1kg", "package": "pouch"}
- {"weight": "5kg", "package": "bag"}
- {"weight": "10kg", "package": "bag"}

#### Example 3: Leafy Greens (Count/Bunches)

**Product: Spinach (Palak)**

Variants:
- 1 Bunch → ₹20 (SKU: SPIN-1B) | Cost: ₹12
- 250g (Cleaned & Cut) → ₹35 (SKU: SPIN-250G) | Cost: ₹25

Attributes:
- {"quantity": "1 bunch", "unit": "bunch", "type": "fresh"}
- {"weight": "250g", "unit": "grams", "type": "cleaned"}

#### Example 4: Eggs (Count)

**Product: Farm Fresh Eggs**

Variants:
- 6 Eggs → ₹45 (SKU: EGG-6) | Cost: ₹30
- 12 Eggs (1 Dozen) → ₹85 (SKU: EGG-12) | Cost: ₹58
- 30 Eggs (Tray) → ₹195 (SKU: EGG-30) | Cost: ₹145

Attributes:
- {"count": "6", "unit": "pieces"}
- {"count": "12", "unit": "pieces", "package": "dozen"}
- {"count": "30", "unit": "pieces", "package": "tray"}

#### Example 5: Cooking Oil (Multiple Brands & Sizes)

**Product: Fortune Sunflower Oil**

Variants:
- 500ml → ₹85 (SKU: OIL-FOR-500ML) | Cost: ₹70
- 1 Liter → ₹160 (SKU: OIL-FOR-1L) | Cost: ₹135
- 5 Liters → ₹750 (SKU: OIL-FOR-5L) | Cost: ₹650

**Product: Saffola Gold Oil** (Separate product, different brand)

Variants:
- 500ml → ₹110
- 1 Liter → ₹205
- 5 Liters → ₹980

### Managing Products (Edit/Delete)

**Search & Filter:**
- Search by name: "tomato"
- Filter by category: "Fresh Vegetables"
- Filter by stock status: "Low Stock", "Out of Stock"
- Sort by: Name, Price, Created Date

**Edit Product:**
- Click on any product
- Update details (name, description, images)
- Edit variant prices
- Add new variants
- Remove variants
- Save changes

**Bulk Actions:**
- Select multiple products
- Mark as featured/unfeatured
- Activate/deactivate
- Change category
- Export to CSV

### Why This Matters

Proper product organization with variants means:
- Easy to manage hundreds of products
- Quick price updates across all sizes
- Accurate inventory tracking per variant
- Customer sees all size options in one place
- Better analytics (which size sells more)

---

## 🛒 Purchase Management - Buying Stock

### What Is Purchase Management?

This is where you **record what you buy** from suppliers (farmers, wholesalers, distributors).

### Why Track Purchases?

- Know how much money you're spending
- Track supplier reliability
- Calculate actual profit (need to know cost price)
- Automatically update inventory when stock arrives
- Manage payments to suppliers

### How Purchase Management Works

#### Step 1: Go to "Purchase Management" Tab

You see:
- List of all purchase orders
- Filter by: Draft, Sent, Confirmed, Received, Cancelled
- Search by PO number or supplier
- Button: "Create Purchase Order"

#### Step 2: Add Suppliers (One-Time Setup)

Before creating purchase orders, add your suppliers:

**Click "Manage Suppliers"**

**Add Supplier:**
- **Supplier Name**: "Green Farm Vegetables"
- **Contact Person**: "Ramesh Kumar"
- **Phone**: "+91-9876543210"
- **Email**: "ramesh@greenfarm.com"
- **Address**: "APMC Market, Bangalore"
- **Payment Terms**: "Pay within 7 days"
- **Notes**: "Best quality tomatoes and leafy greens"
- **Active**: Yes

**Add More Suppliers:**
- "Mother Dairy" (for milk, paneer, curd)
- "Amul Distributor" (for butter, cheese)
- "Local Farmers Collective" (for organic produce)
- "Metro Cash & Carry" (for packaged goods)

#### Step 3: Create Purchase Order

**Click "Create Purchase Order"**

**Fill PO Details:**
- **PO Number**: Auto-generated (PO20250129001)
- **Supplier**: Select "Green Farm Vegetables"
- **Store**: Select "Main Warehouse" (which location will receive stock)
- **Order Date**: Today (29-01-2025)
- **Expected Delivery**: Tomorrow (30-01-2025)
- **Notes**: "Morning delivery before 8 AM"

**Add Items to Purchase Order:**

This is where it gets interesting for vegetables!

**Item 1: Tomatoes (Bulk Purchase)**
- **Product**: Tomato
- **Variant**: Don't select a variant yet!
- **Quantity Ordered**: 50 kg (you're buying bulk)
- **Unit Cost Price**: ₹40 per kg
- **Total Cost**: ₹2,000 (50 × ₹40)
- **Notes**: "Grade A quality"

**Item 2: Onions (Bulk Purchase)**
- **Product**: Onion
- **Quantity**: 100 kg
- **Unit Cost**: ₹30 per kg
- **Total**: ₹3,000

**Item 3: Spinach (By Bunch)**
- **Product**: Spinach
- **Quantity**: 50 bunches
- **Unit Cost**: ₹12 per bunch
- **Total**: ₹600

**Item 4: Milk (By Liters)**
- **Product**: Fresh Cow Milk
- **Quantity**: 100 liters
- **Unit Cost**: ₹32 per liter
- **Total**: ₹3,200

**Calculate Totals:**
- **Subtotal**: ₹8,800 (sum of all items)
- **Tax (if applicable)**: ₹0 (many farm products exempt)
- **Transportation**: ₹200
- **Total Amount**: ₹9,000

**Save as Draft** or **Send to Supplier**

#### Step 4: Purchase Order Lifecycle

**Status: Draft**
- You're still editing
- Can add/remove items
- Can change quantities
- Not sent to supplier yet

**Status: Sent**
- You sent the PO to supplier (via WhatsApp/Email/Call)
- Waiting for supplier confirmation
- Can still cancel if needed

**Status: Confirmed**
- Supplier confirmed they can supply
- They'll deliver tomorrow morning
- You're waiting for delivery

**Status: Received** (Most Important!)
- Stock has arrived at your warehouse
- Now you need to **receive** it in the system
- This updates your inventory automatically

#### Step 5: Receiving Stock (The Critical Step)

When the truck arrives with vegetables:

**Click on the Purchase Order → Click "Receive Stock"**

**Verify Quantities:**
- **Tomatoes**: Ordered 50kg, Received 50kg ✓
- **Onions**: Ordered 100kg, Received 98kg (2kg damaged) ⚠️
- **Spinach**: Ordered 50 bunches, Received 50 bunches ✓
- **Milk**: Ordered 100L, Received 100L ✓

**Update Received Quantities:**
- Mark tomatoes: 50kg received
- Mark onions: 98kg received (note: 2kg damaged)
- Mark spinach: 50 bunches received
- Mark milk: 100L received

**Click "Mark as Received"**

### What Happens When You Receive Stock?

**Behind the scenes, the system:**

1. **Converts Bulk to Variants**

You bought 50kg tomatoes in bulk. System divides it into your selling variants:

```
50kg tomatoes received =
- 200 units of 250g packs (50kg ÷ 0.25kg)
- OR 100 units of 500g packs (50kg ÷ 0.5kg)
- OR 50 units of 1kg packs (50kg ÷ 1kg)
- OR 25 units of 2kg packs (50kg ÷ 2kg)

You choose which variants to stock!
```

**During receiving, you specify:**
- Pack 30kg as 1kg packs = 30 units
- Pack 15kg as 500g packs = 30 units
- Pack 5kg as 250g packs = 20 units
- Total: 50kg accounted for

2. **Updates Inventory for Each Variant**

```
Inventory before:
- Tomato 1kg: 10 units
- Tomato 500g: 5 units
- Tomato 250g: 20 units

After receiving:
- Tomato 1kg: 40 units (+30)
- Tomato 500g: 35 units (+30)
- Tomato 250g: 40 units (+20)
```

3. **Updates Cost Prices**

System updates the cost price for each variant based on what you paid:

```
You paid ₹40/kg for tomatoes

System calculates:
- Tomato 250g: Cost = ₹40 × 0.25 = ₹10
- Tomato 500g: Cost = ₹40 × 0.5 = ₹20
- Tomato 1kg: Cost = ₹40 × 1 = ₹40
- Tomato 2kg: Cost = ₹40 × 2 = ₹80
```

4. **Creates Adjustment Log**

System logs:
- "Restock: +30 units of Tomato 1kg via PO20250129001"
- "Restock: +30 units of Tomato 500g via PO20250129001"
- "Restock: +20 units of Tomato 250g via PO20250129001"

### Real-World Purchase Scenarios

#### Scenario 1: Daily Vegetable Purchase

**Every Morning at 6 AM:**
- Your buyer goes to APMC market
- Checks vegetable rates (they change daily!)
- Buys based on today's demand forecast

**Today's Purchase:**
```
Tomatoes: 50kg @ ₹40/kg = ₹2,000 (yesterday was ₹35/kg)
Onions: 100kg @ ₹30/kg = ₹3,000 (stable price)
Potatoes: 80kg @ ₹25/kg = ₹2,000
Cabbage: 30kg @ ₹20/kg = ₹600
Carrots: 40kg @ ₹35/kg = ₹1,400

Total Investment: ₹9,000
```

**In Admin Panel:**
- Create PO for "Green Farm Vegetables"
- Add all items with today's prices
- Mark as received immediately (you bought from market)
- Specify how to pack each item
- Inventory updates automatically

#### Scenario 2: Weekly Staples Order

**Every Monday:**
- Order rice, dal, oil, sugar from distributor
- Larger quantities, stable prices
- Delivery in 2-3 days

**This Week's Order:**
```
Basmati Rice: 100kg @ ₹85/kg = ₹8,500
Toor Dal: 50kg @ ₹120/kg = ₹6,000
Sunflower Oil: 50L @ ₹135/L = ₹6,750
Sugar: 100kg @ ₹45/kg = ₹4,500

Total: ₹25,750
```

**In Admin Panel:**
- Create PO for "Metro Cash & Carry"
- Status: Sent (waiting for delivery)
- When stock arrives (Wednesday), mark as received
- Specify: Pack rice in 1kg, 5kg, 10kg bags
- Inventory updates

#### Scenario 3: Milk & Dairy (Daily Supply)

**Every Morning:**
- Milk delivery from Mother Dairy
- Fixed daily order, same price

**Daily Delivery:**
```
Fresh Milk: 200L @ ₹32/L = ₹6,400
Paneer: 10kg @ ₹320/kg = ₹3,200
Curd: 50 units (400g each) @ ₹25 = ₹1,250

Total: ₹10,850
```

**In Admin Panel:**
- Create PO (can use "Recurring PO" feature)
- Auto-created daily at 6 AM
- Delivery guy brings stock
- You receive in system
- Inventory updated

### Purchase Reports

**View Purchase Analytics:**

**By Supplier:**
- How much spent per supplier this month
- Which supplier is most reliable
- Average delivery time

**By Product:**
- How much tomatoes bought this month
- Price trend (was ₹35/kg, now ₹40/kg)
- Most purchased items

**By Time:**
- Daily purchase amount
- Weekly trends
- Monthly spending

**Payment Tracking:**
- Outstanding payments to suppliers
- Payment due dates
- Payment history

---

## 📊 Inventory Management

### What You See in Inventory Tab

**Inventory List View:**
- Product name and variant
- Current stock quantity
- Reserved quantity (for pending orders)
- Available quantity (can be sold)
- Store location
- Last restocked date
- Reorder level
- Status: Healthy / Low Stock / Out of Stock

### Understanding Stock Levels

**Example: Tomato 1kg**

```
Current Stock: 50 units
Reserved: 8 units (for pending orders)
Available: 42 units (what you can sell now)

Reorder Level: 20 units (alert threshold)
Reorder Quantity: 50 units (how many to order when low)
```

**Status Indicators:**

🟢 **Healthy Stock**: Available > Reorder Level
- Tomato 1kg: 42 available > 20 reorder level = Healthy

🟡 **Low Stock**: Available ≤ Reorder Level
- Onion 1kg: 15 available ≤ 20 reorder level = Low Stock
- Action needed: Order more onions!

🔴 **Out of Stock**: Available = 0
- Cabbage 1kg: 0 available = Out of Stock
- Action needed: Order urgently or hide from app

### Viewing Inventory

**Filter Options:**
- By Category: "Fresh Vegetables"
- By Status: "Low Stock" only
- By Store: "Main Warehouse"
- Search: "tomato"

**Sort Options:**
- By stock level (low to high)
- By last restocked date
- By product name
- By value (quantity × cost price)

### Inventory Actions

**View Product Details:**
- Click on any inventory item
- See complete stock history
- View all adjustments (restock, damage, theft)
- Check which purchase orders supplied this stock

**Set Reorder Levels:**
- Click "Set Reorder Level"
- Based on daily sales, set threshold
- Example: Sell 30 units of Tomato 1kg daily
  - Set reorder level: 40 units (1.3 days buffer)
  - Set reorder quantity: 60 units (2 days stock)

**Transfer Between Stores:**
- Select product: Tomato 1kg
- From: Main Warehouse (50 units)
- To: Express Delivery Hub (transfer 20 units)
- Reason: "High demand area"
- Confirm
- Both inventories updated

### Inventory Alerts

**Daily Alert Email (8 AM):**
```
Low Stock Alert - 8 Items

Critical (Out of Stock):
- Cabbage 1kg: 0 units
- Spinach 250g: 0 units

Low Stock (Below Threshold):
- Onion 1kg: 15 units (reorder: 20)
- Tomato 500g: 18 units (reorder: 25)
- Milk 1L: 12 units (reorder: 30)
- Potato 1kg: 25 units (reorder: 30)
- Carrot 500g: 8 units (reorder: 15)
- Rice 1kg: 22 units (reorder: 25)

Action: Create purchase orders for these items
```

**Real-Time Dashboard Alert:**
- Red notification badge on Inventory tab
- Shows count of low stock items
- Quick link to filtered view

### Managing Expiry (For Perishable Items)

**Product: Milk 1L**

```
Batch 1: 50 units - Expires: 30-01-2025 (tomorrow!)
Batch 2: 80 units - Expires: 31-01-2025
Batch 3: 40 units - Expires: 01-02-2025
```

**Inventory View Shows:**
- Total: 170 units
- Expiring Soon (next 2 days): 50 units ⚠️
- Action: Discount expiring batch or remove from sale

**System Feature: FIFO (First In First Out)**
- Orders automatically pick from oldest batch first
- Batch 1 sold first, then Batch 2, then Batch 3
- Reduces wastage

---

## 📤 Bulk Inventory Updates

### What Is Bulk Inventory?

Update stock levels for **hundreds of products at once** using a CSV file.

### When to Use Bulk Upload

**Scenario 1: Initial Setup**
- You're launching the business
- Need to add inventory for 500 products
- Manually entering each = 5 hours
- Bulk upload = 10 minutes

**Scenario 2: After Physical Stock Count**
- You did physical inventory audit
- Counted actual stock for all products
- Need to sync system with reality
- Export → Update in Excel → Import back

**Scenario 3: Weekly Restock**
- Regular weekly order arrived
- 100 items restocked
- Update all at once

### How to Use Bulk Upload

#### Step 1: Download Template

**Click "Bulk Inventory" Tab → "Download Template"**

You get a CSV file:
```csv
sku,store_id,quantity,reorder_level,reorder_quantity
TOM-1K,main-warehouse,50,20,50
TOM-500G,main-warehouse,30,25,40
TOM-250G,main-warehouse,40,30,50
ONI-1K,main-warehouse,80,30,60
ONI-500G,main-warehouse,60,40,50
POT-1K,main-warehouse,100,40,70
MILK-1L,main-warehouse,120,30,80
RICE-1K,main-warehouse,150,25,100
```

#### Step 2: Fill in Your Data

**Open in Excel/Google Sheets**

Update quantities based on what you have:

```csv
sku,store_id,quantity,reorder_level,reorder_quantity
TOM-1K,main-warehouse,45,20,50
TOM-500G,main-warehouse,28,25,40
TOM-250G,main-warehouse,35,30,50
ONI-1K,main-warehouse,75,30,60
ONI-500G,main-warehouse,55,40,50
POT-1K,main-warehouse,95,40,70
MILK-1L,main-warehouse,110,30,80
RICE-1K,main-warehouse,140,25,100
CAB-1K,main-warehouse,0,15,30
SPIN-250G,main-warehouse,0,20,40
```

#### Step 3: Upload CSV

**Click "Upload CSV" → Select File → Upload**

**System Validates:**
- ✓ All SKUs exist in system
- ✓ Store IDs are valid
- ✓ Quantities are positive numbers
- ✓ No duplicate SKUs
- ⚠️ Warning: Cabbage 1kg quantity is 0
- ⚠️ Warning: Spinach 250g quantity is 0

#### Step 4: Preview Changes

**System shows what will change:**

```
Preview: 10 products will be updated

Tomato 1kg: 50 → 45 (-5 units)
Tomato 500g: 30 → 28 (-2 units)
Tomato 250g: 40 → 35 (-5 units)
Onion 1kg: 80 → 75 (-5 units)
Cabbage 1kg: 10 → 0 (-10 units) ⚠️ Will be out of stock
Spinach 250g: 5 → 0 (-5 units) ⚠️ Will be out of stock
...
```

#### Step 5: Confirm Import

**Click "Confirm & Import"**

System:
- Updates all inventory records
- Creates adjustment logs for each change
- Sends notification if any items went out of stock
- Shows success message: "10 products updated successfully"

### Bulk Upload Best Practices

**1. Always Download Current Data First**
- Export current inventory
- Modify that file
- Re-import
- This prevents overwriting data accidentally

**2. Use SKU, Not Product Names**
- SKUs are unique identifiers
- Product names might have typos
- System matches by SKU

**3. Double Check Before Import**
- Review the preview carefully
- Look for unexpected changes
- Verify out-of-stock warnings

**4. Keep Backups**
- System maintains history
- But keep your CSV files as backup
- Easy to rollback if needed

---

## ⚙️ Inventory Adjustments

### What Are Inventory Adjustments?

**Manual corrections** to inventory with proper tracking. Used when stock changes for reasons other than sales or purchase orders.

### Types of Adjustments

#### 1. Damage / Spoilage (Most Common in Groceries)

**Scenario:**
- You had 50 units of Tomato 1kg
- 8 units got spoiled overnight
- Need to remove them from inventory

**How to Do:**
- Go to Inventory → Find Tomato 1kg
- Click "Adjust" → Select "Damage"
- Quantity: -8 units
- Reason: "Spoiled - overripe"
- Notes: "Found during morning quality check"
- Photo: (Upload photo of damaged goods)
- Submit

**Result:**
- Inventory: 50 → 42 units
- System logs: "Damage: -8 units on 29-01-2025"
- Adjusted by: Admin user
- Value lost: ₹320 (8 × ₹40 cost price)

**Business Impact:**
- Lost money: ₹320
- Need to order 8 more units
- Analyze: Why did they spoil? (too much stock, poor storage)

#### 2. Theft / Missing Items

**Scenario:**
- Stock audit shows discrepancy
- System says: 80 units Onion 1kg
- Physical count: 75 units
- 5 units missing (theft or miscounting)

**How to Do:**
- Click Adjust → Select "Theft"
- Quantity: -5 units
- Reason: "Discrepancy in stock audit"
- Notes: "Could be theft or count error"
- Submit

**Result:**
- Inventory: 80 → 75 units
- Log maintained for audit
- Value lost: ₹150

#### 3. Return from Customer

**Scenario:**
- Customer bought 2kg potatoes
- Called within 30 mins: "Potatoes are bad"
- You accept return
- Need to add back to inventory (but mark as damaged)

**How to Do:**
- Click Adjust → Select "Return"
- Quantity: +2 units (Potato 1kg)
- Reason: "Customer return - quality issue"
- Notes: "Order #ORD20250129045"
- Submit

- Then immediately:
- Click Adjust → Select "Damage"
- Quantity: -2 units
- Reason: "Customer returned - poor quality"
- Submit

**Result:**
- Inventory unchanged (added then removed)
- Customer refunded
- Loss recorded
- Quality issue flagged

#### 4. Restock (Manual Entry)

**Scenario:**
- Your buyer bought vegetables from market
- Paid cash, no formal PO
- Need to add to inventory manually

**How to Do:**
- Click Adjust → Select "Restock"
- Quantity: +30 units (Tomato 1kg)
- Reason: "Market purchase - cash"
- Notes: "Bought from APMC Market Sector 7"
- Cost: ₹40/kg
- Submit

**Result:**
- Inventory: +30 units
- Logged properly
- Cost price updated

#### 5. Correction (Fix Mistakes)

**Scenario:**
- Someone entered 100 instead of 10
- Need to fix the error

**How to Do:**
- Click Adjust → Select "Correction"
- Quantity: -90 units
- Reason: "Data entry error correction"
- Notes: "Was entered as 100, should be 10"
- Submit

### Adjustment History & Reports

**View All Adjustments:**
- Go to "Inventory Adjustments" tab
- See complete history of all adjustments

**Filter By:**
- Adjustment type: Damage only
- Date range: Last 7 days
- Product: Tomatoes only
- Adjusted by: Which staff member

**Analyze Losses:**

**Monthly Damage Report:**
```
January 2025 - Damage/Spoilage Report

Tomatoes: 45 units damaged = ₹1,800 lost
Leafy Greens: 30 units damaged = ₹900 lost
Milk: 12 units expired = ₹540 lost
Fruits: 28 units damaged = ₹1,400 lost

Total Loss: ₹4,640
Loss Percentage: 2.3% of purchases
```

**Business Action:**
- If loss > 5%: Major problem
- Check: Storage conditions, staff handling, over-ordering
- Solution: Order smaller quantities more frequently

---

## 📦 Order Management

### How Orders Work (Customer Journey)

**Customer Side:**
1. Opens app → Browses categories
2. Adds "Tomato 1kg" to cart
3. Adds "Onion 500g" to cart
4. Adds "Milk 1L" to cart
5. Proceeds to checkout
6. Enters delivery address
7. Selects payment: Online/COD
8. Places order
9. Waits for delivery

**Your Side (Admin Panel):**
1. Order notification appears
2. You see the order in "Pending" status
3. You need to process it

### Order Management Tab

**What You See:**

**Order List with Filters:**
- All Orders (default view)
- Pending (need to confirm)
- Confirmed (accepted, preparing)
- Out for Delivery (with delivery agent)
- Delivered (completed)
- Cancelled (rejected/customer cancelled)

**Each Order Shows:**
- Order number: ORD20250129078
- Customer: Rahul Sharma
- Items: 3 items, ₹215
- Payment: Online (Paid)
- Time: 12:35 PM
- Delivery Address: 2.3 km away
- Status: Pending

### Processing an Order (Step by Step)

#### Step 1: Order Arrives (Status: Pending)

**Order Details:**
```
Order #ORD20250129078
Customer: Rahul Sharma
Phone: +91-9876543210
Address: Flat 204, Green Apartments, MG Road, Bangalore - 560001

Items:
1. Tomato 1kg × 2 = ₹130
2. Onion 500g × 1 = ₹20
3. Milk 1L × 1 = ₹45

Subtotal: ₹195
Delivery: ₹20
Total: ₹215

Payment: Online (Paid ✓)
```

**You Click on Order → Review Details**

**Check 1: Items in Stock?**
- Tomato 1kg: Need 2, Available 42 ✓
- Onion 500g: Need 1, Available 55 ✓
- Milk 1L: Need 1, Available 110 ✓
- All items available!

**Check 2: Delivery Area?**
- Address is 2.3 km away ✓
- Within delivery zone ✓

**Check 3: Payment?**
- Payment: Paid online ✓
- Amount: ₹215 received ✓

**Decision: Accept or Reject?**

**Click "Confirm Order"**

#### Step 2: Order Confirmed

**Status: Pending → Confirmed**

**What Happens:**
- Customer gets notification: "Order confirmed! Preparing your items"
- Inventory automatically reserved:
  - Tomato 1kg: Reserved +2
  - Onion 500g: Reserved +1
  - Milk 1L: Reserved +1

**Inventory Before:**
```
Tomato 1kg: 42 available, 8 reserved
Onion 500g: 55 available, 5 reserved
Milk 1L: 110 available, 10 reserved
```

**Inventory After Confirming Order:**
```
Tomato 1kg: 40 available, 10 reserved (+2)
Onion 500g: 54 available, 6 reserved (+1)
Milk 1L: 109 available, 11 reserved (+1)
```

**Physical Action:**
- Warehouse staff picks items
- Quality check (fresh tomatoes, clean packaging)
- Pack in bag with invoice
- Mark as "Ready for Pickup"

#### Step 3: Assign Delivery Agent

**Click "Assign Delivery Agent"**

**Available Agents:**
```
1. Vijay Kumar - Available - 0 active orders
2. Ramesh Singh - Available - 1 active order
3. Amit Patel - Available - 0 active orders
4. Suresh M - Busy - 3 active orders
```

**Select: Vijay Kumar (nearest to store)**

**Click "Assign"**

**What Happens:**
- Vijay gets notification on his app
- Order shows on his "To Pick Up" list
- Customer sees: "Vijay is preparing your order"

#### Step 4: Out for Delivery

**Vijay arrives at warehouse:**
- Picks up the packed order
- Verifies items
- Clicks "Start Delivery" in his app

**Status: Confirmed → Out for Delivery**

**What Happens:**
- Customer gets notification: "Vijay is on the way!"
- Customer can track Vijay's live location on map
- ETA shown: "Arriving in 8 minutes"

**In Admin Panel:**
- Order status shows "Out for Delivery"
- Delivery agent: Vijay Kumar
- Started at: 12:50 PM
- Live tracking visible

#### Step 5: Order Delivered

**Vijay reaches customer:**
- Hands over items
- Collects COD payment (if applicable)
- Customer confirms delivery
- Vijay clicks "Mark as Delivered" in app

**Status: Out for Delivery → Delivered**

**What Happens:**

**1. Inventory Updated (Final Step):**
```
Tomato 1kg: Quantity -2, Reserved -2
Onion 500g: Quantity -1, Reserved -1
Milk 1L: Quantity -1, Reserved -1
```

**After Delivery:**
```
Tomato 1kg: 38 units (40-2), 8 reserved (10-2)
Onion 500g: 53 units (54-1), 5 reserved (6-1)
Milk 1L: 108 units (109-1), 10 reserved (11-1)
```

**2. Revenue Recorded:**
- Order amount: ₹215 added to today's revenue
- Customer payment marked as received

**3. Customer Can Rate:**
- "How was your order?" prompt
- Rate delivery agent
- Rate product quality

**4. Delivery Agent Paid:**
- Delivery fee: ₹20 credited to Vijay
- COD collected (if any): ₹0 (was online payment)

#### Step 6: Order Cancelled (Alternative Flow)

**If Order Gets Cancelled:**

**Scenario 1: You Cancel (Out of Stock)**
- You see order but realize Milk is actually out of stock
- Click "Cancel Order"
- Reason: "Milk not available"
- Customer notified
- Customer refunded (if paid online)
- Inventory reservations released

**Scenario 2: Customer Cancels**
- Customer calls within 2 minutes
- "I ordered wrong items, please cancel"
- You click "Cancel Order"
- Reason: "Customer requested"
- Inventory reservations released
- Refund initiated

### Order Analytics

**View Reports:**

**Today's Summary:**
```
Total Orders: 156
Completed: 142
Cancelled: 14

Revenue: ₹45,670
Average Order Value: ₹293

Peak Hour: 7-9 PM (45 orders)
Top Product: Tomato 1kg (87 units sold)
```

**Filter Orders:**
- By date range
- By status
- By customer
- By delivery agent
- By payment method
- By store

**Export Orders:**
- Download as CSV
- For accounting, analysis
- Share with team

---

## 💰 Revenue & Profit Analysis

### Revenue Tab

**What You See:**

**Overview Cards:**
- **Today's Revenue**: ₹45,670
- **This Week**: ₹2,85,440
- **This Month**: ₹11,24,650
- **Comparison**: +15% vs last month

**Revenue Chart:**
- Line graph showing daily revenue
- Last 30 days
- Identify trends: weekends higher, weekdays lower

**Revenue Breakdown:**

**By Payment Method:**
```
Online: ₹32,150 (70%)
Cash on Delivery: ₹13,520 (30%)
```

**By Category:**
```
Fresh Vegetables: ₹18,450 (40%)
Dairy & Bakery: ₹9,850 (22%)
Staples: ₹8,230 (18%)
Fruits: ₹6,890 (15%)
Others: ₹2,250 (5%)
```

**By Store:**
```
Main Warehouse: ₹28,900 (63%)
Express Hub: ₹16,770 (37%)
```

**Top Selling Products:**
```
1. Tomato 1kg - 87 units - ₹5,655
2. Onion 1kg - 76 units - ₹4,940
3. Milk 1L - 65 units - ₹2,925
4. Potato 1kg - 58 units - ₹3,770
5. Rice 1kg - 52 units - ₹6,240
```

### Profit Analysis Tab

This is the **most important tab** for understanding your business health!

**Profit Overview:**

```
Revenue: ₹45,670 (what customers paid you)
COGS: ₹32,450 (what you paid suppliers)
Gross Profit: ₹13,220 (revenue - COGS)
Profit Margin: 28.9% (profit ÷ revenue)
```

**What This Means:**
- For every ₹100 in sales, you make ₹29 profit
- ₹71 goes to covering product cost
- This is BEFORE expenses (rent, salaries, electricity)

**Profit by Product:**

```
Product         | Units | Revenue  | Cost    | Profit  | Margin
----------------|-------|----------|---------|---------|-------
Tomato 1kg      | 87    | ₹5,655   | ₹3,480  | ₹2,175  | 38.5%
Onion 1kg       | 76    | ₹4,940   | ₹2,280  | ₹2,660  | 53.8%
Milk 1L         | 65    | ₹2,925   | ₹2,080  | ₹845    | 28.9%
Potato 1kg      | 58    | ₹3,770   | ₹1,450  | ₹2,320  | 61.5%
Rice 1kg        | 52    | ₹6,240   | ₹4,420  | ₹1,820  | 29.2%
```

**Key Insights:**

**High Margin Products:**
- Potato 1kg: 61.5% margin (great!)
- Onion 1kg: 53.8% margin (excellent!)
- Action: Promote these more

**Low Margin Products:**
- Milk 1L: 28.9% margin (acceptable)
- Rice 1kg: 29.2% margin (acceptable)
- Reason: Competitive pricing, customers know the market rate

**Loss-Making Products:**
- Leafy Greens Bundle: -5% margin (selling below cost!)
- Reason: High spoilage, running promotional price
- Action: Increase price or improve procurement

**Profit Trends (Monthly):**

```
Month      | Revenue   | COGS      | Profit   | Margin
-----------|-----------|-----------|----------|-------
December   | ₹9,75,400 | ₹7,12,450 | ₹2,62,950| 27.0%
January    | ₹11,24,650| ₹8,01,230 | ₹3,23,420| 28.8%
Change     | +15.3%    | +12.5%    | +23.0%   | +1.8%
```

**Analysis:**
- Revenue growing (more customers)
- Profit growing FASTER (better margins)
- You're buying smarter or pricing better!

**Category-wise Profit:**

```
Category           | Revenue  | COGS     | Profit   | Margin
-------------------|----------|----------|----------|-------
Fresh Vegetables   | ₹18,450  | ₹11,250  | ₹7,200   | 39.0%
Dairy & Bakery     | ₹9,850   | ₹7,125   | ₹2,725   | 27.7%
Staples            | ₹8,230   | ₹6,450   | ₹1,780   | 21.6%
Fruits             | ₹6,890   | ₹4,890   | ₹2,000   | 29.0%
```

**Key Insights:**
- Vegetables: Best margin (39%)
- Staples: Lowest margin (21.6%) but high volume
- Strategy: Balance high-margin with high-volume

### Cost Analysis

**Additional Costs (Not in System Yet):**

Beyond product cost, you have:
```
Monthly Fixed Costs:
- Warehouse Rent: ₹50,000
- Electricity: ₹8,000
- Staff Salaries: ₹2,40,000
- Delivery Vehicle Fuel: ₹25,000
- Packaging Materials: ₹15,000
- Marketing: ₹30,000
Total Fixed: ₹3,68,000

Monthly Variable Costs:
- Delivery Agent Commissions: ₹45,000
- Payment Gateway Fees: ₹12,000
Total Variable: ₹57,000

Total Monthly Expenses: ₹4,25,000
```

**True Profit Calculation:**
```
Gross Profit (from system): ₹3,23,420
Less: Fixed Costs: -₹3,68,000
Less: Variable Costs: -₹57,000
Net Profit: -₹1,01,580 (LOSS!)
```

**Wait, you're making loss?**

Actually, the ₹3,23,420 is for the MONTH. Let's recalculate:

```
January Revenue: ₹11,24,650
January COGS: ₹8,01,230
Gross Profit: ₹3,23,420

Less: Fixed Costs: ₹3,68,000
Less: Variable Costs: ₹57,000
Net Profit: -₹1,01,580 (Loss of ₹1 lakh)
```

**Business Reality:**
- You need to increase revenue OR reduce costs
- Break-even revenue needed: ₹6,07,143/month
- Current revenue: ₹11,24,650 (already above break-even!)
- Wait, let's recalculate...

Actually, the problem is COGS is too high or pricing is too low.

**Better Analysis:**
```
Target Net Profit Margin: 10%
Required Gross Profit Margin: 40% (to cover expenses + profit)

Current Gross Margin: 28.8% (not enough!)

Action Items:
1. Negotiate better rates with suppliers
2. Increase prices on low-margin items
3. Reduce wastage/spoilage
4. Optimize delivery costs
```

### How to Improve Profitability

**1. Reduce COGS (Cost of Goods Sold):**
- Negotiate with suppliers for bulk discounts
- Find alternate suppliers with better rates
- Buy directly from farmers (cut middlemen)
- Seasonal buying (tomatoes cheaper in summer)

**2. Reduce Wastage:**
- Better demand forecasting
- Order smaller quantities more frequently
- Better storage (refrigeration)
- Quick sale of near-expiry items (discounts)

**3. Increase Prices (Carefully):**
- Products customers are less price-sensitive about
- Premium variants (organic tomatoes at higher price)
- Bundle pricing (combo offers)
- Dynamic pricing (higher during peak hours)

**4. Increase Order Value:**
- Minimum order value for free delivery
- Suggested add-ons ("Frequently bought together")
- Loyalty programs (buy more, get discounts)

**5. Reduce Delivery Costs:**
- Optimize routes for delivery agents
- Batch nearby orders together
- Charge delivery fee for small orders
- Incentivize customer pickup

---

## 🎬 Complete Business Example (Full Day Operations)

### 5:00 AM - Morning Setup

**Your buyer goes to APMC wholesale market:**

Checks today's rates (vegetable prices change daily):
- Tomatoes: ₹42/kg (was ₹40 yesterday - increased)
- Onions: ₹28/kg (was ₹30 - decreased)
- Potatoes: ₹25/kg (stable)
- Cabbage: ₹18/kg (seasonal low)
- Spinach: ₹10/bunch (good price)

**Purchases:**
```
Tomatoes: 60kg @ ₹42/kg = ₹2,520
Onions: 100kg @ ₹28/kg = ₹2,800
Potatoes: 80kg @ ₹25/kg = ₹2,000
Cabbage: 40kg @ ₹18/kg = ₹720
Spinach: 60 bunches @ ₹10 = ₹600
Carrots: 30kg @ ₹35/kg = ₹1,050
Total: ₹9,690
```

### 6:30 AM - Receiving Stock

**In Admin Panel:**

1. **Create Purchase Order**
   - Supplier: APMC Green Vegetables
   - Items: (list above)
   - Status: Received (immediate)

2. **Pack Into Variants**

   **Tomatoes (60kg received):**
   - Pack 40kg as 1kg packs = 40 units
   - Pack 15kg as 500g packs = 30 units
   - Pack 5kg as 250g packs = 20 units

   **Onions (100kg received):**
   - Pack 60kg as 1kg packs = 60 units
   - Pack 40kg as 500g packs = 80 units

   *(Same for other items...)*

3. **Inventory Updated**
   - System adds all quantities
   - Cost prices updated based on today's rates
   - Ready for sale!

### 7:00 AM - Store Opens

**Customers start ordering:**

**Order 1 (7:05 AM):**
```
Customer: Priya
Items:
- Tomato 1kg × 2
- Onion 1kg × 1
- Spinach 250g × 1
Total: ₹175
Payment: Online
```

**You process:**
- Confirm order → Assign to Vijay → Out for delivery → Delivered (7:25 AM)
- Inventory reduced automatically
- Revenue: +₹175

**Orders keep coming...**

### 12:00 PM - Midday Check

**Dashboard shows:**
- Orders so far: 45
- Revenue: ₹12,850
- Pending orders: 3

**Inventory Check:**
- Tomato 1kg: 20 left (started with 40) ⚠️ Low stock
- Onion 1kg: 45 left (started with 60) ✓ Healthy
- Milk 1L: 15 left (started with 100) ⚠️ Low stock

**Action Needed:**
- Tomatoes selling fast (20 sold in 5 hours)
- Will run out by evening (peak time!)
- Need to order more

**Call supplier:** "Send 30kg more tomatoes, urgent delivery"

**New PO created:**
- Tomatoes: 30kg @ ₹45/kg = ₹1,350 (price increased in afternoon!)
- Expected: 3:00 PM delivery

### 3:00 PM - Afternoon Restock

**New tomatoes arrive:**
- Receive in system
- Pack: 20kg as 1kg, 10kg as 500g
- Inventory updated
- Ready to sell

### 6:00 PM - Evening Quality Check

**Warehouse staff checks stock:**

**Found Issues:**
- 5 units of Spinach 250g are wilted (can't sell)
- 2 units of Milk 1L expire tomorrow (need to discount)

**In Admin Panel:**

1. **Adjustment: Damage**
   - Product: Spinach 250g
   - Quantity: -5 units
   - Reason: Wilted, not sellable
   - Loss: ₹125

2. **Price Update (Temporary Discount)**
   - Milk 1L (expiring batch): ₹45 → ₹35
   - Mark as "Quick Sale"

### 7:00 PM - Peak Hour Begins

**Orders flood in (dinner time):**
- 7:00-7:30 PM: 15 orders
- 7:30-8:00 PM: 18 orders
- 8:00-8:30 PM: 12 orders

**All delivery agents busy!**

**You handle:**
- Confirm orders rapidly
- Assign to agents efficiently
- Monitor delivery times
- Handle customer calls

### 9:00 PM - Winding Down

**Last few orders:**
- Orders reducing
- 3 agents still out
- 2 agents returned

### 10:00 PM - Store Closes

**End of Day Summary:**

**Orders:**
- Total: 156 orders
- Delivered: 142
- Cancelled: 14 (out of stock / customer request)

**Revenue:**
```
Total Revenue: ₹45,670
Payment Breakdown:
- Online: ₹32,150
- COD: ₹13,520
```

**Inventory Status:**
```
Low Stock Alerts: 8 items
- Tomato 1kg: 8 units (need reorder)
- Onion 500g: 12 units
- Milk 1L: 5 units (urgent!)
- (5 more items...)
```

**Profit Analysis:**
```
Revenue: ₹45,670
COGS: ₹32,450
Gross Profit: ₹13,220
Margin: 28.9%
```

**Losses:**
```
Spoilage: ₹125 (spinach)
Theft/Missing: ₹0
Returns: ₹85 (2 customer returns)
Total Loss: ₹210
```

**Actions for Tomorrow:**
1. Order more tomatoes, onions, milk
2. Reduce spinach order (high spoilage)
3. Check why 14 orders cancelled
4. Review pricing on low-margin items

### 10:30 PM - Planning Next Day

**Create Purchase Orders for tomorrow:**

**Order 1: APMC (Vegetables)**
- Tomatoes: 70kg (increased quantity)
- Onions: 100kg
- Potatoes: 60kg
- Others...

**Order 2: Mother Dairy**
- Milk: 150L (increased)
- Paneer: 15kg
- Curd: 60 units

**Set Expected Delivery:** 6:00 AM tomorrow

**Go Home. Repeat Tomorrow.**

---

## ✅ Summary: How Everything Connects

**1. Morning:** Purchase fresh stock from suppliers → Receive in system → Pack into variants → Inventory updated

**2. Throughout Day:** Customer orders → You confirm → Reserve inventory → Assign delivery agent → Deliver → Reduce inventory → Record revenue

**3. Continuous:** Monitor stock levels → Adjust for damage/spoilage → Reorder when low → Manage agents → Handle customer issues

**4. End of Day:** Review revenue and profit → Analyze what sold well → Plan tomorrow's purchases → Identify problems (spoilage, cancellations)

**5. Weekly/Monthly:** Review profit margins → Negotiate with suppliers → Adjust pricing → Optimize inventory → Reduce wastage

---

**The admin panel gives you COMPLETE CONTROL over your entire grocery delivery operation from a single dashboard!**
