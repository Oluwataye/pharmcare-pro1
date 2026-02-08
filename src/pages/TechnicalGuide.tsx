import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TechnicalGuide = () => {
    const { toast } = useToast();

    const recoverySql = `-- ATOMIC RECOVERY V3: JSON PROTOCOL ENFORCEMENT
-- Purpose: Fix 'could not find function process_sale_transaction' error
-- AND enforce the new ledger/payment-mode architecture.

BEGIN;

DO $$ 
BEGIN
    -- 1. Create the base process_sale_transaction function if it doesn't exist
    CREATE OR REPLACE FUNCTION public.process_sale_transaction(
      p_sale_data jsonb,
      p_items jsonb,
      p_payments jsonb DEFAULT '[]'::jsonb
    ) RETURNS jsonb AS $func$
    DECLARE
      v_sale_id uuid;
      v_item jsonb;
      v_payment jsonb;
      v_total decimal;
    BEGIN
      -- Insert main sale record
      INSERT INTO sales (
        customer_name,
        customer_phone,
        total_amount,
        discount_percentage,
        sale_type,
        dispenser_id,
        shift_id,
        transaction_id
      ) VALUES (
        (p_sale_data->>'customerName'),
        (p_sale_data->>'customerPhone'),
        (p_sale_data->>'total')::decimal,
        (p_sale_data->>'discount')::decimal,
        (p_sale_data->>'saleType'),
        (p_sale_data->>'dispenserId')::uuid,
        (p_sale_data->>'shift_id')::uuid,
        (p_sale_data->>'transactionId')
      ) RETURNING id INTO v_sale_id;

      -- Process items
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_price,
          subtotal
        ) VALUES (
          v_sale_id,
          (v_item->>'product_id')::uuid,
          (v_item->>'quantity')::integer,
          (v_item->>'unit_price')::decimal,
          (v_item->>'subtotal')::decimal
        );
        
        -- Deduct inventory
        UPDATE inventory 
        SET quantity = quantity - (v_item->>'quantity')::integer
        WHERE id = (v_item->>'product_id')::uuid;
      END LOOP;

      -- Process payments
      FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
      LOOP
        INSERT INTO sale_payments (
          sale_id,
          amount,
          payment_mode
        ) VALUES (
          v_sale_id,
          (v_payment->>'amount')::decimal,
          (v_payment->>'mode')
        );
      END LOOP;

      RETURN jsonb_build_object('success', true, 'saleId', v_sale_id);
    END;
    $func$ LANGUAGE plpgsql;

    RAISE NOTICE 'Atomic Recovery V3 Applied Successfully';
END $$;

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
