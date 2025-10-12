import { supabase } from './supabase';

export type StockInfo = { 
  available: number; 
  source: 'bulk' | 'store';
  unitLabel?: string;
  avgCost?: number;
};

/** Returns available qty for this item at a store.
 * Bulk (weight): uses bulk_inventory by product_id
 * Packaged (unit): uses store_inventory by variant_id
 */
export async function getStockInfo(
  storeId: string, 
  productId?: string, 
  variantId?: string
): Promise<StockInfo> {
  try {
    // For inventory adjustments, we primarily work with bulk inventory
    if (productId) {
      const { data, error } = await supabase
        .from('bulk_inventory')
        .select('total_quantity, reserved_quantity, unit_label, weighted_avg_cost')
        .eq('store_id', storeId)
        .eq('product_id', productId)
        .maybeSingle();
      
      if (error) throw error;
      
      const totalQty = Number(data?.total_quantity || 0);
      const reservedQty = Number(data?.reserved_quantity || 0);
      const available = Math.max(0, totalQty - reservedQty);
      
      return { 
        available, 
        source: 'bulk',
        unitLabel: data?.unit_label || 'kg',
        avgCost: Number(data?.weighted_avg_cost || 0)
      };
    }
    
    // Fallback for variant-based lookup
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('product_id, base_unit_type')
        .eq('id', variantId)
        .single();
      
      if (variant) {
        return getStockInfo(storeId, variant.product_id);
      }
    }
    
    return { available: 0, source: 'bulk' };
    
  } catch (error) {
    console.error('Stock info error:', error);
    return { available: 0, source: 'bulk' };
  }
}