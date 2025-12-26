# Supabase Database Migration Guide - Refunds Table

## Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/luhbkhosuawobupmzzrv
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

## Step 2: Run the Migration SQL

Copy and paste the following SQL into the editor and click **Run**:

```sql
-- Refunds Table with Approval Workflow
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason TEXT NOT NULL,
  refund_type TEXT CHECK (refund_type IN ('full', 'partial')) NOT NULL,
  
  -- Approval workflow fields
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Initiator (Cashier)
  initiated_by UUID REFERENCES auth.users(id),
  initiated_by_name TEXT,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approver (Admin)
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Sale details
  original_amount DECIMAL(10,2),
  customer_name TEXT,
  items JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_refunds_sale_id ON refunds(sale_id);
CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_initiated_by ON refunds(initiated_by);

-- RLS Policies
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Cashiers can view their own refund requests
CREATE POLICY "Cashiers can view own refunds"
  ON refunds FOR SELECT
  USING (
    auth.uid() = initiated_by OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Cashiers can insert refund requests
CREATE POLICY "Cashiers can create refunds"
  ON refunds FOR INSERT
  WITH CHECK (auth.uid() = initiated_by);

-- Only admins can update (approve/reject) refunds
CREATE POLICY "Admins can approve refunds"
  ON refunds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refunds_updated_at();
```

## Step 3: Verify Migration

After running the SQL, verify the table was created:

1. Click on **Table Editor** in the left sidebar
2. Look for the `refunds` table in the list
3. Click on it to see the schema

You should see all the columns (id, sale_id, transaction_id, status, etc.)

## Step 4: Test RLS Policies

The Row Level Security policies ensure:
- ✅ Cashiers can only see their own refund requests
- ✅ Admins can see all refund requests
- ✅ Cashiers can create refund requests
- ✅ Only Admins can approve/reject refunds

## Troubleshooting

If you get an error about the `profiles` table not existing, you may need to adjust the RLS policies to match your actual user table structure.

## Next Steps

Once the migration is complete:
1. Test the refund workflow in the main project
2. Apply the same migration to the MVP's Supabase instance
3. Deploy both projects
