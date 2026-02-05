-- Migration: Add Credit Sales (Accounts Receivable) Support
-- Description: Adds customers and customer_transactions tables, and updates sales table to support credit/partial payments.

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT, -- Phone can be unique but null for now, or enforce uniqueness if provided
    email TEXT,
    address TEXT,
    credit_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00, -- Optional limit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- 2. Create Ledger (Customer Transactions) Table
-- This tracks every debit (sale) and credit (payment) to the customer's account
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')), -- DEBIT = Owe more (Sale), CREDIT = Pay off (Payment)
    amount DECIMAL(15, 2) NOT NULL,
    reference_id UUID, -- Can be Sale ID for DEBIT, or Payment ID/Null for CREDIT
    description TEXT,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) -- Who processed this transaction
);

CREATE INDEX IF NOT EXISTS idx_cust_trans_customer ON public.customer_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_trans_created_at ON public.customer_transactions(created_at);

-- 3. Modify Sales Table for Credit Tracking
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'pending')),
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS amount_outstanding DECIMAL(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Update existing sales to have consistent data
UPDATE public.sales 
SET amount_paid = total, amount_outstanding = 0, payment_status = 'paid' 
WHERE amount_paid IS NULL OR amount_paid = 0;

-- 4. Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Customers
CREATE POLICY "Authenticated users can read customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" ON public.customers
    FOR UPDATE TO authenticated USING (true);

-- Policies for Transactions
CREATE POLICY "Authenticated users can read customer transactions" ON public.customer_transactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert customer transactions" ON public.customer_transactions
    FOR INSERT TO authenticated WITH CHECK (
        --Ideally lock this down further, but for now authenticated users need to create records via Edge Function or App
        true
    );

-- 5. Helper Function to Update Customer Balance
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.customers
    SET credit_balance = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_balance_trigger
AFTER INSERT ON public.customer_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_balance();
