import { supabase } from './supabase';

// Helper to sanitize bulk inventory payloads (remove derived fields)
export function sanitizeBulkPayload(row: any) {
  const {
    available_quantity,   // derived - REMOVE
    product_name,         // from view - REMOVE
    description,          // from view - REMOVE
    ...safe
  } = row ?? {};
  return safe;
}

// Safe bulk inventory operations
export async function upsertBulkInventory(row: any) {
  return supabase.from('bulk_inventory').upsert(sanitizeBulkPayload(row), {
    onConflict: 'store_id,product_id'
  });
}

export async function updateBulkInventory(id: string, updates: any) {
  return supabase.from('bulk_inventory')
    .update(sanitizeBulkPayload(updates))
    .eq('id', id);
}

export async function insertBulkInventory(row: any) {
  return supabase.from('bulk_inventory')
    .insert(sanitizeBulkPayload(row));
}