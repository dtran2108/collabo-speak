-- Function to get auth users data from public schema
-- This function allows accessing auth.users from the public schema with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_auth_users(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If user_ids is empty or null, return all users
  IF user_ids IS NULL OR array_length(user_ids, 1) IS NULL THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.updated_at
    FROM auth.users au;
  ELSE
    -- Return only specified user IDs
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.updated_at
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
  END IF;
END;
$$;
