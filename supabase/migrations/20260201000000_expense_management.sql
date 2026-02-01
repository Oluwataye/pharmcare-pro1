-- Migration: Expense Management System
-- Description: Creates the 'expenses' table to track operational costs and configures RLS for Admin access.

-- 1. Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Add comment for documentation
COMMENT ON TABLE public.expenses IS 'Tracks operational expenses for financial reporting and profit calculation.';

-- 3. Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Admins/Super Admins can do everything
CREATE POLICY "Admins can manage all expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR 
    public.has_role(auth.uid(), 'ADMIN'::app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR 
    public.has_role(auth.uid(), 'ADMIN'::app_role)
);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_expenses_updated_at();

-- 6. Indices for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
