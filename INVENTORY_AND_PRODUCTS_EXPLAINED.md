# 📦 Product Variants, Categories & Inventory Management - Complete Guide

This document explains how product variants, categories, and all inventory management features work together in the e-commerce system.

---

## 🏷️ Product Categories

### What Are Categories?

Categories organize products into logical groups, making it easier for customers to browse and find products. Categories support **hierarchical structures** (parent-child relationships).

### Category Structure

```
Electronics (Parent)
├── Mobile Phones (Child)
│   ├── Smartphones (Grandchild)
│   └── Feature Phones (Grandchild)
├── Laptops (Child)
└── Accessories (Child)

Groceries (Parent)
├── Fruits & Vegetables (Child)
├── Dairy Products (Child)
└── Snacks (Child)
```

### Category Table Schema

```sql
categories
├── id: uuid (Primary Key)
├── name: text (e.g., "Electronics", "Mobile Phones")
├── slug: text (URL-friendly, e.g., "electronics", "mobile-phones")
├── description: text
├── image_url: text (Category banner/icon)
├── parent_category_id: uuid (NULL for root categories, references categories.id for sub-categories)
├── is_active: boolean
└── display_order: integer (For sorting on frontend)
```

### How Categories Work

1. **Root Categories**: Categories with `parent_category_id = NULL`
2. **Sub-categories**: Categories with a `parent_category_id` pointing to another category
3. **Multi-level Nesting**: You can have unlimited nesting depth (Category → Subcategory → Sub-subcategory)

### Example Categories

```sql
-- Root category
INSERT INTO categories (name, slug, parent_category_id, display_order)
VALUES ('Electronics', 'electronics', NULL, 1);

-- Sub-category
INSERT INTO categories (name, slug, parent_category_id, display_order)
VALUES ('Mobile Phones', 'mobile-phones', 'electronics-uuid-here', 1);

-- Sub-sub-category
INSERT INTO categories (name, slug, parent_category_id, display_order)
VALUES ('Smartphones', 'smartphones', 'mobile-phones-uuid-here', 1);
```

### Category Management Features

1. **Tree View Display**: Shows nested categories visually
2. **Drag & Drop Reordering**: Change `display_order` to reposition categories
3. **Bulk Operations**: Activate/deactivate multiple categories
4. **Product Count**: Show how many products are in each category
5. **Breadcrumb Navigation**: Electronics > Mobile Phones > Smartphones

---

## 🎨 Product Variants

### What Are Product Variants?

Product variants allow you to sell **the same product in different configurations** without creating separate products. For example:

- A T-shirt in different sizes (S, M, L, XL) and colors (Red, Blue, Green)
- A bottle of juice in different sizes (250ml, 500ml, 1L)
- A phone in different storage capacities (64GB, 128GB, 256GB)

### Why Use Variants?

**Without Variants** (❌ Bad approach):
```
Products:
- Apple iPhone 15 - 128GB Black
- Apple iPhone 15 - 256GB Black
- Apple iPhone 15 - 512GB Black
- Apple iPhone 15 - 128GB White
- Apple iPhone 15 - 256GB White
- Apple iPhone 15 - 512GB White
```
This creates **6 separate products** for the same iPhone, making management difficult.

**With Variants** (✅ Good approach):
```
Product: Apple iPhone 15
Variants:
- 128GB Black (SKU: IP15-128-BLK)
- 256GB Black (SKU: IP15-256-BLK)
- 512GB Black (SKU: IP15-512-BLK)
- 128GB White (SKU: IP15-128-WHT)
- 256GB White (SKU: IP15-256-WHT)
- 512GB White (SKU: IP15-512-WHT)
```
This creates **1 product with 6 variants**, much easier to manage.

### Product + Variant Schema

**Products Table:**
```sql
products
├── id: uuid
├── name: text ("Apple iPhone 15")
├── slug: text ("apple-iphone-15")
├── description: text
├── category_id: uuid → categories.id
├── base_price: decimal (Base price, e.g., ₹79,999)
├── cost_price: decimal (What you paid for it)
├── mrp: decimal (Maximum Retail Price)
├── sku: text (Base SKU: "IP15")
├── barcode: text
├── images: text[] (Array of image URLs)
├── is_active: boolean
├── is_featured: boolean
└── tags: text[] (["smartphone", "apple", "5g"])
```

**Product Variants Table:**
```sql
product_variants
├── id: uuid
├── product_id: uuid → products.id
├── name: text ("128GB Black")
├── sku: text ("IP15-128-BLK") - Unique per variant
├── price: decimal (₹79,999)
├── cost_price: decimal (₹65,000)
├── attributes: jsonb ({"storage": "128GB", "color": "Black"})
└── is_active: boolean
```

### Variant Attributes (JSONB)

The `attributes` column stores variant-specific properties as JSON:

```json
{
  "storage": "128GB",
  "color": "Black",
  "size": null,
  "material": null
}
```

For a T-shirt:
```json
{
  "size": "L",
  "color": "Red",
  "fabric": "Cotton"
}
```

For a juice bottle:
```json
{
  "volume": "500ml",
  "flavor": "Orange"
}
```

### How Variants Work in Practice

**Example 1: T-Shirt Product**

```typescript
Product: "Cotton Round Neck T-Shirt"
Base Price: ₹499
SKU: "TSHIRT-RN-001"

Variants:
1. Small / Red    → SKU: "TSHIRT-RN-001-S-RED"   → Price: ₹499
2. Small / Blue   → SKU: "TSHIRT-RN-001-S-BLU"   → Price: ₹499
3. Medium / Red   → SKU: "TSHIRT-RN-001-M-RED"   → Price: ₹549
4. Medium / Blue  → SKU: "TSHIRT-RN-001-M-BLU"   → Price: ₹549
5. Large / Red    → SKU: "TSHIRT-RN-001-L-RED"   → Price: ₹599
6. Large / Blue   → SKU: "TSHIRT-RN-001-L-BLU"   → Price: ₹599
```

**Example 2: Juice Product**

```typescript
Product: "Fresh Orange Juice"
Base Price: ₹50
SKU: "JUICE-ORG"

Variants:
1. 250ml → SKU: "JUICE-ORG-250"  → Price: ₹50
2. 500ml → SKU: "JUICE-ORG-500"  → Price: ₹90
3. 1 Liter → SKU: "JUICE-ORG-1L" → Price: ₹160
```

### Products Without Variants

Some products don't need variants (e.g., a unique handmade item). In this case:
- Create the product with all details
- **Don't create any variant records**
- Inventory table will have `variant_id = NULL`

---

## 📦 Inventory Management

### What Is Inventory?

Inventory tracks **how many units of each product/variant** you have in each store. It's the foundation of stock management.

### Inventory Table Schema

```sql
inventory
├── id: uuid
├── product_id: uuid → products.id
├── variant_id: uuid → product_variants.id (NULL if product has no variants)
├── store_id: uuid → stores.id
├── quantity: integer (Available stock)
├── reserved_quantity: integer (Stock held for pending orders)
├── reorder_level: integer (Alert threshold, e.g., 10)
├── reorder_quantity: integer (How much to reorder, e.g., 50)
└── last_restocked_at: timestamptz

UNIQUE CONSTRAINT: (product_id, variant_id, store_id)
```

### Key Concepts

1. **Available Quantity**: `quantity` - How many units are in stock
2. **Reserved Quantity**: `reserved_quantity` - Stock allocated to pending orders (not yet shipped)
3. **Actual Available**: `quantity - reserved_quantity` = What can be sold now
4. **Reorder Level**: When to trigger a low-stock alert
5. **Reorder Quantity**: How many units to order from supplier

### Inventory Example

**Store: Downtown Branch**

```
Product: Apple iPhone 15 Pro
Variant: 256GB Black

Inventory:
├── quantity: 50 (Total units in warehouse)
├── reserved_quantity: 5 (Allocated to pending orders)
├── actual_available: 45 (Can sell 45 more units)
├── reorder_level: 10 (Alert when stock drops below 10)
└── reorder_quantity: 30 (Order 30 units when low)
```

### Multi-Store Inventory

If you have **multiple stores**, each store has separate inventory:

```
Product: iPhone 15 Pro 256GB Black

Store A (Downtown):
├── quantity: 50
└── reserved_quantity: 5

Store B (Airport):
├── quantity: 30
└── reserved_quantity: 2

Store C (Mall):
├── quantity: 0
└── reserved_quantity: 0 (Out of stock)
```

### How Inventory Changes

**When a customer places an order:**
```sql
-- Reserve the quantity
UPDATE inventory
SET reserved_quantity = reserved_quantity + 3
WHERE product_id = 'iphone-uuid'
  AND variant_id = '256gb-black-uuid'
  AND store_id = 'store-a-uuid';
```

**When the order is shipped/delivered:**
```sql
-- Reduce both quantity and reserved
UPDATE inventory
SET quantity = quantity - 3,
    reserved_quantity = reserved_quantity - 3
WHERE product_id = 'iphone-uuid'
  AND variant_id = '256gb-black-uuid'
  AND store_id = 'store-a-uuid';
```

**When an order is cancelled:**
```sql
-- Release the reserved quantity
UPDATE inventory
SET reserved_quantity = reserved_quantity - 3
WHERE product_id = 'iphone-uuid'
  AND variant_id = '256gb-black-uuid'
  AND store_id = 'store-a-uuid';
```

### Low Stock Alerts

```sql
-- Find products with low stock
SELECT p.name, pv.name as variant_name, i.quantity, i.reorder_level, s.name as store_name
FROM inventory i
JOIN products p ON i.product_id = p.id
LEFT JOIN product_variants pv ON i.variant_id = pv.id
JOIN stores s ON i.store_id = s.id
WHERE i.quantity <= i.reorder_level
  AND p.is_active = true;
```

---

## 🔄 Inventory Adjustments

### What Are Inventory Adjustments?

Inventory adjustments are **manual changes to stock levels** with proper tracking and audit trails. They account for:

- **Restock**: New stock arrived from supplier
- **Damage**: Products damaged and unusable
- **Theft**: Products stolen
- **Correction**: Fixing data entry errors
- **Return**: Customer returned items

### Inventory Adjustments Table Schema

```sql
inventory_adjustments
├── id: uuid
├── product_id: uuid → products.id
├── variant_id: uuid → product_variants.id (NULL if no variants)
├── store_id: uuid → stores.id
├── adjustment_type: enum ('restock', 'damage', 'theft', 'correction', 'return')
├── quantity_change: integer (Can be positive or negative)
├── reason: text
├── notes: text
├── adjusted_by: uuid → users.id (Who made the adjustment)
└── created_at: timestamptz
```

### Adjustment Types Explained

1. **Restock** (+quantity)
   - New inventory received from supplier
   - Example: Received 100 units of iPhone 15

2. **Damage** (-quantity)
   - Products damaged and cannot be sold
   - Example: 5 units damaged during transport

3. **Theft** (-quantity)
   - Products stolen or missing
   - Example: 2 units missing after inventory audit

4. **Correction** (+/- quantity)
   - Fixing data entry mistakes
   - Example: Someone entered 100 instead of 10, correction: -90

5. **Return** (+quantity)
   - Customer returned products
   - Example: Customer returned 1 unit (defective)

### How Adjustments Work

**Example Scenario: Restock**

```typescript
Initial State:
Product: iPhone 15 Pro 256GB Black
Store: Downtown
Current Quantity: 10

Adjustment:
Type: Restock
Quantity Change: +50
Reason: "Weekly supply from Apple"
Adjusted By: Admin (user_id: admin-uuid)

After Adjustment:
New Quantity: 60
```

**SQL Implementation:**

```sql
-- Step 1: Log the adjustment
INSERT INTO inventory_adjustments (
  product_id, variant_id, store_id,
  adjustment_type, quantity_change,
  reason, notes, adjusted_by
) VALUES (
  'iphone-uuid', '256gb-black-uuid', 'store-uuid',
  'restock', 50,
  'Weekly supply from Apple', 'Batch #12345', 'admin-uuid'
);

-- Step 2: Update inventory
UPDATE inventory
SET quantity = quantity + 50,
    last_restocked_at = NOW()
WHERE product_id = 'iphone-uuid'
  AND variant_id = '256gb-black-uuid'
  AND store_id = 'store-uuid';
```

### Database Function for Adjustments

```sql
CREATE OR REPLACE FUNCTION apply_inventory_adjustment(
  p_product_id uuid,
  p_variant_id uuid,
  p_store_id uuid,
  p_adjustment_type text,
  p_quantity_change integer,
  p_reason text,
  p_notes text,
  p_adjusted_by uuid
)
RETURNS void AS $$
BEGIN
  -- Log the adjustment
  INSERT INTO inventory_adjustments (
    product_id, variant_id, store_id, adjustment_type,
    quantity_change, reason, notes, adjusted_by
  ) VALUES (
    p_product_id, p_variant_id, p_store_id, p_adjustment_type,
    p_quantity_change, p_reason, p_notes, p_adjusted_by
  );

  -- Update inventory
  UPDATE inventory
  SET quantity = quantity + p_quantity_change,
      last_restocked_at = CASE
        WHEN p_adjustment_type = 'restock' THEN NOW()
        ELSE last_restocked_at
      END
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND store_id = p_store_id;

  -- If inventory record doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO inventory (product_id, variant_id, store_id, quantity)
    VALUES (p_product_id, p_variant_id, p_store_id, GREATEST(p_quantity_change, 0));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Audit Trail

Every adjustment is logged with:
- What changed
- Who made the change
- When it was changed
- Why it was changed

```sql
-- View adjustment history
SELECT
  p.name as product_name,
  pv.name as variant_name,
  s.name as store_name,
  ia.adjustment_type,
  ia.quantity_change,
  ia.reason,
  u.full_name as adjusted_by,
  ia.created_at
FROM inventory_adjustments ia
JOIN products p ON ia.product_id = p.id
LEFT JOIN product_variants pv ON ia.variant_id = pv.id
JOIN stores s ON ia.store_id = s.id
JOIN users u ON ia.adjusted_by = u.id
ORDER BY ia.created_at DESC;
```

---

## 📊 Bulk Inventory Management

### What Is Bulk Inventory Upload?

Bulk inventory upload allows you to **update stock levels for hundreds or thousands of products at once** using a CSV file. This is essential for:

- Initial inventory setup
- Weekly/monthly stock updates
- Syncing with external warehouse systems
- After physical inventory audits

### CSV Template Format

```csv
sku,store_id,quantity,reorder_level,reorder_quantity
IP15-128-BLK,store-downtown-uuid,50,10,30
IP15-256-BLK,store-downtown-uuid,30,10,30
IP15-512-BLK,store-downtown-uuid,20,5,20
TSHIRT-RN-001-S-RED,store-mall-uuid,100,20,50
TSHIRT-RN-001-M-RED,store-mall-uuid,80,20,50
JUICE-ORG-250,store-airport-uuid,200,50,100
```

### How Bulk Upload Works

**Step 1: Upload CSV File**
- User uploads CSV through web interface
- File is parsed and validated

**Step 2: Validation**
- Check if SKU exists in database
- Check if store_id is valid
- Validate quantity is a positive number
- Check for duplicate SKUs in CSV

**Step 3: Preview**
- Show user what will be updated
- Highlight any errors or warnings
- Display summary (X products will be updated)

**Step 4: Import**
- Process each row
- Update or insert inventory records
- Log adjustments
- Show progress bar

**Step 5: Results**
- Show success count
- Show error count
- Download error report (if any)

### Implementation Example

```typescript
// Frontend: Upload and Parse CSV
async function uploadBulkInventory(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  // Parse CSV
  const csvData = await parseCSV(file);

  // Validate
  const validation = await validateInventoryData(csvData);

  if (validation.errors.length > 0) {
    showErrors(validation.errors);
    return;
  }

  // Preview
  showPreview(validation.validRows);

  // User confirms
  await confirmImport();

  // Import
  const results = await bulkImportInventory(validation.validRows);

  showResults(results);
}

// Backend: Process Bulk Import
async function bulkImportInventory(rows) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const row of rows) {
    try {
      // Find product/variant by SKU
      const { product_id, variant_id } = await findBySKU(row.sku);

      // Upsert inventory
      await supabase
        .from('inventory')
        .upsert({
          product_id,
          variant_id,
          store_id: row.store_id,
          quantity: row.quantity,
          reorder_level: row.reorder_level,
          reorder_quantity: row.reorder_quantity
        }, {
          onConflict: 'product_id,variant_id,store_id'
        });

      // Log adjustment
      await supabase
        .from('inventory_adjustments')
        .insert({
          product_id,
          variant_id,
          store_id: row.store_id,
          adjustment_type: 'correction',
          quantity_change: row.quantity - (existingQuantity || 0),
          reason: 'Bulk inventory update',
          adjusted_by: currentUserId
        });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        sku: row.sku,
        error: error.message
      });
    }
  }

  return results;
}
```

### Best Practices for Bulk Upload

1. **Always provide a template**: Give users a CSV template to download
2. **Validate before import**: Check all data before making changes
3. **Show preview**: Let users see what will change
4. **Allow rollback**: Keep backups or log all changes
5. **Progress indicator**: Show progress for large imports
6. **Error reporting**: Clearly show which rows failed and why
7. **Partial imports**: Allow successful rows to import even if some fail

---

## 🏪 Purchase Management (Advanced)

### What Is Purchase Management?

Purchase management tracks your **procurement from suppliers**. It helps you:
- Order stock from suppliers
- Track what's on order
- Receive shipments
- Automatically update inventory when stock arrives

### Purchase Management Tables

**1. Suppliers Table:**
```sql
suppliers
├── id: uuid
├── name: text ("Apple Inc.")
├── contact_person: text
├── email: text
├── phone: text
├── address: text
├── payment_terms: text ("Net 30 days")
├── is_active: boolean
└── created_at: timestamptz
```

**2. Purchase Orders Table:**
```sql
purchase_orders
├── id: uuid
├── po_number: text (Auto-generated: "PO20250115001")
├── supplier_id: uuid → suppliers.id
├── store_id: uuid → stores.id (Which store is receiving)
├── status: enum ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled')
├── order_date: date
├── expected_delivery_date: date
├── actual_delivery_date: date (nullable)
├── subtotal: decimal
├── tax_amount: decimal
├── shipping_cost: decimal
├── total_amount: decimal
├── notes: text
├── created_by: uuid → users.id
└── created_at: timestamptz
```

**3. Purchase Order Items Table:**
```sql
purchase_order_items
├── id: uuid
├── purchase_order_id: uuid → purchase_orders.id
├── product_id: uuid → products.id
├── variant_id: uuid → product_variants.id (nullable)
├── quantity_ordered: integer
├── quantity_received: integer (default: 0)
├── unit_cost_price: decimal
├── total_cost: decimal
└── notes: text
```

### Purchase Order Lifecycle

**1. Draft → Sent**
```typescript
Status: draft
- Admin creates PO
- Adds items (products, quantities, prices)
- Reviews details
- Clicks "Send to Supplier"
Status: sent
```

**2. Sent → Confirmed**
```typescript
Status: sent
- Supplier confirms order
- Admin marks as "Confirmed"
Status: confirmed
```

**3. Confirmed → Partial (Optional)**
```typescript
Status: confirmed
- Supplier ships partial order
- Admin receives 50 out of 100 items
- Marks partial receipt
Status: partial
```

**4. Partial/Confirmed → Received**
```typescript
Status: partial or confirmed
- All items received
- Admin marks as "Received"
- Inventory automatically updated
Status: received
```

### How Purchase Orders Update Inventory

**When marking a PO as received:**

```sql
-- Get all items from the PO
SELECT poi.product_id, poi.variant_id, poi.quantity_ordered, po.store_id
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.id = 'po-uuid';

-- For each item, update inventory
UPDATE inventory
SET quantity = quantity + poi.quantity_ordered,
    last_restocked_at = NOW()
WHERE product_id = poi.product_id
  AND variant_id = poi.variant_id
  AND store_id = po.store_id;

-- Create inventory adjustment log
INSERT INTO inventory_adjustments (
  product_id, variant_id, store_id,
  adjustment_type, quantity_change,
  reason, notes, adjusted_by
) VALUES (
  poi.product_id, poi.variant_id, po.store_id,
  'restock', poi.quantity_ordered,
  'Purchase Order Received', 'PO#: ' || po.po_number, current_user_id
);
```

### Purchase Management Features

**1. Dashboard:**
- Pending POs (sent/confirmed)
- Expected deliveries this week
- Overdue deliveries
- Total spend this month

**2. Create Purchase Order:**
- Select supplier
- Select store (destination)
- Add products (search by name/SKU)
- Set quantities
- Set unit prices
- Calculate totals
- Add notes
- Save as draft or send immediately

**3. Receive Purchase Order:**
- View PO details
- Mark quantities received (partial or full)
- Update inventory automatically
- Print receipt
- Close PO

**4. Supplier Management:**
- Add/edit suppliers
- View purchase history per supplier
- Track payment terms
- Contact information

**5. Reports:**
- Purchase history by date range
- Spend by supplier
- Pending orders
- Received vs ordered quantity variance

---

## 🔄 Complete Workflow Example

### Scenario: Selling T-Shirts with Variants

**Step 1: Create Category**
```sql
INSERT INTO categories (name, slug)
VALUES ('Clothing', 'clothing');

INSERT INTO categories (name, slug, parent_category_id)
VALUES ('T-Shirts', 't-shirts', 'clothing-uuid');
```

**Step 2: Create Product**
```sql
INSERT INTO products (
  name, slug, description, category_id,
  base_price, cost_price, mrp, sku,
  images, is_active
) VALUES (
  'Cotton Round Neck T-Shirt',
  'cotton-round-neck-tshirt',
  'Premium cotton t-shirt for everyday wear',
  't-shirts-category-uuid',
  499.00, 200.00, 699.00, 'TSHIRT-RN-001',
  ARRAY['https://images.pexels.com/tshirt1.jpg'],
  true
);
```

**Step 3: Create Variants**
```sql
-- Small Red
INSERT INTO product_variants (
  product_id, name, sku, price, cost_price,
  attributes
) VALUES (
  'tshirt-product-uuid',
  'Small / Red',
  'TSHIRT-RN-001-S-RED',
  499.00, 200.00,
  '{"size": "S", "color": "Red"}'
);

-- Small Blue
INSERT INTO product_variants (
  product_id, name, sku, price, cost_price,
  attributes
) VALUES (
  'tshirt-product-uuid',
  'Small / Blue',
  'TSHIRT-RN-001-S-BLU',
  499.00, 200.00,
  '{"size": "S", "color": "Blue"}'
);

-- (Repeat for M, L, XL sizes...)
```

**Step 4: Set Initial Inventory (via Purchase Order)**

Create a purchase order:
```sql
-- Create supplier
INSERT INTO suppliers (name, contact_person, email)
VALUES ('ABC Garments', 'John Doe', 'john@abcgarments.com');

-- Create purchase order
INSERT INTO purchase_orders (
  po_number, supplier_id, store_id, status,
  order_date, expected_delivery_date, total_amount
) VALUES (
  'PO20250115001',
  'supplier-uuid', 'store-uuid', 'confirmed',
  '2025-01-15', '2025-01-20', 50000.00
);

-- Add items to PO
INSERT INTO purchase_order_items (
  purchase_order_id, product_id, variant_id,
  quantity_ordered, unit_cost_price, total_cost
) VALUES
  ('po-uuid', 'tshirt-uuid', 'small-red-uuid', 50, 200, 10000),
  ('po-uuid', 'tshirt-uuid', 'small-blue-uuid', 50, 200, 10000),
  ('po-uuid', 'tshirt-uuid', 'medium-red-uuid', 50, 200, 10000);
```

**Step 5: Receive Stock**

Mark PO as received → Inventory auto-updates:
```sql
-- This happens automatically when marking PO as received
INSERT INTO inventory (product_id, variant_id, store_id, quantity)
VALUES
  ('tshirt-uuid', 'small-red-uuid', 'store-uuid', 50),
  ('tshirt-uuid', 'small-blue-uuid', 'store-uuid', 50),
  ('tshirt-uuid', 'medium-red-uuid', 'store-uuid', 50);
```

**Step 6: Customer Orders**

Customer orders 2 Small Red T-Shirts:
```sql
-- Reserve inventory
UPDATE inventory
SET reserved_quantity = reserved_quantity + 2
WHERE product_id = 'tshirt-uuid'
  AND variant_id = 'small-red-uuid'
  AND store_id = 'store-uuid';

-- After order is delivered
UPDATE inventory
SET quantity = quantity - 2,
    reserved_quantity = reserved_quantity - 2
WHERE product_id = 'tshirt-uuid'
  AND variant_id = 'small-red-uuid'
  AND store_id = 'store-uuid';
```

**Step 7: Handle Damage**

5 Small Blue T-Shirts got damaged:
```sql
SELECT apply_inventory_adjustment(
  'tshirt-uuid',
  'small-blue-uuid',
  'store-uuid',
  'damage',
  -5,
  'Water damage during storage',
  'Disposed as per protocol',
  'admin-user-uuid'
);
```

**Step 8: Bulk Update via CSV**

Upload CSV to update stock levels across all variants:
```csv
sku,store_id,quantity,reorder_level
TSHIRT-RN-001-S-RED,store-uuid,48,10
TSHIRT-RN-001-S-BLU,store-uuid,45,10
TSHIRT-RN-001-M-RED,store-uuid,50,10
```

---

## 📈 Summary

### Key Takeaways

1. **Categories**: Organize products hierarchically (parent-child relationships)

2. **Product Variants**: One product, multiple configurations (size, color, storage, etc.)

3. **Inventory**: Track stock levels per product/variant/store with reserved quantities

4. **Inventory Adjustments**: Manual stock changes with audit trail (restock, damage, theft, etc.)

5. **Bulk Inventory**: Upload CSV to update hundreds of products at once

6. **Purchase Management**: Order from suppliers, track deliveries, auto-update inventory

### Data Flow

```
Supplier → Purchase Order → Receive Stock → Inventory Updated
                                                    ↓
                                          Customer Orders Product
                                                    ↓
                                          Reserve Inventory
                                                    ↓
                                          Order Delivered
                                                    ↓
                                          Reduce Inventory
```

### Best Practices

1. Always use variants for products with multiple options
2. Set proper reorder levels to avoid stockouts
3. Log all inventory changes through adjustments
4. Use purchase orders to track procurement
5. Regularly audit physical vs system inventory
6. Use bulk upload for large inventory updates
7. Enable low-stock alerts for critical items

---

**This system provides complete visibility and control over your entire product catalog and inventory across multiple stores.**
