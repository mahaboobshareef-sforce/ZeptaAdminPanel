-- Create 15 customers with auth accounts
-- Password for all: Customer@123

DO $$
DECLARE
  customer_data RECORD;
  auth_user_id UUID;
BEGIN
  -- Array of customer data
  FOR customer_data IN
    SELECT * FROM (VALUES
      ('Rajesh Kumar', 'rajesh.kumar@gmail.com', '9876543210'),
      ('Priya Sharma', 'priya.sharma@gmail.com', '9876543211'),
      ('Amit Patel', 'amit.patel@gmail.com', '9876543212'),
      ('Sneha Reddy', 'sneha.reddy@gmail.com', '9876543213'),
      ('Vijay Singh', 'vijay.singh@gmail.com', '9876543214'),
      ('Lakshmi Devi', 'lakshmi.devi@gmail.com', '9876543215'),
      ('Ramesh Babu', 'ramesh.babu123@gmail.com', '9876543216'),
      ('Kavita Rao', 'kavita.rao@gmail.com', '9876543217'),
      ('Suresh Kumar', 'suresh.kumar@gmail.com', '9876543218'),
      ('Anitha Nair', 'anitha.nair@gmail.com', '9876543219'),
      ('Kiran Reddy', 'kiran.reddy@gmail.com', '9876543220'),
      ('Divya Prasad', 'divya.prasad@gmail.com', '9876543221'),
      ('Naveen Kumar', 'naveen.kumar@gmail.com', '9876543222'),
      ('Shalini Iyer', 'shalini.iyer@gmail.com', '9876543223'),
      ('Arun Krishna', 'arun.krishna@gmail.com', '9876543224')
    ) AS t(full_name, email, mobile_number)
  LOOP
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      customer_data.email,
      crypt('Customer@123', gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', customer_data.full_name, 'role', 'customer'),
      now(),
      now(),
      '',
      ''
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO auth_user_id;

    -- Update mobile number in public.users (trigger will create the record)
    IF auth_user_id IS NOT NULL THEN
      PERFORM pg_sleep(0.1); -- Small delay for trigger to complete
      UPDATE users
      SET mobile_number = customer_data.mobile_number,
          full_name = customer_data.full_name
      WHERE id = auth_user_id;
    END IF;
  END LOOP;
END $$;
