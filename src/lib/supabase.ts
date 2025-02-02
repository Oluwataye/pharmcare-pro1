import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vjaizhmyacnyyouiuszd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYWl6aG15YWNueXlvdWl1c3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODE4MTEsImV4cCI6MjA1MDU1NzgxMX0.YAF4pq9AFwKpY6LGAd3AKaO5VMX1jjTy0aBvfDuPQIQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);