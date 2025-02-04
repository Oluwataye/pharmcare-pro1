import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase-types'

const supabaseUrl = 'https://vjaizhmyacnyyouiuszd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqYWl6aG15YWNueXlvdWl1c3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg0NTQ0MDAsImV4cCI6MjAyNDAzMDQwMH0.HxweLnJx-0_8SgQj-3vRmKQI9-SQPthkZxDsPypCZKw'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)