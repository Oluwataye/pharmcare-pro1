-- Phase 3.3: Rate Limiting Tables

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email, IP, or user_id
  action text NOT NULL, -- 'login', 'password_reset', 'print'
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON rate_limits(identifier, action, window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage rate limits (edge functions)
CREATE POLICY "Service role can manage rate limits"
ON rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add cleanup trigger to remove old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM rate_limits 
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Add comment
COMMENT ON TABLE rate_limits IS 'Phase 3 Security: Rate limiting tracking for login, password reset, and print operations';