-- ====================================================================
-- FIX SHIFTS BRANCH ISOLATION & RLS
-- ====================================================================

DO $$ 
DECLARE 
    default_branch_id UUID;
BEGIN
    -- 1. Get the default branch ID
    SELECT id INTO default_branch_id FROM public.branches LIMIT 1;

    -- 2. Backfill branch_id for staff_shifts from profiles or default branch
    -- This ensures existing shifts are visible under branch isolation rules
    UPDATE public.staff_shifts ss
    SET branch_id = COALESCE(p.branch_id, default_branch_id)
    FROM public.profiles p
    WHERE ss.staff_id = p.user_id
    AND ss.branch_id IS NULL;

    -- Final fallback for any orphans
    UPDATE public.staff_shifts
    SET branch_id = default_branch_id
    WHERE branch_id IS NULL;

    -- 3. Enable RLS on staff_shifts (if not already enabled)
    ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

    -- 4. Create Branch Isolation Policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_shifts' 
        AND policyname = 'Shifts branch isolation'
    ) THEN 
        CREATE POLICY "Shifts branch isolation" ON public.staff_shifts 
        FOR SELECT TO authenticated 
        USING (
            public.has_role(auth.uid(), 'SUPER_ADMIN') 
            OR 
            public.has_role(auth.uid(), 'ADMIN')
            OR
            branch_id IS NOT DISTINCT FROM public.get_user_branch_id()
        );
    END IF;

    -- 5. Create Management Policy (for starting/ending own shifts)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_shifts' 
        AND policyname = 'Staff manage own shifts'
    ) THEN 
        CREATE POLICY "Staff manage own shifts" ON public.staff_shifts 
        FOR ALL TO authenticated 
        USING (staff_id = auth.uid()) 
        WITH CHECK (staff_id = auth.uid());
    END IF;

    RAISE NOTICE 'staff_shifts RLS policies created and branch_id backfilled.';
END $$;
