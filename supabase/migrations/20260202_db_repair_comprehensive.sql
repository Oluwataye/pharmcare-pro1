-- 1. FIX SYSTEM_ALERTS (RESOVLES 404)
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
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

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all alerts') THEN
        CREATE POLICY "Admins can view all alerts" ON public.system_alerts FOR SELECT TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'PHARMACIST')));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view own alerts') THEN
        CREATE POLICY "Staff can view own alerts" ON public.system_alerts FOR SELECT TO authenticated 
        USING (staff_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update alerts') THEN
        CREATE POLICY "Admins can update alerts" ON public.system_alerts FOR UPDATE TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'PHARMACIST')));
    END IF;
END $$;

-- 2. FIX STAFF_SHIFTS COLUMNS (ENSURES RECONCILIATION WORKS)
ALTER TABLE public.staff_shifts 
ADD COLUMN IF NOT EXISTS variance_reason TEXT,
ADD COLUMN IF NOT EXISTS closure_status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS expected_sales_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_cash_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_pos_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_transfer_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_cash_counted NUMERIC DEFAULT 0;

-- 3. FIX STORE_SETTINGS COLUMNS (RESOLVES 400 & AUTO-BACKUP ERRORS)
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS last_backup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enable_auto_backups BOOLEAN DEFAULT TRUE;

-- 4. ENSURE USER_ROLES EXISTS (FOR POLICY CHECKS)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
