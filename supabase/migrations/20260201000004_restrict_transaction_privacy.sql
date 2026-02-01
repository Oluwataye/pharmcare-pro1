-- Migration: Restrict Transaction History Privacy
-- Ensures Pharmacists and Dispensers can only see their own transactions
-- Only SUPER_ADMIN and ADMIN roles can see all transactions

-- ============================================
-- SALES TABLE: Restrict to own sales or admin only
-- ============================================

DROP POLICY IF EXISTS "Restricted sales access" ON sales;

CREATE POLICY "Restricted sales access"
ON sales FOR SELECT
TO authenticated
USING (
  cashier_id = auth.uid() OR
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'ADMIN'::app_role)
);

-- ============================================
-- SALES_ITEMS TABLE: Restrict based on sale ownership
-- ============================================

DROP POLICY IF EXISTS "Restricted sales items access" ON sales_items;

CREATE POLICY "Restricted sales items access"
ON sales_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sales
    WHERE sales.id = sales_items.sale_id
    AND (
      sales.cashier_id = auth.uid() OR
      has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
      has_role(auth.uid(), 'ADMIN'::app_role)
    )
  )
);

-- ============================================
-- RECEIPTS TABLE: Restrict based on sale ownership
-- ============================================

DROP POLICY IF EXISTS "Restricted receipts access" ON receipts;

CREATE POLICY "Restricted receipts access"
ON receipts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sales
    WHERE sales.id = receipts.sale_id
    AND (
      sales.cashier_id = auth.uid() OR
      has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
      has_role(auth.uid(), 'ADMIN'::app_role)
    )
  )
);

-- ============================================
-- PRINT_ANALYTICS TABLE: Restrict to own analytics or admin
-- ============================================

DROP POLICY IF EXISTS "Restricted print analytics access" ON print_analytics;

CREATE POLICY "Restricted print analytics access"
ON print_analytics FOR SELECT
TO authenticated
USING (
  cashier_id = auth.uid() OR
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'ADMIN'::app_role)
);

-- Update policy comments
COMMENT ON POLICY "Restricted sales access" ON sales IS 'Transaction Privacy: Users can only view their own sales, admins can view all';
COMMENT ON POLICY "Restricted sales items access" ON sales_items IS 'Transaction Privacy: Restricted based on parent sale access';
COMMENT ON POLICY "Restricted receipts access" ON receipts IS 'Transaction Privacy: Restricted based on parent sale access';
COMMENT ON POLICY "Restricted print analytics access" ON print_analytics IS 'Transaction Privacy: Users can only view their own analytics, admins can view all';
