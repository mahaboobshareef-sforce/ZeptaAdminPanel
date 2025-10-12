/*
  # Bulk Inventory and Profit Analysis System

  1. New Tables
    - `purchase_records` - Track all purchase batches with costs
    - `bulk_inventory` - Store bulk quantities per product per store
    - `inventory_adjustments` - Track losses, damages, corrections
    - `sales_cost_allocation` - FIFO cost allocation for sales

  2. Enhanced Tables
    - Add `base_unit_quantity` to `product_variants` for unit conversions
    - Add `base_unit_type` and `base_unit_label` for flexible units

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for admin access
    - Maintain data integrity with proper constraints

  4. Functions
    - FIFO cost allocation function
    - Bulk inventory calculation functions
    - Profit analysis helper functions
*/

-- Add base unit tracking to product variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'base_unit_quantity'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN base_unit_quantity numeric(10,2) DEFAULT 1.0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'base_unit_type'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN base_unit_type text DEFAULT 'weight';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'base_unit_label'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN base_unit_label text DEFAULT 'kg';
  END IF;
END $$;

-- Create purchase records table
CREATE TABLE IF NOT EXISTS purchase_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text UNIQUE NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  unit_type text NOT NULL DEFAULT 'weight',
  unit_label text NOT NULL DEFAULT 'kg',
  cost_per_unit numeric(10,2) NOT NULL CHECK (cost_per_unit >= 0),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost >= 0),
  remaining_quantity numeric(10,2) NOT NULL CHECK (remaining_quantity >= 0),
  supplier_name text,
  invoice_number text,
  purchase_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_records_admin_all"
  ON purchase_records
  FOR ALL
  TO authenticated
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

-- Create bulk inventory table
CREATE TABLE IF NOT EXISTS bulk_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  total_quantity numeric(10,2) NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  reserved_quantity numeric(10,2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity numeric(10,2) GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
  unit_type text NOT NULL DEFAULT 'weight',
  unit_label text NOT NULL DEFAULT 'kg',
  weighted_avg_cost numeric(10,2) DEFAULT 0,
  last_purchase_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_bulk_inventory_store_product UNIQUE (store_id, product_id)
);

ALTER TABLE bulk_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_inventory_admin_all"
  ON bulk_inventory
  FOR ALL
  TO authenticated
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

CREATE POLICY "bulk_inventory_select_all"
  ON bulk_inventory
  FOR SELECT
  TO authenticated
  USING (true);

-- Create inventory adjustments table (for losses, damages)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL CHECK (adjustment_type = ANY (ARRAY['damage'::text, 'expiry'::text, 'theft'::text, 'correction'::text, 'return'::text])),
  quantity_adjusted numeric(10,2) NOT NULL,
  unit_type text NOT NULL DEFAULT 'weight',
  unit_label text NOT NULL DEFAULT 'kg',
  cost_impact numeric(10,2) NOT NULL DEFAULT 0,
  reason text,
  reference_batch_id uuid REFERENCES purchase_records(id),
  adjusted_by uuid NOT NULL REFERENCES users(id),
  adjustment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_adjustments_admin_all"
  ON inventory_adjustments
  FOR ALL
  TO authenticated
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

-- Create sales cost allocation table (FIFO tracking)
CREATE TABLE IF NOT EXISTS sales_cost_allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  purchase_record_id uuid NOT NULL REFERENCES purchase_records(id),
  quantity_allocated numeric(10,2) NOT NULL CHECK (quantity_allocated > 0),
  cost_per_unit numeric(10,2) NOT NULL CHECK (cost_per_unit >= 0),
  total_allocated_cost numeric(10,2) NOT NULL CHECK (total_allocated_cost >= 0),
  allocation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_cost_allocation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_cost_allocation_admin_all"
  ON sales_cost_allocation
  FOR ALL
  TO authenticated
  USING (is_admin_ctx())
  WITH CHECK (is_admin_ctx());

-- Function to generate unique batch numbers
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS text AS $$
DECLARE
  batch_num text;
  counter integer := 1;
BEGIN
  LOOP
    batch_num := 'BATCH-' || 
                 TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || '-' || 
                 LPAD(counter::text, 3, '0');
    
    -- Check if batch number exists
    IF NOT EXISTS (SELECT 1 FROM purchase_records WHERE batch_number = batch_num) THEN
      RETURN batch_num;
    END IF;
    
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update bulk inventory after purchase
CREATE OR REPLACE FUNCTION update_bulk_inventory_after_purchase()
RETURNS trigger AS $$
BEGIN
  -- Insert or update bulk inventory
  INSERT INTO bulk_inventory (
    store_id, 
    product_id, 
    total_quantity, 
    unit_type, 
    unit_label,
    weighted_avg_cost,
    last_purchase_date
  )
  VALUES (
    NEW.store_id,
    NEW.product_id,
    NEW.quantity,
    NEW.unit_type,
    NEW.unit_label,
    NEW.cost_per_unit,
    NEW.purchase_date
  )
  ON CONFLICT (store_id, product_id)
  DO UPDATE SET
    total_quantity = bulk_inventory.total_quantity + NEW.quantity,
    weighted_avg_cost = (
      (bulk_inventory.total_quantity * bulk_inventory.weighted_avg_cost) + 
      (NEW.quantity * NEW.cost_per_unit)
    ) / (bulk_inventory.total_quantity + NEW.quantity),
    last_purchase_date = NEW.purchase_date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bulk inventory when purchase is made
DROP TRIGGER IF EXISTS trg_update_bulk_inventory ON purchase_records;
CREATE TRIGGER trg_update_bulk_inventory
  AFTER INSERT ON purchase_records
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_inventory_after_purchase();

-- Function to allocate costs using FIFO method
CREATE OR REPLACE FUNCTION allocate_sale_costs(
  p_order_item_id uuid,
  p_product_id uuid,
  p_store_id uuid,
  p_quantity_kg numeric
)
RETURNS void AS $$
DECLARE
  batch_record RECORD;
  remaining_to_allocate numeric := p_quantity_kg;
  quantity_from_batch numeric;
BEGIN
  -- Get batches in FIFO order (oldest first)
  FOR batch_record IN
    SELECT id, remaining_quantity_kg, cost_per_unit
    FROM purchase_records
    WHERE product_id = p_product_id 
      AND store_id = p_store_id 
      AND remaining_quantity_kg > 0
    ORDER BY purchase_date ASC
  LOOP
    EXIT WHEN remaining_to_allocate <= 0;
    
    -- Calculate how much to take from this batch
    quantity_from_batch := LEAST(batch_record.remaining_quantity_kg, remaining_to_allocate);
    
    -- Record the cost allocation
    INSERT INTO sales_cost_allocation (
      order_item_id,
      purchase_record_id,
      quantity_allocated,
      cost_per_unit,
      total_allocated_cost
    ) VALUES (
      p_order_item_id,
      batch_record.id,
      quantity_from_batch,
      batch_record.cost_per_unit,
      quantity_from_batch * batch_record.cost_per_unit
    );
    
    -- Update remaining quantity in purchase record
    UPDATE purchase_records
    SET remaining_quantity_kg = remaining_quantity_kg - quantity_from_batch
    WHERE id = batch_record.id;
    
    -- Update remaining to allocate
    remaining_to_allocate := remaining_to_allocate - quantity_from_batch;
  END LOOP;
  
  -- Update bulk inventory
  UPDATE bulk_inventory
  SET total_quantity = total_quantity - p_quantity_kg,
      updated_at = now()
  WHERE store_id = p_store_id AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate variant stock from bulk inventory
CREATE OR REPLACE FUNCTION get_variant_stock(
  p_store_id uuid,
  p_variant_id uuid
)
RETURNS integer AS $$
DECLARE
  bulk_qty numeric;
  variant_unit numeric;
  result integer;
BEGIN
  -- Get bulk quantity for this product
  SELECT COALESCE(bi.available_quantity, 0), COALESCE(pv.base_unit_quantity, 1.0)
  INTO bulk_qty, variant_unit
  FROM product_variants pv
  LEFT JOIN bulk_inventory bi ON (bi.product_id = pv.product_id AND bi.store_id = p_store_id)
  WHERE pv.id = p_variant_id;
  
  -- Calculate available variant units
  IF bulk_qty IS NULL OR variant_unit IS NULL OR variant_unit = 0 THEN
    RETURN 0;
  END IF;
  
  result := FLOOR(bulk_qty / variant_unit);
  RETURN GREATEST(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Create view for profit analysis
CREATE OR REPLACE VIEW profit_analysis AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  c.name as category_name,
  s.id as store_id,
  s.name as store_name,
  
  -- Purchase data
  COALESCE(SUM(pr.quantity), 0) as total_purchased,
  COALESCE(SUM(pr.total_cost), 0) as total_purchase_cost,
  CASE 
    WHEN SUM(pr.quantity) > 0 THEN SUM(pr.total_cost) / SUM(pr.quantity)
    ELSE 0 
  END as avg_purchase_cost_per_unit,
  
  -- Sales data
  COALESCE(SUM(oi.quantity * pv.base_unit_quantity), 0) as total_sold,
  COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
  COALESCE(SUM(sca.total_allocated_cost), 0) as total_cost_of_goods_sold,
  
  -- Current stock
  COALESCE(bi.available_quantity, 0) as current_stock,
  COALESCE(bi.weighted_avg_cost, 0) as current_avg_cost,
  COALESCE(bi.available_quantity * bi.weighted_avg_cost, 0) as current_stock_value,
  
  -- Losses
  COALESCE(SUM(ia.quantity_adjusted), 0) as total_losses,
  COALESCE(SUM(ia.cost_impact), 0) as total_loss_value,
  
  -- Profit calculations
  COALESCE(SUM(oi.price * oi.quantity), 0) - COALESCE(SUM(sca.total_allocated_cost), 0) as gross_profit,
  COALESCE(SUM(oi.price * oi.quantity), 0) - COALESCE(SUM(sca.total_allocated_cost), 0) - COALESCE(SUM(ia.cost_impact), 0) as net_profit,
  
  -- Profit margins
  CASE 
    WHEN SUM(oi.price * oi.quantity) > 0 THEN 
      ((SUM(oi.price * oi.quantity) - COALESCE(SUM(sca.total_allocated_cost), 0)) / SUM(oi.price * oi.quantity)) * 100
    ELSE 0 
  END as gross_profit_margin_percent,
  
  CASE 
    WHEN SUM(oi.price * oi.quantity) > 0 THEN 
      ((SUM(oi.price * oi.quantity) - COALESCE(SUM(sca.total_allocated_cost), 0) - COALESCE(SUM(ia.cost_impact), 0)) / SUM(oi.price * oi.quantity)) * 100
    ELSE 0 
  END as net_profit_margin_percent

FROM products p
CROSS JOIN stores s
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN bulk_inventory bi ON (bi.product_id = p.id AND bi.store_id = s.id)
LEFT JOIN purchase_records pr ON (pr.product_id = p.id AND pr.store_id = s.id)
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN order_items oi ON oi.variant_id = pv.id
LEFT JOIN orders o ON (oi.order_id = o.id AND o.store_id = s.id AND o.status = 'delivered')
LEFT JOIN sales_cost_allocation sca ON sca.order_item_id = oi.id
LEFT JOIN inventory_adjustments ia ON (ia.product_id = p.id AND ia.store_id = s.id)
GROUP BY p.id, p.name, c.name, s.id, s.name, bi.available_quantity, bi.weighted_avg_cost;

-- Update existing product variants with base unit quantities based on unit labels
UPDATE product_variants 
SET 
  base_unit_quantity = CASE 
    WHEN unit_label ILIKE '%250g%' OR unit_label ILIKE '%250 g%' THEN 0.25
    WHEN unit_label ILIKE '%500g%' OR unit_label ILIKE '%500 g%' THEN 0.5
    WHEN unit_label ILIKE '%1kg%' OR unit_label ILIKE '%1 kg%' THEN 1.0
    WHEN unit_label ILIKE '%2kg%' OR unit_label ILIKE '%2 kg%' THEN 2.0
    WHEN unit_label ILIKE '%5kg%' OR unit_label ILIKE '%5 kg%' THEN 5.0
    WHEN unit_label ILIKE '%100g%' OR unit_label ILIKE '%100 g%' THEN 0.1
    WHEN unit_label ILIKE '%50g%' OR unit_label ILIKE '%50 g%' THEN 0.05
    WHEN unit_label ILIKE '%set of 3%' OR unit_label ILIKE '%3 pieces%' THEN 3.0
    WHEN unit_label ILIKE '%set of 5%' OR unit_label ILIKE '%5 pieces%' THEN 5.0
    WHEN unit_label ILIKE '%500ml%' OR unit_label ILIKE '%500 ml%' THEN 0.5
    WHEN unit_label ILIKE '%1l%' OR unit_label ILIKE '%1 l%' OR unit_label ILIKE '%1 liter%' THEN 1.0
    ELSE 1.0
  END,
  base_unit_type = CASE 
    WHEN unit_label ILIKE '%g%' OR unit_label ILIKE '%kg%' THEN 'weight'
    WHEN unit_label ILIKE '%ml%' OR unit_label ILIKE '%l%' OR unit_label ILIKE '%liter%' THEN 'volume'
    WHEN unit_label ILIKE '%set%' OR unit_label ILIKE '%pieces%' OR unit_label ILIKE '%bundle%' THEN 'count'
    ELSE 'weight'
  END,
  base_unit_label = CASE 
    WHEN unit_label ILIKE '%g%' OR unit_label ILIKE '%kg%' THEN 'kg'
    WHEN unit_label ILIKE '%ml%' OR unit_label ILIKE '%l%' OR unit_label ILIKE '%liter%' THEN 'liters'
    WHEN unit_label ILIKE '%set%' OR unit_label ILIKE '%pieces%' OR unit_label ILIKE '%bundle%' THEN 'pieces'
    ELSE 'kg'
  END
WHERE base_unit_quantity = 1.0; -- Only update defaults

-- Migrate existing store_inventory to bulk_inventory
INSERT INTO bulk_inventory (store_id, product_id, total_quantity, unit_type, unit_label, weighted_avg_cost, last_purchase_date)
SELECT 
  si.store_id,
  pv.product_id,
  SUM(si.stock_quantity * pv.base_unit_quantity) as total_quantity,
  pv.base_unit_type,
  pv.base_unit_label,
  50.0 as estimated_cost, -- Default estimated cost
  now() as last_purchase_date
FROM store_inventory si
JOIN product_variants pv ON si.variant_id = pv.id
GROUP BY si.store_id, pv.product_id, pv.base_unit_type, pv.base_unit_label
ON CONFLICT (store_id, product_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_records_store_product ON purchase_records(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_date ON purchase_records(purchase_date);
CREATE INDEX IF NOT EXISTS idx_bulk_inventory_store_product ON bulk_inventory(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_store_product ON inventory_adjustments(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_cost_allocation_order_item ON sales_cost_allocation(order_item_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_records_updated_at ON purchase_records;
CREATE TRIGGER trg_purchase_records_updated_at
  BEFORE UPDATE ON purchase_records
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bulk_inventory_updated_at ON bulk_inventory;
CREATE TRIGGER trg_bulk_inventory_updated_at
  BEFORE UPDATE ON bulk_inventory
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();