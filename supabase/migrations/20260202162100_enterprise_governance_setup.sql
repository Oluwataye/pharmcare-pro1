-- ====================================================================
-- ENTERPRISE GOVERNANCE & MULTI-BRANCH SETUP
-- ====================================================================

-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert Default Branch
INSERT INTO public.branches (name, location)
SELECT 'Main Branch', 'Default Location'
WHERE NOT EXISTS (SELECT 1 FROM public.branches LIMIT 1);

-- 3. Add branch_id to core tables
DO $$ 
DECLARE 
    default_branch_id UUID;
BEGIN
    SELECT id INTO default_branch_id FROM public.branches LIMIT 1;

    -- Update Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'branch_id') THEN
        ALTER TABLE public.profiles ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    UPDATE public.profiles SET branch_id = default_branch_id WHERE branch_id IS NULL;

    -- Update Inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'branch_id') THEN
        ALTER TABLE public.inventory ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    UPDATE public.inventory SET branch_id = default_branch_id WHERE branch_id IS NULL;

    -- Update Sales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'branch_id') THEN
        ALTER TABLE public.sales ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    UPDATE public.sales SET branch_id = default_branch_id WHERE branch_id IS NULL;

    -- Update Expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'branch_id') THEN
        ALTER TABLE public.expenses ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    UPDATE public.expenses SET branch_id = default_branch_id WHERE branch_id IS NULL;

    -- Update Staff Shifts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_shifts' AND column_name = 'branch_id') THEN
        ALTER TABLE public.staff_shifts ADD COLUMN branch_id UUID REFERENCES public.branches(id);
    END IF;
    UPDATE public.staff_shifts SET branch_id = default_branch_id WHERE branch_id IS NULL;
END $$;

-- 4. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id), -- NULL means company-wide
    category TEXT NOT NULL,
    type TEXT CHECK (type IN ('revenue', 'expense', 'profit')) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (branch_id, category, month, year)
);

-- 5. Helper function to get user's branch
CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS UUID AS $$
    SELECT branch_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
