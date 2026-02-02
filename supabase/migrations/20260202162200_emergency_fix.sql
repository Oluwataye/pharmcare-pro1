-- ====================================================================
-- EMERGENCY FIX: RLS RECURSION & SCHEMA MISMATCH
-- ====================================================================

-- 1. Fix get_user_branch_id recursion
-- This function MUST be SECURITY DEFINER to bypass RLS on the profiles table
CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT branch_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Fix sales table schema mismatch
-- The application expects a 'date' column for reporting
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'date') THEN
        ALTER TABLE public.sales ADD COLUMN date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Backfill 'date' from 'created_at' if null
UPDATE public.sales SET date = created_at::DATE WHERE date IS NULL;

-- 3. Ensure expenses table is consistent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'date') THEN
        ALTER TABLE public.expenses ADD COLUMN date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 4. Audit Log & Table Isolation (Fixing recursion)
DROP POLICY IF EXISTS "Sales branch isolation" ON public.sales;
DROP POLICY IF EXISTS "Profiles branch isolation" ON public.profiles;
DROP POLICY IF EXISTS "Expenses branch isolation" ON public.expenses;
DROP POLICY IF EXISTS "Inventory branch isolation" ON public.inventory;
DROP POLICY IF EXISTS "Budgets branch isolation" ON public.budgets;

CREATE POLICY "Profiles branch isolation" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR user_id = auth.uid() OR branch_id = public.get_user_branch_id());

CREATE POLICY "Inventory branch isolation" ON public.inventory FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR branch_id = public.get_user_branch_id());

CREATE POLICY "Sales branch isolation" ON public.sales FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR branch_id = public.get_user_branch_id());

CREATE POLICY "Expenses branch isolation" ON public.expenses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR branch_id = public.get_user_branch_id());

CREATE POLICY "Budgets branch isolation" ON public.budgets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'SUPER_ADMIN') OR branch_id = public.get_user_branch_id() OR branch_id IS NULL);

-- 5. Fix potential recursion in has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
