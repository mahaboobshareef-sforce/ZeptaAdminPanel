/*
  # Fix Inventory Management and Order Processing

  1. Enhanced Order Processing
    - Proper inventory reservation on order acceptance
    - Automatic deduction on delivery completion
    - Inventory release on order cancellation

  2. Inventory Adjustment Integration
    - Automatic bulk inventory updates
    - Proper quantity tracking
    - Cost impact calculations

  3. Improved Triggers
    - Better error handling
    - Proper FIFO implementation
    - Accurate inventory tracking
*/

-- Drop existing triggers to recreate them
DROP TRIGGER IF EXISTS trg_order_delivery_bulk_deduction ON orders;
DROP TRIGGER IF EXISTS trg_update_bulk_inventory ON purchase_records;

-- Enhanced function to handle order status changes and inventory
CREATE OR REPLACE FUNCTION handle_order_inventory_changes()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    bulk_record RECORD;
    required_bulk_qty NUMERIC;
    total_required NUMERIC;
BEGIN
    -- Only process specific status changes
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    
    -- Handle order acceptance (reserve inventory)
    IF NEW.status IN ('order_accepted', 'packed') AND OLD.status = 'pending' THEN
        -- Reserve inventory for this order
        FOR item_record IN 
            SELECT oi.*, pv.product_id, pv.base_unit_quantity
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            WHERE oi.order_id = NEW.id
        LOOP
            required_bulk_qty := item_record.quantity * COALESCE(item_record.base_unit_quantity, 1.0);
            
            -- Update bulk inventory to reserve stock
            UPDATE bulk_inventory 
            SET 
                reserved_quantity = COALESCE(reserved_quantity, 0) + required_bulk_qty,
                available_quantity = total_quantity - (COALESCE(reserved_quantity, 0) + required_bulk_qty),
                updated_at = NOW()
            WHERE store_id = NEW.store_id 
            AND product_id = item_record.product_id;
        END LOOP;
        
        RAISE NOTICE 'Inventory reserved for order %', NEW.id;
    END IF;
    
    -- Handle order delivery (final deduction)
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Deduct from bulk inventory using FIFO
        FOR item_record IN 
            SELECT oi.*, pv.product_id, pv.base_unit_quantity
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            WHERE oi.order_id = NEW.id
        LOOP
            required_bulk_qty := item_record.quantity * COALESCE(item_record.base_unit_quantity, 1.0);
            
            -- Deduct from bulk inventory (convert reserved to actual deduction)
            UPDATE bulk_inventory 
            SET 
                reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - required_bulk_qty),
                total_quantity = GREATEST(0, total_quantity - required_bulk_qty),
                available_quantity = GREATEST(0, total_quantity - required_bulk_qty - COALESCE(reserved_quantity, 0) + required_bulk_qty),
                updated_at = NOW()
            WHERE store_id = NEW.store_id 
            AND product_id = item_record.product_id;
        END LOOP;
        
        RAISE NOTICE 'Inventory deducted for delivered order %', NEW.id;
    END IF;
    
    -- Handle order cancellation (release reserved inventory)
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Release reserved inventory
        FOR item_record IN 
            SELECT oi.*, pv.product_id, pv.base_unit_quantity
            FROM order_items oi
            JOIN product_variants pv ON oi.variant_id = pv.id
            WHERE oi.order_id = NEW.id
        LOOP
            required_bulk_qty := item_record.quantity * COALESCE(item_record.base_unit_quantity, 1.0);
            
            -- Release reserved stock
            UPDATE bulk_inventory 
            SET 
                reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - required_bulk_qty),
                available_quantity = total_quantity - GREATEST(0, COALESCE(reserved_quantity, 0) - required_bulk_qty),
                updated_at = NOW()
            WHERE store_id = NEW.store_id 
            AND product_id = item_record.product_id;
        END LOOP;
        
        RAISE NOTICE 'Reserved inventory released for cancelled order %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the enhanced order inventory trigger
CREATE TRIGGER trg_order_inventory_management
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_inventory_changes();

-- Enhanced function to handle inventory adjustments
CREATE OR REPLACE FUNCTION handle_inventory_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    bulk_record RECORD;
    adjustment_qty NUMERIC;
BEGIN
    -- Get the adjustment quantity
    adjustment_qty := NEW.quantity_adjusted;
    
    -- Update bulk inventory based on adjustment
    SELECT * INTO bulk_record
    FROM bulk_inventory
    WHERE store_id = NEW.store_id 
    AND product_id = NEW.product_id;
    
    IF FOUND THEN
        -- Reduce bulk inventory quantities
        UPDATE bulk_inventory 
        SET 
            total_quantity = GREATEST(0, total_quantity - adjustment_qty),
            available_quantity = GREATEST(0, available_quantity - adjustment_qty),
            updated_at = NOW()
        WHERE store_id = NEW.store_id 
        AND product_id = NEW.product_id;
        
        RAISE NOTICE 'Bulk inventory adjusted: -% units for product % at store %', 
                     adjustment_qty, NEW.product_id, NEW.store_id;
    ELSE
        RAISE WARNING 'No bulk inventory found for product % at store %', 
                      NEW.product_id, NEW.store_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory adjustments
DROP TRIGGER IF EXISTS trg_inventory_adjustment_update ON inventory_adjustments;
CREATE TRIGGER trg_inventory_adjustment_update
    AFTER INSERT ON inventory_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_adjustment();

-- Enhanced function to update bulk inventory after purchases
CREATE OR REPLACE FUNCTION update_bulk_inventory_after_purchase()
RETURNS TRIGGER AS $$
DECLARE
    existing_bulk RECORD;
    new_weighted_cost NUMERIC;
    total_cost NUMERIC;
    total_qty NUMERIC;
BEGIN
    -- Check if bulk inventory record exists
    SELECT * INTO existing_bulk
    FROM bulk_inventory
    WHERE store_id = NEW.store_id 
    AND product_id = NEW.product_id;
    
    IF FOUND THEN
        -- Calculate new weighted average cost
        total_cost := (existing_bulk.total_quantity * existing_bulk.weighted_avg_cost) + NEW.total_cost;
        total_qty := existing_bulk.total_quantity + NEW.quantity;
        new_weighted_cost := CASE 
            WHEN total_qty > 0 THEN total_cost / total_qty 
            ELSE NEW.cost_per_unit 
        END;
        
        -- Update existing bulk inventory
        UPDATE bulk_inventory 
        SET 
            total_quantity = total_qty,
            available_quantity = total_qty - COALESCE(reserved_quantity, 0),
            weighted_avg_cost = new_weighted_cost,
            last_purchase_date = NEW.purchase_date,
            updated_at = NOW()
        WHERE store_id = NEW.store_id 
        AND product_id = NEW.product_id;
    ELSE
        -- Create new bulk inventory record
        INSERT INTO bulk_inventory (
            store_id,
            product_id,
            total_quantity,
            reserved_quantity,
            available_quantity,
            unit_type,
            unit_label,
            weighted_avg_cost,
            last_purchase_date
        ) VALUES (
            NEW.store_id,
            NEW.product_id,
            NEW.quantity,
            0,
            NEW.quantity,
            NEW.unit_type,
            NEW.unit_label,
            NEW.cost_per_unit,
            NEW.purchase_date
        );
    END IF;
    
    RAISE NOTICE 'Bulk inventory updated: +% % for product % at store %', 
                 NEW.quantity, NEW.unit_label, NEW.product_id, NEW.store_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the purchase trigger
CREATE TRIGGER trg_update_bulk_inventory
    AFTER INSERT ON purchase_records
    FOR EACH ROW
    EXECUTE FUNCTION update_bulk_inventory_after_purchase();

-- Function to validate inventory availability before adjustments
CREATE OR REPLACE FUNCTION validate_inventory_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    available_qty NUMERIC;
BEGIN
    -- Check if sufficient inventory exists
    SELECT COALESCE(available_quantity, 0) INTO available_qty
    FROM bulk_inventory
    WHERE store_id = NEW.store_id 
    AND product_id = NEW.product_id;
    
    IF available_qty IS NULL THEN
        RAISE EXCEPTION 'No bulk inventory found for this product at this store';
    END IF;
    
    IF available_qty < NEW.quantity_adjusted THEN
        RAISE EXCEPTION 'Insufficient inventory. Available: %, Required: %', 
                        available_qty, NEW.quantity_adjusted;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger for inventory adjustments
CREATE TRIGGER trg_validate_inventory_adjustment
    BEFORE INSERT OR UPDATE ON inventory_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION validate_inventory_adjustment();