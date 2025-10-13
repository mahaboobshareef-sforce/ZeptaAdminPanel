/*
  # Create Orders with Inventory Reduction Script

  This script creates realistic orders that:
  - Reduce stock_quantity in store_inventory
  - Create proper order_items with variants
  - Create payment records
  - Generate revenue data for analytics
  - Create order activity logs

  Run this in Supabase SQL Editor
*/

DO $$
DECLARE
  -- Variables for order creation
  v_order_id UUID;
  v_customer_id UUID;
  v_store_id UUID;
  v_address_id UUID;
  v_agent_id UUID;
  v_variant1_id UUID;
  v_variant2_id UUID;
  v_variant3_id UUID;
  v_price1 NUMERIC;
  v_price2 NUMERIC;
  v_price3 NUMERIC;
  v_qty1 INTEGER;
  v_qty2 INTEGER;
  v_qty3 INTEGER;
  v_subtotal NUMERIC;
  v_total NUMERIC;
  v_discount NUMERIC;
  v_delivery_charges NUMERIC := 40;
  v_order_status order_status;
  v_payment_method payment_method;
  v_payment_status payment_status;

  -- Arrays of data
  customer_records RECORD;
  store_records RECORD;
  variant_records RECORD;
  agent_records RECORD;

  i INTEGER;
  order_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Starting Order Creation with Inventory Reduction ===';

  -- Create 20 orders with different combinations
  FOR i IN 1..20 LOOP
    BEGIN
      -- Select random customer
      SELECT u.id, ca.id as address_id
      INTO v_customer_id, v_address_id
      FROM users u
      JOIN customer_addresses ca ON u.id = ca.customer_id AND ca.is_default = true
      WHERE u.role = 'customer'
      ORDER BY RANDOM()
      LIMIT 1;

      -- Select random store
      SELECT id INTO v_store_id
      FROM stores
      ORDER BY RANDOM()
      LIMIT 1;

      -- Select random agent
      SELECT id INTO v_agent_id
      FROM users
      WHERE role = 'delivery_agent'
      ORDER BY RANDOM()
      LIMIT 1;

      -- Select 3 random variants that have stock
      SELECT si.variant_id, pv.price, si.stock_quantity
      INTO v_variant1_id, v_price1, v_qty1
      FROM store_inventory si
      JOIN product_variants pv ON si.variant_id = pv.id
      WHERE si.store_id = v_store_id
      AND si.stock_quantity >= 5
      ORDER BY RANDOM()
      LIMIT 1;

      SELECT si.variant_id, pv.price, si.stock_quantity
      INTO v_variant2_id, v_price2, v_qty2
      FROM store_inventory si
      JOIN product_variants pv ON si.variant_id = pv.id
      WHERE si.store_id = v_store_id
      AND si.stock_quantity >= 3
      AND si.variant_id != v_variant1_id
      ORDER BY RANDOM()
      LIMIT 1;

      SELECT si.variant_id, pv.price, si.stock_quantity
      INTO v_variant3_id, v_price3, v_qty3
      FROM store_inventory si
      JOIN product_variants pv ON si.variant_id = pv.id
      WHERE si.store_id = v_store_id
      AND si.stock_quantity >= 2
      AND si.variant_id NOT IN (v_variant1_id, v_variant2_id)
      ORDER BY RANDOM()
      LIMIT 1;

      -- Skip if we couldn't find enough variants
      IF v_variant1_id IS NULL OR v_variant2_id IS NULL THEN
        CONTINUE;
      END IF;

      -- Determine quantities to order (less than available)
      v_qty1 := LEAST((RANDOM() * 3 + 1)::INTEGER, v_qty1 - 1);
      v_qty2 := LEAST((RANDOM() * 2 + 1)::INTEGER, v_qty2 - 1);
      v_qty3 := CASE
        WHEN v_variant3_id IS NOT NULL
        THEN LEAST((RANDOM() * 2 + 1)::INTEGER, v_qty3 - 1)
        ELSE 0
      END;

      -- Calculate totals
      v_subtotal := (v_price1 * v_qty1) + (v_price2 * v_qty2);
      IF v_variant3_id IS NOT NULL THEN
        v_subtotal := v_subtotal + (v_price3 * v_qty3);
      END IF;

      -- Random discount (10% of orders get discount)
      IF RANDOM() < 0.1 THEN
        v_discount := ROUND((v_subtotal * 0.1)::NUMERIC, 2);
      ELSE
        v_discount := 0;
      END IF;

      v_total := v_subtotal - v_discount + v_delivery_charges;

      -- Determine order status (70% delivered, 15% in progress, 15% pending)
      CASE
        WHEN RANDOM() < 0.7 THEN
          v_order_status := 'delivered'::order_status;
          v_payment_status := 'paid'::payment_status;
        WHEN RANDOM() < 0.85 THEN
          v_order_status := (ARRAY['out_for_delivery', 'packed', 'order_accepted']::order_status[])[FLOOR(RANDOM() * 3 + 1)];
          v_payment_status := 'paid'::payment_status;
        ELSE
          v_order_status := 'pending'::order_status;
          v_payment_status := 'pending'::payment_status;
      END CASE;

      -- Payment method (60% Online, 40% COD)
      IF RANDOM() < 0.6 THEN
        v_payment_method := 'Online'::payment_method;
        v_payment_status := 'paid'::payment_status;
      ELSE
        v_payment_method := 'COD'::payment_method;
        IF v_order_status = 'delivered' THEN
          v_payment_status := 'paid'::payment_status;
        END IF;
      END IF;

      -- Create order
      v_order_id := gen_random_uuid();

      INSERT INTO orders (
        id, customer_id, store_id, delivery_agent_id, delivery_address_id,
        status, payment_method, payment_status,
        discount_amount, delivery_charges, order_total,
        created_at, status_updated_at, updated_at
      ) VALUES (
        v_order_id,
        v_customer_id,
        v_store_id,
        CASE WHEN v_order_status IN ('out_for_delivery', 'delivered', 'assigned_delivery_partner')
          THEN v_agent_id ELSE NULL END,
        v_address_id,
        v_order_status,
        v_payment_method,
        v_payment_status,
        v_discount,
        v_delivery_charges,
        v_total,
        NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER,
        NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER,
        NOW()
      );

      -- Create order items
      INSERT INTO order_items (order_id, variant_id, quantity, price)
      VALUES
        (v_order_id, v_variant1_id, v_qty1, v_price1),
        (v_order_id, v_variant2_id, v_qty2, v_price2);

      IF v_variant3_id IS NOT NULL AND v_qty3 > 0 THEN
        INSERT INTO order_items (order_id, variant_id, quantity, price)
        VALUES (v_order_id, v_variant3_id, v_qty3, v_price3);
      END IF;

      -- REDUCE INVENTORY
      UPDATE store_inventory
      SET stock_quantity = stock_quantity - v_qty1,
          updated_at = NOW()
      WHERE store_id = v_store_id
      AND variant_id = v_variant1_id;

      UPDATE store_inventory
      SET stock_quantity = stock_quantity - v_qty2,
          updated_at = NOW()
      WHERE store_id = v_store_id
      AND variant_id = v_variant2_id;

      IF v_variant3_id IS NOT NULL AND v_qty3 > 0 THEN
        UPDATE store_inventory
        SET stock_quantity = stock_quantity - v_qty3,
            updated_at = NOW()
        WHERE store_id = v_store_id
        AND variant_id = v_variant3_id;
      END IF;

      -- Create payment record
      INSERT INTO payments (
        order_id,
        provider,
        transaction_id,
        amount,
        status,
        created_at,
        updated_at
      ) VALUES (
        v_order_id,
        CASE WHEN v_payment_method = 'Online' THEN 'razorpay' ELSE 'cash' END,
        CASE WHEN v_payment_method = 'Online'
          THEN 'txn_' || substr(md5(random()::text), 1, 16)
          ELSE NULL END,
        v_total,
        v_payment_status,
        NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER,
        NOW()
      );

      -- Create order activity log
      INSERT INTO order_activity_log (
        order_id, status, changed_by, note, changed_at
      ) VALUES (
        v_order_id,
        v_order_status,
        v_customer_id,
        'Order placed via customer app',
        NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER
      );

      order_count := order_count + 1;

      IF order_count % 5 = 0 THEN
        RAISE NOTICE 'Created % orders...', order_count;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating order %: %', i, SQLERRM;
      CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE '=== Order Creation Complete ===';
  RAISE NOTICE 'Total orders created: %', order_count;
  RAISE NOTICE '';
  RAISE NOTICE '=== Summary Statistics ===';

  -- Show summary
  RAISE NOTICE 'Total orders in system: %', (SELECT COUNT(*) FROM orders);
  RAISE NOTICE 'Total revenue: ₹%', (
    SELECT ROUND(SUM(order_total)::NUMERIC, 2)
    FROM orders
    WHERE payment_status = 'paid'
  );
  RAISE NOTICE 'Paid orders: %', (
    SELECT COUNT(*)
    FROM orders
    WHERE payment_status = 'paid'
  );
  RAISE NOTICE 'Pending payments: %', (
    SELECT COUNT(*)
    FROM orders
    WHERE payment_status = 'pending'
  );

END $$;

-- Show inventory changes
SELECT
  s.name as store_name,
  p.name as product_name,
  pv.unit_label,
  si.stock_quantity as current_stock,
  CASE
    WHEN si.stock_quantity < si.low_stock_threshold THEN 'LOW STOCK'
    ELSE 'OK'
  END as stock_status
FROM store_inventory si
JOIN stores s ON si.store_id = s.id
JOIN product_variants pv ON si.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
WHERE si.stock_quantity < 150
ORDER BY si.stock_quantity ASC
LIMIT 20;

-- Show recent orders with revenue
SELECT
  o.id as order_id,
  u.full_name as customer,
  s.name as store,
  o.status,
  o.payment_method,
  o.payment_status,
  o.order_total as revenue,
  o.created_at::date as order_date,
  COUNT(oi.id) as items_count
FROM orders o
JOIN users u ON o.customer_id = u.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.full_name, s.name, o.status, o.payment_method, o.payment_status, o.order_total, o.created_at
ORDER BY o.created_at DESC
LIMIT 15;

-- Show total revenue by store
SELECT
  s.name as store_name,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  ROUND(SUM(CASE WHEN o.payment_status = 'paid' THEN o.order_total ELSE 0 END)::NUMERIC, 2) as total_revenue
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id
GROUP BY s.id, s.name
ORDER BY total_revenue DESC;
