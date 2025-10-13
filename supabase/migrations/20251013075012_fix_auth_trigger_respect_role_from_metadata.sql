/*
  # Fix auth trigger to respect role from user_metadata
  
  When creating staff/agents via edge function, the role should come from user_metadata
  instead of defaulting to 'customer'
*/

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Get role from user_metadata if provided, otherwise default to 'customer'
  INSERT INTO public.users(id, email, full_name, role, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
