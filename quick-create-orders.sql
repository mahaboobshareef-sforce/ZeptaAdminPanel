/*
  # Quick Order Creation Script (Run Multiple Times)

  Creates 10 orders with inventory reduction each time you run it.
  Safe to run multiple times - automatically checks stock availability.
*/

DO $$
DECLARE
  v_order_id UUID;
  v_customer_id UUID;
  v_store_id UUID;
  v_address_id UUID;
  v_agent_id UUID;
  v_variant_id UUID;
  v_price NUMERIC;
  v_qty INTEGER;
  v_stock INTEGER;
  v_total NUMERIC;
  v_order_status order_status;
  v_payment_method payment_method;
  v_created_at TIMESTAMP;

  orders_created INTEGER := 0;
  i INTEGER;
BEGIN
  RAISE NOTICE 'Creating 10 new orders...';

  FOR i IN 1..10 LOOP
    -- Get random customer
    SELECT u.id, ca.id
    INTO v_customer_id, v_address_id
    FROM users u
    JOIN customer_addresses ca ON u.id = ca.customer_id AND ca.is_default = true
    WHERE u.role = 'customer'
    ORDER BY RANDOM()
    LIMIT 1;

    -- Get random store
    SELECT id INTO v_store_id FROM stores ORDER BY RANDOM() LIMIT 1;

    -- Get random agent
    SELECT id INTO v_agent_id FROM users WHERE role = 'delivery_agent' ORDER BY RANDOM() LIMIT 1;

    -- Get random variant with available stock
    SELECT si.variant_id, pv.price, si.stock_quantity
    INTO v_variant_id, v_price, v_stock
    FROM store_inventory si
    JOIN product_variants pv ON si.variant_id = pv.id
    WHERE si.store_id = v_store_id AND si.stock_quantity >= 5
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_variant_id IS NULL THEN
      RAISE NOTICE 'No stock available for order %, skipping...', i;
      CONTINUE;
    END IF;

    -- Order quantity (1-4 items)
    v_qty := (RANDOM() * 3 + 1)::INTEGER;
    v_qty := LEAST(v_qty, v_stock - 2); -- Keep at least 2 in stock

    v_total := (v_price * v_qty) + 40; -- +40 delivery charges

    -- Random status and payment
    IF RANDOM() < 0.7 THEN
      v_order_status := 'delivered';
    ELSIF RANDOM() < 0.5 THEN
      v_order_status := 'out_for_delivery';
    ELSE
      v_order_status := 'pending';
    END IF;

    v_payment_method := CASE WHEN RANDOM() < 0.6 THEN 'Online' ELSE 'COD' END;
    v_created_at := NOW() - INTERVAL '1 hour' * (RANDOM() * 720)::INTEGER; -- Last 30 days

    -- Create order
    v_order_id := gen_random_uuid();

    INSERT INTO orders (
      id, customer_id, store_id, delivery_agent_id, delivery_address_id,
      status, payment_method, payment_status, discount_amount, delivery_charges,
      order_total, created_at, status_updated_at, updated_at
    ) VALUES (
      v_order_id, v_customer_id, v_store_id,
      CASE WHEN v_order_status IN ('out_for_delivery', 'delivered') THEN v_agent_id ELSE NULL END,
      v_address_id, v_order_status, v_payment_method,
      CASE WHEN v_order_status = 'delivered' OR v_payment_method = 'Online' THEN 'paid' ELSE 'pending' END,
      0, 40, v_total, v_created_at, v_created_at, NOW()
    );

    -- Create order items
    INSERT INTO order_items (order_id, variant_id, quantity, price)
    VALUES (v_order_id, v_variant_id, v_qty, v_price);

    -- REDUCE INVENTORY
    UPDATE store_inventory
    SET stock_quantity = stock_quantity - v_qty, updated_at = NOW()
    WHERE store_id = v_store_id AND variant_id = v_variant_id;

    -- Create payment
    INSERT INTO payments (order_id, provider, transaction_id, amount, status, created_at, updated_at)
    VALUES (
      v_order_id,
      CASE WHEN v_payment_method = 'Online' THEN 'razorpay' ELSE 'cash' END,
      CASE WHEN v_payment_method = 'Online' THEN 'txn_' || substr(md5(random()::text), 1, 12) ELSE NULL END,
      v_total,
      CASE WHEN v_order_status = 'delivered' OR v_payment_method = 'Online' THEN 'paid' ELSE 'pending' END,
      v_created_at, NOW()
    );

    orders_created := orders_created + 1;
  END LOOP;

  RAISE NOTICE 'Successfully created % orders!', orders_created;
  RAISE NOTICE 'Total orders now: %', (SELECT COUNT(*) FROM orders);
  RAISE NOTICE 'Total revenue: ₹%', (SELECT ROUND(SUM(order_total), 2) FROM orders WHERE payment_status = 'paid');
END $$;
