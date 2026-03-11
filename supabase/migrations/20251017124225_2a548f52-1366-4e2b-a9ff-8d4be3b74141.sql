-- Add logo_url column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN logo_url TEXT;

-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-logos',
  'store-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies for store logos
-- Allow authenticated users to view logos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storage.objects' AND policyname = 'Anyone can view store logos'
  ) THEN 
    CREATE POLICY "Anyone can view store logos" 
  ON storage.objects
  bucket_id = 'store-logos';
  END IF; 
END
$$;

-- Only super admins can upload logos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storage.objects' AND policyname = 'Super admins can upload store logos'
  ) THEN 
    CREATE POLICY "Super admins can upload store logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'store-logos' 
  AND (SELECT has_role(auth.uid(), 'SUPER_ADMIN'::app_role))
);
  END IF; 
END
$$;

-- Only super admins can update logos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storage.objects' AND policyname = 'Super admins can update store logos'
  ) THEN 
    CREATE POLICY "Super admins can update store logos" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'store-logos' 
  AND (SELECT has_role(auth.uid(), 'SUPER_ADMIN'::app_role))
);
  END IF; 
END
$$;

-- Only super admins can delete logos
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'storage.objects' AND policyname = 'Super admins can delete store logos'
  ) THEN 
    CREATE POLICY "Super admins can delete store logos" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'store-logos' 
  AND (SELECT has_role(auth.uid(), 'SUPER_ADMIN'::app_role))
);
  END IF; 
END
$$;