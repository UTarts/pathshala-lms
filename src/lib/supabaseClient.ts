import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // This prevents the app from crashing during build, but logs a warning
  console.warn('Missing Supabase Environment Variables')
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
)