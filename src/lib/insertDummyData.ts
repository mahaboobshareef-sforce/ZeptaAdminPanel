import { supabaseAdmin } from './supabase';

const clearExistingData = async () => {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Delete in correct order to respect foreign key constraints
    const tablesToClear = [
      'order_activity_log',
      'agent_ratings',
      'order_ratings',
      'refunds',
      'payments',
      'order_items',
      'orders',
      'notifications',
      'agent_locations',
      'customer_addresses',
      'store_inventory',
      'product_variants',
      'products',
      'promotional_banners',
      'coupons',
      'categories',
      'stores',
      'users'
    ];

    for (const table of tablesToClear) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error && !error.message.includes('No rows found')) {
        console.warn(`Warning: Could not clear ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }
    
    console.log('✅ Data cleanup completed');
  } catch (error: any) {
    console.warn('⚠️ Some cleanup operations failed:', error.message);
  }
};

export const insertDummyData = async () => {
  try {
    console.log('🔄 Starting dummy data insertion...');
    
    // Clear existing data first
    await clearExistingData();

    // 1. Insert Stores (3 stores in Guntur and Vijayawada)
    console.log('📍 Inserting stores...');
    const storesResult = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name: 'Zepta Guntur Main',
          address: 'Arundelpet, Guntur, Andhra Pradesh 522002',
          latitude: 16.3067,
          longitude: 80.4365,
          radius_km: 8.00,
          contact_number: '+91 9876543210',
          status: 'active'
        },
        {
          name: 'Zepta Vijayawada Central',
          address: 'Governorpet, Vijayawada, Andhra Pradesh 520002',
          latitude: 16.5062,
          longitude: 80.6480,
          radius_km: 10.00,
          contact_number: '+91 9876543211',
          status: 'active'
        },
        {
          name: 'Zepta Guntur East',
          address: 'Brodipet, Guntur, Andhra Pradesh 522004',
          latitude: 16.3176,
          longitude: 80.4512,
          radius_km: 6.00,
          contact_number: '+91 9876543212',
          status: 'active'
        }
      ])
      .select();

    if (storesResult.error) throw storesResult.error;
    const stores = storesResult.data;
    console.log('✅ Stores inserted:', stores.length);

    // 2. Insert Categories
    console.log('🏷️ Inserting categories...');
    const categoriesResult = await supabaseAdmin
      .from('categories')
      .insert([
        { name: 'Fresh Vegetables', type: 'vegetable' },
        { name: 'Leafy Greens', type: 'vegetable' },
        { name: 'Root Vegetables', type: 'vegetable' },
        { name: 'Dairy Products', type: 'grocery' },
        { name: 'Rice & Grains', type: 'grocery' },
        { name: 'Pulses & Lentils', type: 'grocery' },
        { name: 'Spices & Masalas', type: 'grocery' },
        { name: 'Oil & Ghee', type: 'grocery' },
        { name: 'Snacks & Sweets', type: 'grocery' },
        { name: 'Fruits', type: 'vegetable' }
      ])
      .select();

    if (categoriesResult.error) throw categoriesResult.error;
    const categories = categoriesResult.data;
    console.log('✅ Categories inserted:', categories.length);

    // 3. Insert Products with Variants
    console.log('🥬 Inserting products...');
    const productsData = [
      // Vegetables
      { name: 'Tomatoes', description: 'Fresh red tomatoes', category: 'Fresh Vegetables', image_url: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg' },
      { name: 'Onions', description: 'Quality red onions', category: 'Fresh Vegetables', image_url: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg' },
      { name: 'Potatoes', description: 'Fresh potatoes', category: 'Root Vegetables', image_url: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg' },
      { name: 'Carrots', description: 'Orange carrots', category: 'Root Vegetables', image_url: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg' },
      { name: 'Spinach', description: 'Fresh spinach leaves', category: 'Leafy Greens', image_url: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg' },
      { name: 'Coriander', description: 'Fresh coriander leaves', category: 'Leafy Greens', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Green Chilies', description: 'Fresh green chilies', category: 'Fresh Vegetables', image_url: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg' },
      { name: 'Brinjal', description: 'Purple brinjal', category: 'Fresh Vegetables', image_url: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg' },
      { name: 'Okra (Bendakaya)', description: 'Fresh okra', category: 'Fresh Vegetables', image_url: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg' },
      { name: 'Bananas', description: 'Ripe bananas', category: 'Fruits', image_url: 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg' },
      
      // Grocery Items
      { name: 'Basmati Rice', description: 'Premium basmati rice', category: 'Rice & Grains', image_url: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg' },
      { name: 'Toor Dal', description: 'Quality toor dal', category: 'Pulses & Lentils', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Moong Dal', description: 'Yellow moong dal', category: 'Pulses & Lentils', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Sunflower Oil', description: 'Pure sunflower oil', category: 'Oil & Ghee', image_url: 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg' },
      { name: 'Ghee', description: 'Pure cow ghee', category: 'Oil & Ghee', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Milk', description: 'Fresh cow milk', category: 'Dairy Products', image_url: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg' },
      { name: 'Curd', description: 'Fresh curd', category: 'Dairy Products', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Turmeric Powder', description: 'Pure turmeric powder', category: 'Spices & Masalas', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Red Chili Powder', description: 'Spicy red chili powder', category: 'Spices & Masalas', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' },
      { name: 'Garam Masala', description: 'Aromatic garam masala', category: 'Spices & Masalas', image_url: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg' }
    ];

    const products = [];
    const variants = [];

    for (const productData of productsData) {
      const category = categories.find(c => c.name === productData.category);
      
      if (!category) {
        console.error(`❌ Category not found for product ${productData.name}: ${productData.category}`);
        console.log('Available categories:', categories.map(c => c.name));
        continue;
      }
      
      if (!category.id) {
        console.error(`❌ Category has no ID for product ${productData.name}:`, category);
        continue;
      }
      
      console.log(`Creating product: ${productData.name} in category: ${category.name}`);
      
      const productResult = await supabaseAdmin
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          category_id: category.id,
          image_url: productData.image_url,
          is_featured: Math.random() > 0.7,
          is_active: true
        })
        .select()
        .single();

      if (productResult.error) throw productResult.error;
      products.push(productResult.data);

      // Create variants for each product
      const productVariants = [];
      if (productData.category === 'Fresh Vegetables' || productData.category === 'Leafy Greens' || productData.category === 'Root Vegetables' || productData.category === 'Fruits') {
        productVariants.push(
          { unit_label: '250g', price: Math.floor(Math.random() * 30) + 20, discount_price: null },
          { unit_label: '500g', price: Math.floor(Math.random() * 50) + 35, discount_price: Math.floor(Math.random() * 45) + 30 },
          { unit_label: '1kg', price: Math.floor(Math.random() * 80) + 60, discount_price: null }
        );
      } else {
        // Grocery items
        if (productData.name.includes('Rice')) {
          productVariants.push(
            { unit_label: '1kg', price: Math.floor(Math.random() * 100) + 80, discount_price: null },
            { unit_label: '5kg', price: Math.floor(Math.random() * 400) + 350, discount_price: Math.floor(Math.random() * 380) + 320 },
            { unit_label: '10kg', price: Math.floor(Math.random() * 700) + 650, discount_price: null }
          );
        } else if (productData.name.includes('Oil')) {
          productVariants.push(
            { unit_label: '500ml', price: Math.floor(Math.random() * 80) + 60, discount_price: null },
            { unit_label: '1L', price: Math.floor(Math.random() * 150) + 120, discount_price: Math.floor(Math.random() * 140) + 110 },
            { unit_label: '5L', price: Math.floor(Math.random() * 600) + 500, discount_price: null }
          );
        } else if (productData.name.includes('Milk')) {
          productVariants.push(
            { unit_label: '500ml', price: Math.floor(Math.random() * 30) + 25, discount_price: null },
            { unit_label: '1L', price: Math.floor(Math.random() * 50) + 45, discount_price: null }
          );
        } else {
          productVariants.push(
            { unit_label: '100g', price: Math.floor(Math.random() * 40) + 20, discount_price: null },
            { unit_label: '250g', price: Math.floor(Math.random() * 80) + 50, discount_price: Math.floor(Math.random() * 75) + 45 },
            { unit_label: '500g', price: Math.floor(Math.random() * 150) + 90, discount_price: null }
          );
        }
      }

      for (const variant of productVariants) {
        const variantResult = await supabaseAdmin
          .from('product_variants')
          .insert({
            product_id: productResult.data.id,
            unit_label: variant.unit_label,
            price: variant.price,
            discount_price: variant.discount_price,
            sku: `${productData.name.replace(/\s+/g, '').toUpperCase()}-${variant.unit_label}`,
            status: 'active'
          })
          .select()
          .single();

        if (variantResult.error) throw variantResult.error;
        variants.push(variantResult.data);
      }
    }

    console.log('✅ Products inserted:', products.length);
    console.log('✅ Variants inserted:', variants.length);

    // 4. Insert Users (Customers and Delivery Agents)
    console.log('👥 Inserting users...');
    const customerNames = [
      'Venkata Ramesh', 'Lakshmi Devi', 'Suresh Kumar', 'Padmavathi', 'Ravi Teja',
      'Sita Mahalakshmi', 'Krishna Murthy', 'Radha Kumari', 'Narasimha Rao', 'Kamala Devi',
      'Venkateswara Rao', 'Saraswathi', 'Rajesh Babu', 'Manjula', 'Srinivas',
      'Hymavathi', 'Ramakrishna', 'Vasantha', 'Subba Rao', 'Leelavathi',
      'Chandra Sekhar', 'Vijaya Lakshmi', 'Mohan Rao', 'Sunitha', 'Prasad',
      'Annapurna', 'Bhaskar', 'Sowmya', 'Hari Krishna', 'Durga Devi'
    ];

    const agentNames = [
      'Ramu', 'Babu Rao', 'Chinna Rao', 'Pavan Kumar', 'Sai Kumar',
      'Venu Gopal', 'Mahesh', 'Ramesh Babu'
    ];

    const customers = [];
    
    // First create auth users, then create profile records
    for (let i = 0; i < customerNames.length; i++) {
      const name = customerNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
      
      console.log(`Creating customer ${i + 1}/${customerNames.length}: ${name}`);
      
      // Create auth user first
      const authResult = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true
      });
      
      console.log(`Auth result for ${name}:`, { 
        error: authResult.error, 
        hasData: !!authResult.data, 
        hasUser: !!authResult.data?.user,
        userId: authResult.data?.user?.id 
      });
      
      if (authResult.error) {
        console.warn(`Auth error for ${name}:`, authResult.error);
        continue;
      }
      
      if (!authResult.data || !authResult.data.user || !authResult.data.user.id) {
        console.warn(`No user data returned for ${name}:`, authResult.data);
        continue;
      }
      
      const userId = authResult.data.user.id;
      console.log(`Creating profile for ${name} with ID: ${userId}`);
      
      // Then create profile in users table
      const customerResult = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          full_name: name,
          email: email,
          mobile_number: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
          role: 'customer',
          is_active: true
        })
        .select()
        .single();

      if (customerResult.error) {
        console.error(`Failed to create customer profile for ${name}:`, customerResult.error);
        continue;
      }
      
      console.log(`✅ Customer created: ${name}`);
      customers.push(customerResult.data);
    }

    const agents = [];
    for (let i = 0; i < agentNames.length; i++) {
      const name = agentNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@zepta.com`;
      
      console.log(`Creating agent ${i + 1}/${agentNames.length}: ${name}`);
      
      // Create auth user first
      const authResult = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true
      });
      
      if (authResult.error) {
        console.warn(`Auth error for agent ${name}:`, authResult.error);
        continue;
      }
      
      if (!authResult.data || !authResult.data.user || !authResult.data.user.id) {
        console.warn(`No user data returned for agent ${name}:`, authResult.data);
        continue;
      }
      
      const userId = authResult.data.user.id;
      const assignedStore = stores[Math.floor(Math.random() * stores.length)];
      
      if (!assignedStore || !assignedStore.id) {
        console.warn(`No valid store found for agent ${name}`);
        continue;
      }
      
      // Then create profile in users table
      const agentResult = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          full_name: name,
          email: email,
          mobile_number: `+91 ${8000000000 + Math.floor(Math.random() * 999999999)}`,
          role: 'delivery_agent',
          store_id: assignedStore.id,
          is_active: true
        })
        .select()
        .single();

      if (agentResult.error) {
        console.error(`Failed to create agent profile for ${name}:`, agentResult.error);
        continue;
      }
      
      console.log(`✅ Agent created: ${name}`);
      agents.push(agentResult.data);
    }

    console.log('✅ Customers inserted:', customers.length);
    console.log('✅ Delivery agents inserted:', agents.length);

    // 5. Insert Customer Addresses
    console.log('🏠 Inserting customer addresses...');
    const gunturAreas = [
      'Arundelpet', 'Brodipet', 'Kothapet', 'Lakshmipuram', 'Nagarampalem',
      'Pattabhipuram', 'Syamalanagar', 'Vidyanagar', 'Amaravathi Road', 'Collectorate'
    ];
    
    const vijayawadaAreas = [
      'Governorpet', 'Patamata', 'Benz Circle', 'Labbipet', 'Moghalrajpuram',
      'Suryaraopet', 'Gandhinagar', 'Auto Nagar', 'Bhavanipuram', 'Ajit Singh Nagar'
    ];

    for (const customer of customers.slice(0, 25)) {
      const isGuntur = Math.random() > 0.5;
      const areas = isGuntur ? gunturAreas : vijayawadaAreas;
      const city = isGuntur ? 'Guntur' : 'Vijayawada';
      const area = areas[Math.floor(Math.random() * areas.length)];
      
      await supabaseAdmin
        .from('customer_addresses')
        .insert({
          customer_id: customer.id,
          label: Math.random() > 0.5 ? 'Home' : 'Office',
          address_line1: `${Math.floor(Math.random() * 99) + 1}-${Math.floor(Math.random() * 999) + 1}, ${area}`,
          address_line2: `Near ${area} ${Math.random() > 0.5 ? 'Temple' : 'Market'}`,
          city: city,
          state: 'Andhra Pradesh',
          pincode: isGuntur ? `5220${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}` : `5200${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
          latitude: isGuntur ? 16.3067 + (Math.random() - 0.5) * 0.1 : 16.5062 + (Math.random() - 0.5) * 0.1,
          longitude: isGuntur ? 80.4365 + (Math.random() - 0.5) * 0.1 : 80.6480 + (Math.random() - 0.5) * 0.1,
          is_default: true
        });
    }

    console.log('✅ Customer addresses inserted');

    // 6. Insert Store Inventory
    console.log('📦 Inserting store inventory...');
    for (const store of stores) {
      for (const variant of variants) {
        const stockQuantity = Math.floor(Math.random() * 100) + 10;
        await supabaseAdmin
          .from('store_inventory')
          .insert({
            store_id: store.id,
            variant_id: variant.id,
            stock_quantity: stockQuantity,
            low_stock_threshold: Math.floor(Math.random() * 10) + 5
          });
      }
    }

    console.log('✅ Store inventory inserted');

    // 7. Insert Agent Locations
    console.log('📍 Inserting agent locations...');
    for (const agent of agents) {
      const store = stores.find(s => s.id === agent.store_id);
      if (store) {
        await supabaseAdmin
          .from('agent_locations')
          .insert({
            agent_id: agent.id,
            latitude: store.latitude + (Math.random() - 0.5) * 0.02,
            longitude: store.longitude + (Math.random() - 0.5) * 0.02
          });
      }
    }

    console.log('✅ Agent locations inserted');

    // 8. Insert Coupons
    console.log('🎫 Inserting coupons...');
    await supabaseAdmin
      .from('coupons')
      .insert([
        {
          code: 'WELCOME50',
          description: 'Welcome offer - 50 rupees off',
          discount_type: 'fixed',
          discount_value: 50,
          min_order_value: 200,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage_limit: 100,
          used_count: Math.floor(Math.random() * 20),
          status: 'active'
        },
        {
          code: 'SAVE10',
          description: '10% off on orders above 500',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_value: 500,
          max_discount: 100,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          usage_limit: 200,
          used_count: Math.floor(Math.random() * 50),
          status: 'active'
        }
      ]);

    console.log('✅ Coupons inserted');

    // 9. Insert Orders with Order Items
    console.log('🛒 Inserting orders...');
    const orderStatuses = ['pending', 'order_accepted', 'packed', 'assigned_delivery_partner', 'out_for_delivery', 'delivered', 'cancelled'];
    const paymentMethods = ['COD', 'Online'];
    
    for (let i = 0; i < 40; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const store = stores[Math.floor(Math.random() * stores.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Get customer address
      const addressResult = await supabaseAdmin
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', customer.id)
        .limit(1)
        .single();

      if (addressResult.error || !addressResult.data) {
        console.warn(`❌ No address found for customer ${customer?.full_name || 'unknown'}, skipping order`);
        continue;
      }
      
      if (!addressResult.data.id) {
        console.warn(`❌ Address has no ID for customer ${customer?.full_name || 'unknown'}, skipping order`);
        continue;
      }
      const orderItems = [];
      const numItems = Math.floor(Math.random() * 5) + 1;
      let orderTotal = 0;

      // Select random variants for this order
      const selectedVariants = [];
      for (let j = 0; j < numItems; j++) {
        const variant = variants[Math.floor(Math.random() * variants.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = variant.discount_price || variant.price;
        
        selectedVariants.push({
          variant_id: variant.id,
          quantity: quantity,
          price: price
        });
        
        orderTotal += price * quantity;
      }

      const deliveryCharges = orderTotal > 300 ? 0 : 30;
      const discountAmount = Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0;
      const finalTotal = orderTotal + deliveryCharges - discountAmount;

      const orderResult = await supabaseAdmin
        .from('orders')
        .insert({
          customer_id: customer.id,
          store_id: store.id,
          delivery_agent_id: ['assigned_delivery_partner', 'out_for_delivery', 'delivered'].includes(status) 
            ? (agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)].id : null)
            : null,
          delivery_address_id: addressResult.data.id,
          status: status,
          payment_method: paymentMethod,
          payment_status: status === 'delivered' ? 'paid' : (paymentMethod === 'Online' ? 'paid' : 'pending'),
          discount_amount: discountAmount,
          delivery_charges: deliveryCharges,
          order_total: finalTotal,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (orderResult.error) throw orderResult.error;

      // Insert order items
      for (const item of selectedVariants) {
        await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: orderResult.data.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price
          });
      }

      // Insert payment record
      await supabaseAdmin
        .from('payments')
        .insert({
          order_id: orderResult.data.id,
          provider: 'razorpay',
          transaction_id: paymentMethod === 'Online' ? `txn_${Math.random().toString(36).substr(2, 9)}` : null,
          amount: finalTotal,
          status: status === 'delivered' ? 'paid' : (paymentMethod === 'Online' ? 'paid' : 'pending')
        });
    }

    console.log('✅ Orders and order items inserted');

    // 10. Insert Promotional Banners
    console.log('🖼️ Inserting promotional banners...');
    await supabaseAdmin
      .from('promotional_banners')
      .insert([
        {
          title: 'Fresh Vegetables Daily',
          image_url: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
          link_type: 'category',
          link_target: categories.find(c => c.name === 'Fresh Vegetables')?.id,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          sort_order: 1,
          status: 'active'
        },
        {
          title: 'Premium Rice Collection',
          image_url: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg',
          link_type: 'category',
          link_target: categories.find(c => c.name === 'Rice & Grains')?.id,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          sort_order: 2,
          status: 'active'
        }
      ]);

    console.log('✅ Promotional banners inserted');

    // 11. Insert Notifications
    console.log('🔔 Inserting notifications...');
    for (let i = 0; i < 20; i++) {
      const user = [...customers, ...agents][Math.floor(Math.random() * (customers.length + agents.length))];
      const notificationTypes = ['order', 'promo', 'system'];
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      
      let title, message;
      if (type === 'order') {
        title = 'Order Update';
        message = 'Your order has been updated. Check the latest status.';
      } else if (type === 'promo') {
        title = 'Special Offer!';
        message = 'Get 10% off on your next order. Use code SAVE10.';
      } else {
        title = 'System Notification';
        message = 'Welcome to Zepta! Start shopping for fresh groceries.';
      }

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          title: title,
          message: message,
          type: type,
          is_read: Math.random() > 0.6,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    console.log('✅ Notifications inserted');

    console.log('🎉 All dummy data inserted successfully!');
    console.log('📊 Summary:');
    console.log(`- Stores: ${stores.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Variants: ${variants.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Delivery Agents: ${agents.length}`);
    console.log('- Orders: 40');
    console.log('- Inventory items: ~180');
    console.log('- Customer addresses: 25');
    console.log('- Notifications: 20');

    return { success: true, message: 'All dummy data inserted successfully!' };

  } catch (error: any) {
    console.error('❌ Error inserting dummy data:', error);
    return { success: false, error: error.message };
  }
};