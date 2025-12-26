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
