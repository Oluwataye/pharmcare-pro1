
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase-types'

const supabaseUrl = 'https://vjaizhmyacnyyouiuszd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYWl6aG15YWNueXlvdWl1c3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODE4MTEsImV4cCI6MjA1MDU1NzgxMX0.YAF4pq9AFwKpY6LGAd3AKaO5VMX1jjTy0aBvfDuPQIQ'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
