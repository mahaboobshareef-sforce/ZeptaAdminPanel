# 💰 Complete Purchase, Revenue & Profit Analysis - Detailed Guide

This document explains the complete lifecycle: how you purchase products from suppliers, how they're sold to customers, how revenue is calculated, and how profit is analyzed.

---

## 📊 Table of Contents

1. [Product Management Overview](#product-management-overview)
2. [Purchase Management (Buying from Suppliers)](#purchase-management-buying-from-suppliers)
3. [Order Management (Selling to Customers)](#order-management-selling-to-customers)
4. [Revenue Calculation](#revenue-calculation)
5. [Profit Analysis](#profit-analysis)
6. [Complete End-to-End Flow](#complete-end-to-end-flow)

---

## 🏪 Product Management Overview

### What Is Product Management?

Product management is the **master catalog** of everything you sell. It includes:
- Product information (name, description, images)
- Pricing (MRP, selling price, cost price)
- Variants (different sizes, colors, configurations)
- Categories (organization)
- Status (active/inactive)

### Product Table Structure

```sql
products
├── id: uuid (Primary Key)
├── name: text ("Apple iPhone 15 Pro")
├── slug: text ("apple-iphone-15-pro")
├── description: text
├── category_id: uuid → categories.id
├── base_price: decimal(10,2) (₹79,999 - Default selling price)
├── cost_price: decimal(10,2) (₹65,000 - What YOU paid to buy it)
├── mrp: decimal(10,2) (₹89,999 - Maximum Retail Price)
├── sku: text ("IP15PRO" - Stock Keeping Unit)
├── barcode: text
├── images: text[] (Array of image URLs)
├── is_active: boolean
├── is_featured: boolean
├── tags: text[]
└── created_at: timestamptz
```

### Key Pricing Concepts

1. **Cost Price**: What you paid to acquire the product from supplier
   - Example: ₹65,000

2. **Base Price** (Selling Price): What you sell it for to customers
   - Example: ₹79,999

3. **MRP** (Maximum Retail Price): Government mandated maximum price
   - Example: ₹89,999

4. **Gross Profit**: Selling Price - Cost Price
   - Example: ₹79,999 - ₹65,000 = ₹14,999

5. **Profit Margin**: (Gross Profit / Selling Price) × 100
   - Example: (₹14,999 / ₹79,999) × 100 = 18.75%

### Product Variants

Products can have multiple variants (same product, different configurations):

```sql
product_variants
├── id: uuid
├── product_id: uuid → products.id
├── name: text ("256GB Black")
├── sku: text ("IP15PRO-256-BLK")
├── price: decimal(10,2) (₹79,999)
├── cost_price: decimal(10,2) (₹65,000)
├── attributes: jsonb ({"storage": "256GB", "color": "Black"})
└── is_active: boolean
```

**Example: iPhone 15 Pro**
```
Product: iPhone 15 Pro (base_price: ₹79,999, cost_price: ₹65,000)

Variants:
├── 128GB Black   → Price: ₹74,999 | Cost: ₹62,000
├── 256GB Black   → Price: ₹84,999 | Cost: ₹70,000
├── 512GB Black   → Price: ₹99,999 | Cost: ₹82,000
├── 128GB White   → Price: ₹74,999 | Cost: ₹62,000
├── 256GB White   → Price: ₹84,999 | Cost: ₹70,000
└── 512GB White   → Price: ₹99,999 | Cost: ₹82,000
```

**Each variant has its own:**
- Selling price
- Cost price
- SKU
- Inventory levels

---

## 🛒 Purchase Management (Buying from Suppliers)

### Overview

Purchase management tracks how you **buy products from suppliers** to stock your stores. This is the **INPUT** side of your business.

### Database Schema

**1. Suppliers Table**
```sql
suppliers
├── id: uuid
├── name: text ("Apple India Pvt Ltd")
├── contact_person: text ("Rajesh Kumar")
├── email: text ("orders@apple.in")
├── phone: text ("+91-9876543210")
├── address: text
├── payment_terms: text ("Net 30 days" - Pay within 30 days)
├── is_active: boolean
└── created_at: timestamptz
```

**2. Purchase Orders Table**
```sql
purchase_orders
├── id: uuid
├── po_number: text ("PO20250129001" - Auto-generated)
├── supplier_id: uuid → suppliers.id
├── store_id: uuid → stores.id (Which store will receive the stock)
├── status: enum
│   ├── 'draft' - Being created
│   ├── 'sent' - Sent to supplier
│   ├── 'confirmed' - Supplier confirmed
│   ├── 'partial' - Partially received
│   ├── 'received' - Fully received
│   └── 'cancelled' - Order cancelled
├── order_date: date
├── expected_delivery_date: date
├── actual_delivery_date: date (null until received)
├── subtotal: decimal(10,2) (Sum of all items)
├── tax_amount: decimal(10,2) (GST/VAT)
├── shipping_cost: decimal(10,2) (Transport charges)
├── total_amount: decimal(10,2) (subtotal + tax + shipping)
├── notes: text
├── created_by: uuid → users.id
└── created_at: timestamptz
```

**3. Purchase Order Items Table**
```sql
purchase_order_items
├── id: uuid
├── purchase_order_id: uuid → purchase_orders.id
├── product_id: uuid → products.id
├── variant_id: uuid → product_variants.id (null if no variant)
├── quantity_ordered: integer (How many you ordered)
├── quantity_received: integer (How many actually arrived)
├── unit_cost_price: decimal(10,2) (Price per unit you paid)
├── total_cost: decimal(10,2) (quantity × unit_cost_price)
└── notes: text
```

### Purchase Order Lifecycle

#### Step 1: Create Purchase Order (Draft)

**Scenario**: You need to order 100 iPhones from Apple

```sql
-- Create the purchase order
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  store_id,
  status,
  order_date,
  expected_delivery_date,
  subtotal,
  tax_amount,
  shipping_cost,
  total_amount,
  created_by
) VALUES (
  'PO20250129001',
  'apple-supplier-uuid',
  'downtown-store-uuid',
  'draft',
  '2025-01-29',
  '2025-02-05',
  6500000.00,  -- ₹65,000 × 100 units
  1170000.00,  -- 18% GST
  50000.00,    -- Shipping
  7720000.00,  -- Total
  'admin-user-uuid'
);
```

#### Step 2: Add Items to Purchase Order

```sql
-- Add iPhone 15 Pro 256GB Black - 50 units
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  variant_id,
  quantity_ordered,
  quantity_received,
  unit_cost_price,
  total_cost
) VALUES (
  'po-uuid',
  'iphone15pro-product-uuid',
  '256gb-black-variant-uuid',
  50,
  0,  -- Not received yet
  70000.00,  -- ₹70,000 per unit
  3500000.00  -- ₹70,000 × 50
);

-- Add iPhone 15 Pro 512GB Black - 30 units
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  variant_id,
  quantity_ordered,
  quantity_received,
  unit_cost_price,
  total_cost
) VALUES (
  'po-uuid',
  'iphone15pro-product-uuid',
  '512gb-black-variant-uuid',
  30,
  0,
  82000.00,  -- ₹82,000 per unit
  2460000.00  -- ₹82,000 × 30
);

-- Add iPhone 15 Pro 128GB White - 20 units
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  variant_id,
  quantity_ordered,
  quantity_received,
  unit_cost_price,
  total_cost
) VALUES (
  'po-uuid',
  'iphone15pro-product-uuid',
  '128gb-white-variant-uuid',
  20,
  0,
  62000.00,  -- ₹62,000 per unit
  1240000.00  -- ₹62,000 × 20
);
```

**Summary of this PO:**
```
PO#: PO20250129001
Supplier: Apple India
Store: Downtown Store
Status: Draft

Items:
1. iPhone 15 Pro 256GB Black → 50 units × ₹70,000 = ₹35,00,000
2. iPhone 15 Pro 512GB Black → 30 units × ₹82,000 = ₹24,60,000
3. iPhone 15 Pro 128GB White → 20 units × ₹62,000 = ₹12,40,000

Subtotal: ₹72,00,000
Tax (18% GST): ₹12,96,000
Shipping: ₹50,000
TOTAL: ₹85,46,000
```

#### Step 3: Send to Supplier (Status: Sent)

```sql
UPDATE purchase_orders
SET status = 'sent'
WHERE id = 'po-uuid';
```

Admin sends PO via email/system to supplier.

#### Step 4: Supplier Confirms (Status: Confirmed)

```sql
UPDATE purchase_orders
SET status = 'confirmed'
WHERE id = 'po-uuid';
```

Supplier acknowledges they can fulfill the order.

#### Step 5: Receive Shipment (Status: Received)

**This is the critical step where inventory is updated!**

When the shipment arrives at your warehouse:

```sql
-- Mark all items as received
UPDATE purchase_order_items
SET quantity_received = quantity_ordered
WHERE purchase_order_id = 'po-uuid';

-- Update PO status
UPDATE purchase_orders
SET status = 'received',
    actual_delivery_date = '2025-02-03'
WHERE id = 'po-uuid';
```

**Now update inventory for each variant:**

```sql
-- For 256GB Black variant
INSERT INTO inventory (
  product_id,
  variant_id,
  store_id,
  quantity,
  last_restocked_at
) VALUES (
  'iphone15pro-product-uuid',
  '256gb-black-variant-uuid',
  'downtown-store-uuid',
  50,
  NOW()
)
ON CONFLICT (product_id, variant_id, store_id)
DO UPDATE SET
  quantity = inventory.quantity + 50,
  last_restocked_at = NOW();

-- For 512GB Black variant
INSERT INTO inventory (
  product_id,
  variant_id,
  store_id,
  quantity,
  last_restocked_at
) VALUES (
  'iphone15pro-product-uuid',
  '512gb-black-variant-uuid',
  'downtown-store-uuid',
  30,
  NOW()
)
ON CONFLICT (product_id, variant_id, store_id)
DO UPDATE SET
  quantity = inventory.quantity + 30,
  last_restocked_at = NOW();

-- For 128GB White variant
INSERT INTO inventory (
  product_id,
  variant_id,
  store_id,
  quantity,
  last_restocked_at
) VALUES (
  'iphone15pro-product-uuid',
  '128gb-white-variant-uuid',
  'downtown-store-uuid',
  20,
  NOW()
)
ON CONFLICT (product_id, variant_id, store_id)
DO UPDATE SET
  quantity = inventory.quantity + 20,
  last_restocked_at = NOW();
```

**Log the adjustment:**

```sql
-- For each variant, log the restock
INSERT INTO inventory_adjustments (
  product_id,
  variant_id,
  store_id,
  adjustment_type,
  quantity_change,
  reason,
  notes,
  adjusted_by
) VALUES
  (
    'iphone15pro-product-uuid',
    '256gb-black-variant-uuid',
    'downtown-store-uuid',
    'restock',
    50,
    'Purchase Order Received',
    'PO#: PO20250129001',
    'admin-user-uuid'
  ),
  (
    'iphone15pro-product-uuid',
    '512gb-black-variant-uuid',
    'downtown-store-uuid',
    'restock',
    30,
    'Purchase Order Received',
    'PO#: PO20250129001',
    'admin-user-uuid'
  ),
  (
    'iphone15pro-product-uuid',
    '128gb-white-variant-uuid',
    'downtown-store-uuid',
    'restock',
    20,
    'Purchase Order Received',
    'PO#: PO20250129001',
    'admin-user-uuid'
  );
```

**Result:**
```
Inventory Updated:

Downtown Store:
├── iPhone 15 Pro 256GB Black: +50 units (now has 50 available)
├── iPhone 15 Pro 512GB Black: +30 units (now has 30 available)
└── iPhone 15 Pro 128GB White: +20 units (now has 20 available)

Total Investment: ₹85,46,000
```

#### Step 6: Update Product Cost Prices (Important!)

When you receive a purchase order, you should **update the cost_price** in the product_variants table to reflect the latest purchase cost:

```sql
-- Update cost prices based on what you just paid
UPDATE product_variants
SET cost_price = 70000.00
WHERE id = '256gb-black-variant-uuid';

UPDATE product_variants
SET cost_price = 82000.00
WHERE id = '512gb-black-variant-uuid';

UPDATE product_variants
SET cost_price = 62000.00
WHERE id = '128gb-white-variant-uuid';
```

This ensures profit calculations use the **actual cost** you paid.

### Database Function for Receiving Purchase Orders

```sql
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_po_id uuid,
  p_received_by uuid
)
RETURNS void AS $$
DECLARE
  v_po_record RECORD;
  v_item_record RECORD;
BEGIN
  -- Get PO details
  SELECT * INTO v_po_record
  FROM purchase_orders
  WHERE id = p_po_id;

  -- Update PO status
  UPDATE purchase_orders
  SET status = 'received',
      actual_delivery_date = CURRENT_DATE
  WHERE id = p_po_id;

  -- Loop through all items and update inventory
  FOR v_item_record IN
    SELECT * FROM purchase_order_items
    WHERE purchase_order_id = p_po_id
  LOOP
    -- Update quantity received
    UPDATE purchase_order_items
    SET quantity_received = quantity_ordered
    WHERE id = v_item_record.id;

    -- Update inventory
    INSERT INTO inventory (
      product_id, variant_id, store_id, quantity, last_restocked_at
    ) VALUES (
      v_item_record.product_id,
      v_item_record.variant_id,
      v_po_record.store_id,
      v_item_record.quantity_ordered,
      NOW()
    )
    ON CONFLICT (product_id, variant_id, store_id)
    DO UPDATE SET
      quantity = inventory.quantity + v_item_record.quantity_ordered,
      last_restocked_at = NOW();

    -- Log adjustment
    INSERT INTO inventory_adjustments (
      product_id, variant_id, store_id,
      adjustment_type, quantity_change,
      reason, notes, adjusted_by
    ) VALUES (
      v_item_record.product_id,
      v_item_record.variant_id,
      v_po_record.store_id,
      'restock',
      v_item_record.quantity_ordered,
      'Purchase Order Received',
      'PO#: ' || v_po_record.po_number,
      p_received_by
    );

    -- Update product variant cost price
    UPDATE product_variants
    SET cost_price = v_item_record.unit_cost_price
    WHERE id = v_item_record.variant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**
```sql
SELECT receive_purchase_order('po-uuid', 'admin-user-uuid');
```

---

## 🛍️ Order Management (Selling to Customers)

### Overview

Order management tracks **customer purchases** from your store. This is the **OUTPUT** side where you earn revenue.

### Database Schema

**1. Orders Table**
```sql
orders
├── id: uuid
├── order_number: text ("ORD20250129001")
├── customer_id: uuid → users.id
├── store_id: uuid → stores.id
├── delivery_agent_id: uuid → users.id (nullable)
├── status: enum ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded')
├── payment_status: enum ('pending', 'paid', 'failed', 'refunded')
├── payment_method: enum ('cod', 'online', 'wallet')
├── subtotal: decimal(10,2) (Sum of all items)
├── discount_amount: decimal(10,2) (From coupons)
├── delivery_fee: decimal(10,2)
├── tax_amount: decimal(10,2)
├── total_amount: decimal(10,2) (subtotal - discount + delivery + tax)
├── delivery_address: jsonb
├── notes: text
└── created_at: timestamptz
```

**2. Order Items Table**
```sql
order_items
├── id: uuid
├── order_id: uuid → orders.id
├── product_id: uuid → products.id
├── variant_id: uuid → product_variants.id (nullable)
├── quantity: integer
├── unit_price: decimal(10,2) (Selling price at time of order)
├── unit_cost_price: decimal(10,2) (Cost price at time of order)
├── total_price: decimal(10,2) (quantity × unit_price)
└── discount_amount: decimal(10,2)
```

### Order Lifecycle

#### Step 1: Customer Places Order

**Scenario**: Customer orders 2 iPhones

```sql
-- Create order
INSERT INTO orders (
  order_number,
  customer_id,
  store_id,
  status,
  payment_status,
  payment_method,
  subtotal,
  discount_amount,
  delivery_fee,
  tax_amount,
  total_amount,
  delivery_address
) VALUES (
  'ORD20250129001',
  'customer-uuid',
  'downtown-store-uuid',
  'pending',
  'pending',
  'online',
  169998.00,  -- ₹84,999 × 2
  0.00,
  0.00,  -- Free delivery
  0.00,  -- Tax included in price
  169998.00,
  '{"name": "Rahul Sharma", "phone": "+91-9876543210", "address": "123 MG Road, Bangalore", "pincode": "560001"}'
);

-- Add order items
INSERT INTO order_items (
  order_id,
  product_id,
  variant_id,
  quantity,
  unit_price,
  unit_cost_price,
  total_price,
  discount_amount
) VALUES (
  'order-uuid',
  'iphone15pro-product-uuid',
  '256gb-black-variant-uuid',
  2,
  84999.00,  -- Selling price
  70000.00,  -- Cost price (from product_variants)
  169998.00,  -- 2 × ₹84,999
  0.00
);
```

**Summary:**
```
Order: ORD20250129001
Customer: Rahul Sharma
Store: Downtown Store
Status: Pending
Payment: Online (Pending)

Items:
1. iPhone 15 Pro 256GB Black × 2 = ₹1,69,998

Subtotal: ₹1,69,998
Discount: ₹0
Delivery: ₹0
Tax: ₹0
TOTAL: ₹1,69,998
```

#### Step 2: Reserve Inventory

**CRITICAL**: When order is placed, reserve inventory so it can't be sold to someone else:

```sql
UPDATE inventory
SET reserved_quantity = reserved_quantity + 2
WHERE product_id = 'iphone15pro-product-uuid'
  AND variant_id = '256gb-black-variant-uuid'
  AND store_id = 'downtown-store-uuid';
```

**Inventory State:**
```
Before Order:
├── quantity: 50
├── reserved_quantity: 0
└── available: 50

After Order (Reserved):
├── quantity: 50
├── reserved_quantity: 2
└── available: 48 (50 - 2)
```

#### Step 3: Payment Confirmation

```sql
UPDATE orders
SET payment_status = 'paid',
    status = 'confirmed'
WHERE id = 'order-uuid';
```

#### Step 4: Order Shipped/Delivered

**When order is delivered, reduce actual inventory:**

```sql
-- Reduce inventory
UPDATE inventory
SET quantity = quantity - 2,
    reserved_quantity = reserved_quantity - 2
WHERE product_id = 'iphone15pro-product-uuid'
  AND variant_id = '256gb-black-variant-uuid'
  AND store_id = 'downtown-store-uuid';

-- Update order status
UPDATE orders
SET status = 'delivered'
WHERE id = 'order-uuid';
```

**Inventory State:**
```
After Delivery:
├── quantity: 48 (50 - 2)
├── reserved_quantity: 0 (2 - 2)
└── available: 48
```

#### Step 5: Order Cancellation (If Needed)

**If customer cancels before delivery:**

```sql
-- Release reserved inventory
UPDATE inventory
SET reserved_quantity = reserved_quantity - 2
WHERE product_id = 'iphone15pro-product-uuid'
  AND variant_id = '256gb-black-variant-uuid'
  AND store_id = 'downtown-store-uuid';

-- Update order
UPDATE orders
SET status = 'cancelled'
WHERE id = 'order-uuid';
```

**Inventory State:**
```
After Cancellation:
├── quantity: 50 (unchanged)
├── reserved_quantity: 0 (2 - 2)
└── available: 50
```

### Database Trigger for Inventory Management

```sql
-- Automatically reserve inventory when order is created
CREATE OR REPLACE FUNCTION reserve_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- For each order item, reserve inventory
  UPDATE inventory
  SET reserved_quantity = reserved_quantity + NEW.quantity
  WHERE product_id = NEW.product_id
    AND (variant_id = NEW.variant_id OR (variant_id IS NULL AND NEW.variant_id IS NULL))
    AND store_id = (SELECT store_id FROM orders WHERE id = NEW.order_id);

  -- Check if enough stock available
  IF NOT FOUND OR
     (SELECT (quantity - reserved_quantity) FROM inventory
      WHERE product_id = NEW.product_id
        AND (variant_id = NEW.variant_id OR (variant_id IS NULL AND NEW.variant_id IS NULL))
        AND store_id = (SELECT store_id FROM orders WHERE id = NEW.order_id)) < 0
  THEN
    RAISE EXCEPTION 'Insufficient inventory for product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reserve_inventory_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reserve_inventory_on_order();
```

---

## 💰 Revenue Calculation

### What Is Revenue?

Revenue is the **total money earned** from selling products to customers. It's calculated from orders.

### Revenue Formula

```
Revenue = Sum of all delivered/completed orders
```

### Types of Revenue

**1. Gross Revenue (Total Sales)**
```sql
SELECT SUM(total_amount) as gross_revenue
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid';
```

**2. Net Revenue (After Discounts)**
```sql
SELECT
  SUM(total_amount) as net_revenue,
  SUM(discount_amount) as total_discounts,
  SUM(subtotal) as gross_revenue
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid';
```

**3. Revenue by Date Range**
```sql
SELECT
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total_amount) as daily_revenue
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid'
  AND created_at >= '2025-01-01'
  AND created_at < '2025-02-01'
GROUP BY DATE(created_at)
ORDER BY order_date;
```

**4. Revenue by Product**
```sql
SELECT
  p.name,
  pv.name as variant_name,
  SUM(oi.quantity) as units_sold,
  SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY p.id, p.name, pv.id, pv.name
ORDER BY total_revenue DESC;
```

**5. Revenue by Category**
```sql
SELECT
  c.name as category_name,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(oi.quantity) as units_sold,
  SUM(oi.total_price) as category_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY c.id, c.name
ORDER BY category_revenue DESC;
```

**6. Revenue by Store**
```sql
SELECT
  s.name as store_name,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as store_revenue
FROM orders o
JOIN stores s ON o.store_id = s.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY s.id, s.name
ORDER BY store_revenue DESC;
```

### Revenue Metrics Dashboard

```sql
-- KPIs for last 30 days
SELECT
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value,
  SUM(CASE WHEN payment_method = 'cod' THEN total_amount ELSE 0 END) as cod_revenue,
  SUM(CASE WHEN payment_method = 'online' THEN total_amount ELSE 0 END) as online_revenue
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid'
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 📊 Profit Analysis

### What Is Profit?

Profit is **revenue minus costs**. It shows how much money you actually make after paying for the products.

### Profit Formula

```
Profit = Revenue - Cost of Goods Sold (COGS)

Where:
- Revenue = What you sold products for (unit_price × quantity)
- COGS = What you paid for products (unit_cost_price × quantity)
```

### Gross Profit vs Net Profit

**1. Gross Profit**
```
Gross Profit = Revenue - COGS
```
Doesn't account for operating expenses (rent, salaries, etc.)

**2. Net Profit**
```
Net Profit = Revenue - COGS - Operating Expenses
```
True profit after all expenses.

### Profit Calculation Queries

**1. Profit per Order Item**
```sql
SELECT
  o.order_number,
  p.name as product_name,
  pv.name as variant_name,
  oi.quantity,
  oi.unit_price as selling_price,
  oi.unit_cost_price as cost_price,
  oi.total_price as revenue,
  (oi.unit_cost_price * oi.quantity) as cost,
  (oi.total_price - (oi.unit_cost_price * oi.quantity)) as gross_profit,
  ROUND(
    ((oi.total_price - (oi.unit_cost_price * oi.quantity)) / oi.total_price * 100)::numeric,
    2
  ) as profit_margin_percent
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
ORDER BY gross_profit DESC;
```

**Example Result:**
```
Order: ORD20250129001
Product: iPhone 15 Pro 256GB Black
Quantity: 2
Selling Price: ₹84,999
Cost Price: ₹70,000
Revenue: ₹1,69,998
Cost: ₹1,40,000
Gross Profit: ₹29,998
Profit Margin: 17.65%
```

**2. Total Profit (All Orders)**
```sql
SELECT
  SUM(oi.total_price) as total_revenue,
  SUM(oi.unit_cost_price * oi.quantity) as total_cost,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as total_profit,
  ROUND(
    AVG((oi.total_price - (oi.unit_cost_price * oi.quantity)) / oi.total_price * 100)::numeric,
    2
  ) as avg_profit_margin
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid';
```

**3. Profit by Product**
```sql
SELECT
  p.name as product_name,
  COUNT(DISTINCT o.id) as orders_count,
  SUM(oi.quantity) as units_sold,
  SUM(oi.total_price) as total_revenue,
  SUM(oi.unit_cost_price * oi.quantity) as total_cost,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as total_profit,
  ROUND(
    (SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) / SUM(oi.total_price) * 100)::numeric,
    2
  ) as profit_margin
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY p.id, p.name
ORDER BY total_profit DESC;
```

**4. Profit by Category**
```sql
SELECT
  c.name as category_name,
  SUM(oi.total_price) as revenue,
  SUM(oi.unit_cost_price * oi.quantity) as cost,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as profit,
  ROUND(
    (SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) / SUM(oi.total_price) * 100)::numeric,
    2
  ) as margin_percent
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY c.id, c.name
ORDER BY profit DESC;
```

**5. Profit Trends (Monthly)**
```sql
SELECT
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(DISTINCT o.id) as orders,
  SUM(oi.total_price) as revenue,
  SUM(oi.unit_cost_price * oi.quantity) as cost,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as profit,
  ROUND(
    (SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) / SUM(oi.total_price) * 100)::numeric,
    2
  ) as margin
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
  AND o.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;
```

**6. Profit by Store**
```sql
SELECT
  s.name as store_name,
  SUM(oi.total_price) as revenue,
  SUM(oi.unit_cost_price * oi.quantity) as cost,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as profit
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN stores s ON o.store_id = s.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY s.id, s.name
ORDER BY profit DESC;
```

### Advanced Profit Metrics

**1. Contribution Margin (Including Discounts and Fees)**
```sql
SELECT
  SUM(o.subtotal) as gross_revenue,
  SUM(o.discount_amount) as discounts,
  SUM(o.delivery_fee) as delivery_revenue,
  SUM(o.total_amount) as net_revenue,
  SUM(oi.unit_cost_price * oi.quantity) as cogs,
  SUM(o.total_amount) - SUM(oi.unit_cost_price * oi.quantity) as contribution_margin
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid';
```

**2. Return on Investment (ROI)**
```sql
-- Calculate ROI for each product
SELECT
  p.name,
  SUM(poi.total_cost) as total_investment,
  SUM(oi.total_price) as total_sales,
  SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as profit,
  ROUND(
    ((SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) / SUM(poi.total_cost)) * 100)::numeric,
    2
  ) as roi_percent
FROM products p
LEFT JOIN purchase_order_items poi ON p.id = poi.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY p.id, p.name
HAVING SUM(poi.total_cost) > 0
ORDER BY roi_percent DESC;
```

### Profit Analysis Dashboard View

Create a materialized view for fast dashboard loading:

```sql
CREATE MATERIALIZED VIEW profit_analysis_summary AS
SELECT
  DATE_TRUNC('day', o.created_at) as date,
  COUNT(DISTINCT o.id) as orders,
  SUM(o.total_amount) as revenue,
  SUM(o.discount_amount) as discounts,
  SUM(oi.unit_cost_price * oi.quantity) as cogs,
  SUM(o.total_amount - (oi.unit_cost_price * oi.quantity)) as gross_profit,
  ROUND(
    AVG((o.total_amount - (oi.unit_cost_price * oi.quantity)) / o.total_amount * 100)::numeric,
    2
  ) as avg_margin
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid'
GROUP BY DATE_TRUNC('day', o.created_at)
ORDER BY date DESC;

-- Refresh daily
CREATE INDEX ON profit_analysis_summary(date);
```

---

## 🔄 Complete End-to-End Flow

### Full Business Cycle Example

Let's walk through a complete cycle from purchasing to selling to profit calculation.

#### Phase 1: Purchase from Supplier

**Day 1: Create Purchase Order**
```
You order from Apple:
- 10 × iPhone 15 Pro 256GB Black @ ₹70,000 = ₹7,00,000
- 5 × iPhone 15 Pro 512GB Black @ ₹82,000 = ₹4,10,000

Total Investment: ₹11,10,000 + ₹1,99,800 (GST) + ₹10,000 (Shipping)
= ₹13,19,800
```

**Day 7: Receive Stock**
```sql
-- Inventory updated
Downtown Store:
├── iPhone 15 Pro 256GB Black: 10 units (cost: ₹70,000 each)
└── iPhone 15 Pro 512GB Black: 5 units (cost: ₹82,000 each)
```

#### Phase 2: Customer Orders

**Day 10: Customer A Orders**
```
Customer: Rahul
Order: ORD001
Items:
- 2 × iPhone 15 Pro 256GB Black @ ₹84,999 = ₹1,69,998

Inventory:
├── Reserved: 2 units
└── Available: 8 units (10 - 2)
```

**Day 12: Customer B Orders**
```
Customer: Priya
Order: ORD002
Items:
- 1 × iPhone 15 Pro 512GB Black @ ₹99,999 = ₹99,999

Inventory:
├── Reserved: 1 unit
└── Available: 4 units (5 - 1)
```

**Day 15: Orders Delivered**
```sql
-- Inventory reduced
Downtown Store:
├── iPhone 15 Pro 256GB Black: 8 units (10 - 2)
└── iPhone 15 Pro 512GB Black: 4 units (5 - 1)
```

#### Phase 3: Calculate Revenue & Profit

**Revenue Calculation:**
```
Order 1 (ORD001): ₹1,69,998
Order 2 (ORD002): ₹99,999
Total Revenue: ₹2,69,997
```

**Cost Calculation:**
```
Order 1 Cost: 2 × ₹70,000 = ₹1,40,000
Order 2 Cost: 1 × ₹82,000 = ₹82,000
Total COGS: ₹2,22,000
```

**Profit Calculation:**
```
Gross Profit = Revenue - COGS
             = ₹2,69,997 - ₹2,22,000
             = ₹47,997

Profit Margin = (₹47,997 / ₹2,69,997) × 100
              = 17.78%
```

**Remaining Inventory Value:**
```
8 × iPhone 15 Pro 256GB Black @ ₹70,000 = ₹5,60,000
4 × iPhone 15 Pro 512GB Black @ ₹82,000 = ₹3,28,000
Total Inventory Value: ₹8,88,000
```

**Summary:**
```
Investment: ₹13,19,800
Revenue: ₹2,69,997
COGS: ₹2,22,000
Gross Profit: ₹47,997
Remaining Inventory: ₹8,88,000 (not yet sold)
```

### SQL Query for Complete Business View

```sql
-- Complete business dashboard
WITH purchase_summary AS (
  SELECT
    SUM(total_amount) as total_invested
  FROM purchase_orders
  WHERE status = 'received'
),
sales_summary AS (
  SELECT
    SUM(o.total_amount) as total_revenue,
    SUM(oi.unit_cost_price * oi.quantity) as total_cogs
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status = 'delivered'
    AND o.payment_status = 'paid'
),
inventory_value AS (
  SELECT
    SUM(i.quantity * COALESCE(pv.cost_price, p.cost_price)) as current_inventory_value
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN product_variants pv ON i.variant_id = pv.id
)
SELECT
  ps.total_invested,
  ss.total_revenue,
  ss.total_cogs,
  (ss.total_revenue - ss.total_cogs) as gross_profit,
  ROUND(((ss.total_revenue - ss.total_cogs) / ss.total_revenue * 100)::numeric, 2) as profit_margin,
  iv.current_inventory_value,
  (ps.total_invested - ss.total_cogs) as inventory_at_cost
FROM purchase_summary ps, sales_summary ss, inventory_value iv;
```

---

## 📈 Key Performance Indicators (KPIs)

### Essential Business Metrics

**1. Gross Profit Margin**
```sql
SELECT
  ROUND(
    (SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) / SUM(oi.total_price) * 100)::numeric,
    2
  ) as gross_profit_margin
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
  AND o.payment_status = 'paid';
```

**2. Inventory Turnover Ratio**
```sql
-- How many times you sell and replace inventory
SELECT
  SUM(oi.unit_cost_price * oi.quantity) / AVG(inventory_value.value) as turnover_ratio
FROM order_items oi
CROSS JOIN (
  SELECT SUM(i.quantity * COALESCE(pv.cost_price, p.cost_price)) as value
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN product_variants pv ON i.variant_id = pv.id
) inventory_value;
```

**3. Average Order Value (AOV)**
```sql
SELECT AVG(total_amount) as average_order_value
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid';
```

**4. Customer Lifetime Value (CLV)**
```sql
SELECT
  customer_id,
  COUNT(*) as total_orders,
  SUM(total_amount) as lifetime_value,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'delivered'
  AND payment_status = 'paid'
GROUP BY customer_id
ORDER BY lifetime_value DESC;
```

**5. Return on Investment (ROI)**
```sql
WITH totals AS (
  SELECT
    SUM(total_amount) as invested
  FROM purchase_orders
  WHERE status = 'received'
),
profits AS (
  SELECT
    SUM(oi.total_price - (oi.unit_cost_price * oi.quantity)) as profit
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'delivered'
    AND o.payment_status = 'paid'
)
SELECT
  ROUND((profits.profit / totals.invested * 100)::numeric, 2) as roi_percent
FROM totals, profits;
```

---

## ✅ Summary

### How Everything Connects

1. **Purchase Management**:
   - Create PO → Add items (products/variants) → Receive stock → Inventory increases
   - Each variant tracked separately with its own cost price

2. **Product Management**:
   - Products have base info
   - Variants have specific prices and attributes
   - Cost prices updated from purchase orders

3. **Order Management**:
   - Customer orders → Reserve inventory → Payment → Deliver → Reduce inventory
   - Each order item records both selling price and cost price

4. **Revenue**:
   - Sum of all delivered order amounts
   - Can be broken down by product, category, store, date

5. **Profit**:
   - Revenue minus cost of goods sold (COGS)
   - Calculated using unit_cost_price stored in order_items
   - Shows actual profit per product/variant

6. **Key Insight**:
   - **ALWAYS store cost_price in order_items** at time of order
   - This ensures profit calculations remain accurate even if future purchase prices change

---

**This complete flow ensures you can track every rupee from purchase to profit!**
