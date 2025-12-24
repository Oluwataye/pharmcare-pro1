-- Fix function search path warning

DROP FUNCTION IF EXISTS cleanup_old_rate_limits();

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM rate_limits 
  WHERE window_start < now() - interval '24 hours';
END;
$$;