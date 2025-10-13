/*
  # Verify Inventory Changes and Revenue

  Run this to see:
  - Current stock levels
  - Low stock items
  - Revenue by store
  - Revenue by date
  - Top selling products
  - Payment status breakdown
*/

-- 1. Current Stock Levels by Store
SELECT
  '=== STOCK LEVELS BY STORE ===' as section;

SELECT
  s.name as store_name,
  COUNT(si.id) as total_products,
  SUM(si.stock_quantity) as total_items,
  COUNT(CASE WHEN si.stock_quantity < si.low_stock_threshold THEN 1 END) as low_stock_items,
  COUNT(CASE WHEN si.stock_quantity = 0 THEN 1 END) as out_of_stock_items
FROM stores s
LEFT JOIN store_inventory si ON s.id = si.store_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 2. Low Stock Alert (Items below threshold)
SELECT
  '' as blank_line,
  '=== LOW STOCK ALERT ===' as section;

SELECT
  s.name as store,
  p.name as product,
  pv.unit_label,
  si.stock_quantity as current_stock,
  si.low_stock_threshold as threshold,
  (si.low_stock_threshold - si.stock_quantity) as restock_needed
FROM store_inventory si
JOIN stores s ON si.store_id = s.id
JOIN product_variants pv ON si.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE si.stock_quantity < si.low_stock_threshold
ORDER BY si.stock_quantity ASC
LIMIT 15;

-- 3. Total Revenue Summary
SELECT
  '' as blank_line,
  '=== REVENUE SUMMARY ===' as section;

SELECT
  COUNT(*) as total_orders,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_orders,
  ROUND(SUM(CASE WHEN payment_status = 'paid' THEN order_total ELSE 0 END)::NUMERIC, 2) as total_revenue,
  ROUND(SUM(CASE WHEN payment_status = 'paid' THEN discount_amount ELSE 0 END)::NUMERIC, 2) as total_discounts,
  ROUND(SUM(CASE WHEN payment_status = 'paid' THEN delivery_charges ELSE 0 END)::NUMERIC, 2) as total_delivery_charges,
  ROUND(AVG(CASE WHEN payment_status = 'paid' THEN order_total END)::NUMERIC, 2) as avg_order_value
FROM orders;

-- 4. Revenue by Store
SELECT
  '' as blank_line,
  '=== REVENUE BY STORE ===' as section;

SELECT
  s.name as store_name,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) as paid_orders,
  ROUND(SUM(CASE WHEN o.payment_status = 'paid' THEN o.order_total ELSE 0 END)::NUMERIC, 2) as revenue,
  ROUND(AVG(CASE WHEN o.payment_status = 'paid' THEN o.order_total END)::NUMERIC, 2) as avg_order_value
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id
GROUP BY s.id, s.name
ORDER BY revenue DESC;

-- 5. Revenue by Date (Last 30 Days)
SELECT
  '' as blank_line,
  '=== DAILY REVENUE (Last 30 Days) ===' as section;

SELECT
  o.created_at::date as order_date,
  COUNT(*) as orders_count,
  ROUND(SUM(CASE WHEN payment_status = 'paid' THEN order_total ELSE 0 END)::NUMERIC, 2) as daily_revenue,
  ROUND(AVG(CASE WHEN payment_status = 'paid' THEN order_total END)::NUMERIC, 2) as avg_order
FROM orders o
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY o.created_at::date
ORDER BY o.created_at::date DESC
LIMIT 30;

-- 6. Top Selling Products
SELECT
  '' as blank_line,
  '=== TOP SELLING PRODUCTS ===' as section;

SELECT
  p.name as product,
  pv.unit_label,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  SUM(oi.quantity) as total_quantity_sold,
  ROUND(SUM(oi.quantity * oi.price)::NUMERIC, 2) as total_revenue
FROM order_items oi
JOIN product_variants pv ON oi.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY p.id, p.name, pv.unit_label
ORDER BY total_revenue DESC
LIMIT 15;

-- 7. Payment Method Breakdown
SELECT
  '' as blank_line,
  '=== PAYMENT METHOD BREAKDOWN ===' as section;

SELECT
  payment_method,
  COUNT(*) as order_count,
  ROUND(SUM(order_total)::NUMERIC, 2) as total_amount,
  ROUND(AVG(order_total)::NUMERIC, 2) as avg_order_value,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders))::NUMERIC, 2) as percentage
FROM orders
GROUP BY payment_method;

-- 8. Order Status Distribution
SELECT
  '' as blank_line,
  '=== ORDER STATUS DISTRIBUTION ===' as section;

SELECT
  status,
  COUNT(*) as count,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders))::NUMERIC, 2) as percentage,
  ROUND(SUM(order_total)::NUMERIC, 2) as total_value
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 9. Recent Orders with Details
SELECT
  '' as blank_line,
  '=== RECENT ORDERS (Last 10) ===' as section;

SELECT
  o.id as order_id,
  u.full_name as customer,
  s.name as store,
  o.status,
  o.payment_method,
  o.payment_status,
  o.order_total,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
  o.created_at::timestamp(0)
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN stores s ON o.store_id = s.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 10. Customer Order Frequency
SELECT
  '' as blank_line,
  '=== TOP CUSTOMERS ===' as section;

SELECT
  u.full_name as customer_name,
  u.mobile_number,
  COUNT(o.id) as total_orders,
  ROUND(SUM(CASE WHEN o.payment_status = 'paid' THEN o.order_total ELSE 0 END)::NUMERIC, 2) as total_spent,
  ROUND(AVG(CASE WHEN o.payment_status = 'paid' THEN o.order_total END)::NUMERIC, 2) as avg_order_value,
  MAX(o.created_at)::date as last_order_date
FROM users u
JOIN orders o ON u.id = o.customer_id
WHERE u.role = 'customer'
GROUP BY u.id, u.full_name, u.mobile_number
ORDER BY total_spent DESC
LIMIT 10;
