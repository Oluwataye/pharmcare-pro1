-- Migration: Add missing audit event types
-- Description: Adds SHIFT_STARTED and SHIFT_RECONCILED to audit_event_type enum

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'audit_event_type' AND e.enumlabel = 'SHIFT_STARTED') THEN
    ALTER TYPE audit_event_type ADD VALUE 'SHIFT_STARTED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'audit_event_type' AND e.enumlabel = 'SHIFT_RECONCILED') THEN
    ALTER TYPE audit_event_type ADD VALUE 'SHIFT_RECONCILED';
  END IF;
END
$$;
