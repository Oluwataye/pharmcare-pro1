-- Migration: Add detailed payment mode totals to staff_shifts
-- This allows for precise reconciliation of different payment methods at shift end.

ALTER TABLE public.staff_shifts 
ADD COLUMN IF NOT EXISTS expected_cash_total DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_pos_total DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_transfer_total DECIMAL DEFAULT 0;
