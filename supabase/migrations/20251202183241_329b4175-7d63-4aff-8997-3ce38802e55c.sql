-- Create audit log event types enum
CREATE TYPE public.audit_event_type AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'UNAUTHORIZED_ACCESS',
  'USER_CREATED',
  'USER_DELETED',
  'USER_UPDATED',
  'ROLE_CHANGED',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
  'SETTINGS_UPDATED',
  'DATA_EXPORTED',
  'DATA_DELETED',
  'SALE_COMPLETED',
  'INVENTORY_UPDATED',
  'BULK_UPLOAD'
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type audit_event_type NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  ip_address text,
  user_agent text,
  resource_type text,
  resource_id text,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN can view audit logs
CREATE POLICY "Only super admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Service role can insert audit logs (from edge functions)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create data retention tracking table
CREATE TABLE public.data_retention_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL,
  last_cleanup_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN can manage retention config
CREATE POLICY "Only super admins can manage retention config"
ON public.data_retention_config
FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'))
WITH CHECK (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Insert default retention policies
INSERT INTO public.data_retention_config (table_name, retention_days) VALUES
  ('audit_logs', 365),
  ('print_analytics', 90),
  ('rate_limits', 1);

-- Create GDPR data requests table
CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('EXPORT', 'DELETE', 'ACCESS')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  export_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);

-- Enable RLS
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own GDPR requests"
ON public.gdpr_requests
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'SUPER_ADMIN'));

-- Users can create their own requests
CREATE POLICY "Users can create own GDPR requests"
ON public.gdpr_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only SUPER_ADMIN can update requests
CREATE POLICY "Only super admins can update GDPR requests"
ON public.gdpr_requests
FOR UPDATE
USING (has_role(auth.uid(), 'SUPER_ADMIN'));

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_event_type audit_event_type,
  p_user_id uuid,
  p_user_email text,
  p_user_role text,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    event_type, user_id, user_email, user_role, action,
    resource_type, resource_id, details, status, error_message,
    ip_address, user_agent
  ) VALUES (
    p_event_type, p_user_id, p_user_email, p_user_role, p_action,
    p_resource_type, p_resource_id, p_details, p_status, p_error_message,
    p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create function to cleanup old data based on retention policies
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config RECORD;
BEGIN
  FOR config IN SELECT * FROM data_retention_config WHERE is_active = true
  LOOP
    -- Handle each table's cleanup
    IF config.table_name = 'audit_logs' THEN
      DELETE FROM audit_logs WHERE created_at < now() - (config.retention_days || ' days')::interval;
    ELSIF config.table_name = 'print_analytics' THEN
      DELETE FROM print_analytics WHERE created_at < now() - (config.retention_days || ' days')::interval;
    ELSIF config.table_name = 'rate_limits' THEN
      DELETE FROM rate_limits WHERE window_start < now() - (config.retention_days || ' days')::interval;
    END IF;
    
    -- Update last cleanup timestamp
    UPDATE data_retention_config SET last_cleanup_at = now(), updated_at = now() WHERE id = config.id;
  END LOOP;
END;
$$;

-- Create function to anonymize user data (for right to be forgotten)
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize sales data
  UPDATE sales SET
    customer_name = 'ANONYMIZED',
    customer_phone = NULL,
    cashier_name = CASE WHEN cashier_id = p_user_id THEN 'DELETED_USER' ELSE cashier_name END,
    cashier_email = CASE WHEN cashier_id = p_user_id THEN NULL ELSE cashier_email END
  WHERE cashier_id = p_user_id OR customer_phone IS NOT NULL;
  
  -- Anonymize print analytics
  UPDATE print_analytics SET
    cashier_name = 'DELETED_USER',
    customer_name = 'ANONYMIZED'
  WHERE cashier_id = p_user_id;
  
  -- Anonymize audit logs (keep for compliance but remove PII)
  UPDATE audit_logs SET
    user_email = 'anonymized@deleted.user',
    ip_address = NULL,
    user_agent = NULL,
    details = details - 'email' - 'name' - 'phone'
  WHERE user_id = p_user_id;
  
  -- Update profile to anonymized state
  UPDATE profiles SET
    name = 'Deleted User',
    username = 'deleted_' || substr(p_user_id::text, 1, 8)
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;