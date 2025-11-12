-- Phase 1: Database Security Hardening - Restrict RLS Policies

-- ============================================
-- SALES TABLE: Restrict to own sales or admin/pharmacist
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "All authenticated users can view sales" ON sales;

-- Create restrictive policy: Cashiers see only their own sales, admins and pharmacists see all
CREATE POLICY "Restricted sales access"
ON sales FOR SELECT
TO authenticated
USING (
  cashier_id = auth.uid() OR
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'PHARMACIST'::app_role)
);

-- ============================================
-- SALES_ITEMS TABLE: Restrict based on sale ownership
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "All authenticated users can view sales items" ON sales_items;

-- Create restrictive policy: Only view items for sales you can access
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
      has_role(auth.uid(), 'PHARMACIST'::app_role)
    )
  )
);

-- ============================================
-- RECEIPTS TABLE: Restrict based on sale ownership
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "All authenticated users can view receipts" ON receipts;

-- Create restrictive policy: Only view receipts for sales you can access
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
      has_role(auth.uid(), 'PHARMACIST'::app_role)
    )
  )
);

-- ============================================
-- PRINT_ANALYTICS TABLE: Restrict to own analytics or admin
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "All authenticated users can view print analytics" ON print_analytics;

-- Create restrictive policy: Cashiers see only their own print analytics, admins see all
CREATE POLICY "Restricted print analytics access"
ON print_analytics FOR SELECT
TO authenticated
USING (
  cashier_id = auth.uid() OR
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role)
);

-- ============================================
-- STORE_SETTINGS TABLE: Restrict to admin and pharmacist only
-- ============================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "All authenticated users can view settings" ON store_settings;

-- Create restrictive policy: Only super admins and pharmacists can view settings
CREATE POLICY "Restricted store settings access"
ON store_settings FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
  has_role(auth.uid(), 'PHARMACIST'::app_role)
);

-- Add helpful comment
COMMENT ON POLICY "Restricted sales access" ON sales IS 'Phase 1 Security: Cashiers can only view their own sales, admins and pharmacists can view all';
COMMENT ON POLICY "Restricted sales items access" ON sales_items IS 'Phase 1 Security: Restricted based on parent sale access';
COMMENT ON POLICY "Restricted receipts access" ON receipts IS 'Phase 1 Security: Restricted based on parent sale access';
COMMENT ON POLICY "Restricted print analytics access" ON print_analytics IS 'Phase 1 Security: Cashiers can only view their own analytics';
COMMENT ON POLICY "Restricted store settings access" ON store_settings IS 'Phase 1 Security: Only admins and pharmacists can view store settings';