import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TechnicalGuide = () => {
    const { toast } = useToast();

    const recoverySql = `-- COMPLETE INFRASTRUCTURE HEALING V5.4
-- Purpose: Create ALL missing tables, columns, and functions
-- This is the definitive one-click repair for sales infrastructure.

BEGIN;

-- 1. Create sale_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_mode TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id ON public.sale_payments(sale_id);

-- 2. Ensure all required columns exist in sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS manual_discount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shift_name TEXT,
ADD COLUMN IF NOT EXISTS shift_id UUID,
ADD COLUMN IF NOT EXISTS staff_role TEXT,
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_outstanding DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_id UUID;

-- 3. Create the Universal JSON RPC Function
CREATE OR REPLACE FUNCTION public.process_sale_transaction(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_payment JSONB;
  v_current_stock INTEGER;
  v_cost_price DECIMAL;
  v_total_cost DECIMAL := 0;
BEGIN
  -- 1. Insert Master Sale Record
  INSERT INTO public.sales (
    transaction_id, total, discount, manual_discount, 
    customer_name, customer_phone, business_name, business_address, 
    sale_type, status, cashier_id, cashier_name, cashier_email, 
    shift_name, shift_id, staff_role, payment_methods,
    payment_status, amount_paid, amount_outstanding, customer_id
  ) VALUES (
    (p_payload->>'p_transaction_id'),
    (p_payload->>'p_total')::DECIMAL,
    COALESCE((p_payload->>'p_discount')::DECIMAL, 0),
    COALESCE((p_payload->>'p_manual_discount')::DECIMAL, 0),
    (p_payload->>'p_customer_name'),
    (p_payload->>'p_customer_phone'),
    (p_payload->>'p_business_name'),
    (p_payload->>'p_business_address'),
    (p_payload->>'p_sale_type'),
    'completed',
    (p_payload->>'p_cashier_id')::UUID,
    (p_payload->>'p_cashier_name'),
    (p_payload->>'p_cashier_email'),
    (p_payload->>'p_shift_name'),
    (p_payload->>'p_shift_id')::UUID,
    (p_payload->>'p_staff_role'),
    (p_payload->'p_payments'),
    COALESCE((p_payload->>'p_payment_status'), 'paid'),
    COALESCE((p_payload->>'p_amount_paid')::DECIMAL, 0),
    COALESCE((p_payload->>'p_amount_outstanding')::DECIMAL, 0),
    (p_payload->>'p_customer_id')::UUID
  ) RETURNING id INTO v_sale_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'p_items') LOOP
    -- Fetch current stock and cost price
    SELECT quantity, cost_price INTO v_current_stock, v_cost_price
    FROM public.inventory WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    -- Verify stock availability
    IF v_current_stock < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_item->>'product_name';
    END IF;

    -- Deduct Stock
    UPDATE public.inventory SET 
      quantity = quantity - (v_item->>'quantity')::INTEGER,
      last_updated_at = NOW(),
      last_updated_by = (p_payload->>'p_cashier_id')::UUID
    WHERE id = (v_item->>'product_id')::UUID;

    -- Insert Sale Item
    INSERT INTO public.sales_items (
      sale_id, product_id, product_name, quantity, unit_price, price, cost_price, discount, is_wholesale, total
    ) VALUES (
      v_sale_id, (v_item->>'product_id')::UUID, v_item->>'product_name', 
      (v_item->>'quantity')::INTEGER, (v_item->>'unit_price')::DECIMAL, (v_item->>'price')::DECIMAL,
      COALESCE(v_cost_price, 0), COALESCE((v_item->>'discount')::DECIMAL, 0),
      COALESCE((v_item->>'is_wholesale')::BOOLEAN, false), (v_item->>'total')::DECIMAL
    );

    v_total_cost := v_total_cost + (COALESCE(v_cost_price, 0) * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- 3. Record Payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payload->'p_payments') LOOP
    INSERT INTO public.sale_payments (sale_id, payment_mode, amount)
    VALUES (v_sale_id, v_payment->>'mode', (v_payment->>'amount')::DECIMAL);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'sale_id', v_sale_id, 
    'transaction_id', p_payload->>'p_transaction_id',
    'profit', ((p_payload->>'p_total')::DECIMAL - v_total_cost)
  );
END;
$$;

COMMIT;`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(recoverySql);
        toast({
            title: "SQL Copied",
            description: "Recovery script copied to clipboard. Paste it in Supabase SQL Editor.",
        });
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Technical Repair Guide</h1>
                <p className="text-muted-foreground">
                    Follow these steps to synchronize your database infrastructure with the application code.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Infrastructure Mismatch Detected
                        </CardTitle>
                        <CardDescription>
                            Your database is missing the <strong>JSON Sales Protocol</strong> required by version 2.0+ of the app.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-background p-4 rounded-md border text-sm font-mono flex justify-between items-center italic">
                            <span>CODE: DB_RESTORE_REQUIRED</span>
                            <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Ready to Fix
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            Step 1: Execute Recovery SQL
                        </CardTitle>
                        <CardDescription>
                            Copy the script below and run it in your Supabase Dashboard SQL Editor.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative group">
                            <pre className="bg-slate-950 text-slate-50 p-6 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[400px]">
                                {recoverySql}
                            </pre>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-4 right-4"
                                onClick={copyToClipboard}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Script
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Where to run this?</h4>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                                <li>Log in to your <strong>Supabase Dashboard</strong>.</li>
                                <li>Select your project.</li>
                                <li>Click on the <strong>SQL Editor</strong> in the left sidebar.</li>
                                <li>Click <strong>New Query</strong>, paste the script, and click <strong>Run</strong>.</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Step 2: Sync Pending Sales
                        </CardTitle>
                        <CardDescription>
                            After running the script, refresh the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Your "Repair Required" status will turn Green. The system will then automatically detect your offline sales and move them into the database safely.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TechnicalGuide;
