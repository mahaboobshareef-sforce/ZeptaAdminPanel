/*
  # Fix apply_inventory_adjustment Function - Remove variant_id
  
  1. Changes
    - Drop existing function
    - Recreate without variant_id column reference
    - Match actual inventory_adjustments table schema
*/

-- Drop existing function
DROP FUNCTION IF EXISTS apply_inventory_adjustment(uuid, uuid, uuid, text, numeric, text, numeric, text) CASCADE;

-- Create function WITHOUT variant_id (it doesn't exist in the table)
CREATE OR REPLACE FUNCTION apply_inventory_adjustment(
    p_store_id UUID,
    p_product_id UUID,
    p_variant_id UUID,
    p_adjustment_type TEXT,
    p_quantity NUMERIC,
    p_unit_type TEXT,
    p_cost_impact NUMERIC,
    p_reason TEXT
)
RETURNS JSON AS $$
DECLARE
    v_adjustment_id UUID;
    v_bulk_record RECORD;
    v_unit_label TEXT;
    v_result JSON;
BEGIN
    -- Validate inputs
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Adjustment quantity must be greater than 0';
    END IF;
    
    IF p_adjustment_type NOT IN ('damage', 'expiry', 'theft', 'correction', 'return') THEN
        RAISE EXCEPTION 'Invalid adjustment type: %', p_adjustment_type;
    END IF;
    
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Reason is required for inventory adjustments';
    END IF;
    
    -- Determine unit label from unit type
    v_unit_label := CASE 
        WHEN p_unit_type = 'weight' THEN 'kg'
        WHEN p_unit_type = 'volume' THEN 'liters'
        WHEN p_unit_type = 'count' THEN 'pieces'
        ELSE 'units'
    END;
    
    -- Check if bulk inventory exists for this product at this store
    SELECT * INTO v_bulk_record
    FROM bulk_inventory
    WHERE store_id = p_store_id AND product_id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No bulk inventory found for this product at the selected store';
    END IF;
    
    -- Check if sufficient inventory is available
    IF COALESCE(v_bulk_record.available_quantity, 0) < p_quantity THEN
        RAISE EXCEPTION 'Insufficient inventory. Available: % %, Required: % %', 
                        COALESCE(v_bulk_record.available_quantity, 0), v_unit_label,
                        p_quantity, v_unit_label;
    END IF;
    
    -- Insert inventory adjustment record (WITHOUT variant_id column)
    -- The trigger will automatically update bulk_inventory
    INSERT INTO inventory_adjustments (
        store_id,
        product_id,
        adjustment_type,
        quantity_adjusted,
        unit_type,
        unit_label,
        cost_impact,
        reason,
        adjusted_by,
        adjustment_date
    ) VALUES (
        p_store_id,
        p_product_id,
        p_adjustment_type,
        p_quantity,
        p_unit_type,
        v_unit_label,
        p_cost_impact,
        p_reason,
        auth.uid(),
        NOW()
    )
    RETURNING id INTO v_adjustment_id;
    
    RAISE NOTICE 'Inventory adjustment % created. Quantity adjusted: % %', v_adjustment_id, p_quantity, v_unit_label;
    
    -- Return success result
    v_result := json_build_object(
        'success', true,
        'adjustment_id', v_adjustment_id,
        'quantity_adjusted', p_quantity,
        'unit_label', v_unit_label,
        'message', format('Successfully adjusted %s %s from inventory', p_quantity, v_unit_label)
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to apply inventory adjustment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION apply_inventory_adjustment TO authenticated;
