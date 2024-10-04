import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.dozer.finance'
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzI2ODAxMjAwLAogICJleHAiOiAxODg0NTY3NjAwCn0.ubbPYatILsEymMPZaX9kqU4dko4N9tvrIU0cI5ae1FA' // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseKey)
