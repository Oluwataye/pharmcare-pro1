-- Add financial control columns to staff_shifts
ALTER TABLE public.staff_shifts 
ADD COLUMN IF NOT EXISTS variance_reason TEXT,
ADD COLUMN IF NOT EXISTS closure_status TEXT DEFAULT 'open'; -- 'open', 'closed'

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'variance', 'security', 'inventory'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    message TEXT NOT NULL,
    details JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    staff_id UUID REFERENCES auth.users(id),
    shift_id UUID REFERENCES public.staff_shifts(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for system_alerts
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can see all alerts
CREATE POLICY "Admins can view all alerts" 
ON public.system_alerts FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'PHARMACIST')
    )
);

-- Staff can see their own alerts
CREATE POLICY "Staff can view own alerts" 
ON public.system_alerts FOR SELECT 
TO authenticated 
USING (
    staff_id = auth.uid()
);

-- Only admins can resolve alerts
CREATE POLICY "Admins can update alerts" 
ON public.system_alerts FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'PHARMACIST')
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_alerts_updated_at
    BEFORE UPDATE ON public.system_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
