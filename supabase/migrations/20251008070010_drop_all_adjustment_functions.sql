/*
  # Drop All Inventory Adjustment Functions
  
  Drops all existing versions to prepare for clean recreation
*/

-- Drop all 3 versions
DROP FUNCTION IF EXISTS apply_inventory_adjustment(uuid, uuid, uuid, text, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS apply_inventory_adjustment(uuid, uuid, text, numeric, numeric, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS apply_inventory_adjustment(uuid, uuid, uuid, text, numeric, text, numeric, text) CASCADE;
