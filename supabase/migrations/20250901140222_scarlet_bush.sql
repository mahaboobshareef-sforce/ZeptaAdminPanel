/*
  # Bulk Inventory Direct Deduction Functions

  1. New Functions
    - `deduct_bulk_inventory` - Deducts quantity from bulk inventory
    - `get_variant_availability_bulk` - Calculates variant availability from bulk
    - `process_order_bulk_deduction` - Processes order with bulk deduction

  2. Enhanced Features
    - Direct bulk deduction when orders are delivered
    - Real-time variant availability calculation
    - FIFO cost allocation for bulk sales
    - Automatic inventory updates

  3. Business Logic
    - Orders deduct directly from bulk inventory
    - No manual variant packing required
    - Dynamic variant availability based on bulk stock
    - Maintains FIFO costing accuracy
*/

-- Function to deduct quantity from bulk inventory
CREATE OR REPLACE FUNCTION deduct_bulk_inventory(
  p_store_id UUID,
  p_product_id UUID,
  p_quantity NUMERIC
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if sufficient stock exists
  IF NOT EXISTS (
    SELECT 1 FROM bulk_inventory 
    WHERE store_id = p_store_id 
    AND product_id = p_product_id 
    AND available_quantity >= p_quantity
  ) THEN
    RAISE EXCEPTION 'Insufficient bulk inventory. Required: %, Available: %', 
      p_quantity, 
      COALESCE((SELECT available_quantity FROM bulk_inventory WHERE store_id = p_store_id AND product_id = p_product_id), 0);
  END IF;

  -- Deduct from available quantity and add to reserved
  UPDATE bulk_inventory 
  SET 
    reserved_quantity = reserved_quantity + p_quantity,
    available_quantity = available_quantity - p_quantity,
    updated_at = NOW()
  WHERE store_id = p_store_id 
  AND product_id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate variant availability from bulk stock
CREATE OR REPLACE FUNCTION get_variant_availability_bulk(
  p_store_id UUID,
  p_variant_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_bulk_available NUMERIC;
  v_base_unit_quantity NUMERIC;
  v_product_id UUID;
BEGIN
  -- Get variant details
  SELECT product_id, base_unit_quantity 
  INTO v_product_id, v_base_unit_quantity
  FROM product_variants 
  WHERE id = p_variant_id;

  IF v_product_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get bulk available quantity
  SELECT COALESCE(available_quantity, 0)
  INTO v_bulk_available
  FROM bulk_inventory 
  WHERE store_id = p_store_id 
  AND product_id = v_product_id;

  -- Calculate how many variants can be made
  IF v_bulk_available > 0 AND v_base_unit_quantity > 0 THEN
    RETURN FLOOR(v_bulk_available / v_base_unit_quantity);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to process order with bulk deduction and FIFO costing
CREATE OR REPLACE FUNCTION process_order_bulk_deduction(
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_order_item RECORD;
  v_variant RECORD;
  v_bulk_needed NUMERIC;
  v_purchase_record RECORD;
  v_remaining_to_allocate NUMERIC;
  v_allocation_quantity NUMERIC;
BEGIN
  -- Get order details
  FOR v_order_item IN 
    SELECT oi.*, o.store_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.order_id = p_order_id
  LOOP
    -- Get variant details
    SELECT * INTO v_variant
    FROM product_variants 
    WHERE id = v_order_item.variant_id;

    -- Calculate bulk quantity needed
    v_bulk_needed := v_order_item.quantity * COALESCE(v_variant.base_unit_quantity, 1.0);

    -- Deduct from bulk inventory
    PERFORM deduct_bulk_inventory(v_order_item.store_id, v_variant.product_id, v_bulk_needed);

    -- Allocate costs using FIFO from purchase records
    v_remaining_to_allocate := v_bulk_needed;

    FOR v_purchase_record IN
      SELECT *
      FROM purchase_records
      WHERE store_id = v_order_item.store_id
      AND product_id = v_variant.product_id
      AND remaining_quantity > 0
      ORDER BY purchase_date ASC -- FIFO
    LOOP
      EXIT WHEN v_remaining_to_allocate <= 0;

      -- Calculate allocation from this batch
      v_allocation_quantity := LEAST(v_remaining_to_allocate, v_purchase_record.remaining_quantity);

      -- Record cost allocation
      INSERT INTO sales_cost_allocation (
        order_item_id,
        purchase_record_id,
        quantity_allocated,
        cost_per_unit,
        total_allocated_cost
      ) VALUES (
        v_order_item.id,
        v_purchase_record.id,
        v_allocation_quantity,
        v_purchase_record.cost_per_unit,
        v_allocation_quantity * v_purchase_record.cost_per_unit
      );

      -- Update remaining quantity in purchase record
      UPDATE purchase_records
      SET remaining_quantity = remaining_quantity - v_allocation_quantity
      WHERE id = v_purchase_record.id;

      -- Reduce remaining to allocate
      v_remaining_to_allocate := v_remaining_to_allocate - v_allocation_quantity;
    END LOOP;

    -- If we couldn't allocate all costs, there's an issue
    IF v_remaining_to_allocate > 0 THEN
      RAISE EXCEPTION 'Could not allocate costs for order item %. Remaining: %', 
        v_order_item.id, v_remaining_to_allocate;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate batch numbers
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('batch_sequence')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for batch numbers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'batch_sequence') THEN
    CREATE SEQUENCE batch_sequence START 1;
  END IF;
END $$;

-- Update the order status trigger to handle bulk deduction
CREATE OR REPLACE FUNCTION handle_order_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to delivered, process bulk deduction
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    PERFORM process_order_bulk_deduction(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order delivery
DROP TRIGGER IF EXISTS trg_order_delivery_bulk_deduction ON orders;
CREATE TRIGGER trg_order_delivery_bulk_deduction
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_delivery();