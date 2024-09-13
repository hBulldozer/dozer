import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.dozer.finance'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzI1OTM3MjAwLAogICJleHAiOiAxODgzNzAzNjAwCn0.XETuyQwOXbAkWGikd9z_vrMSwF-lBBpcLkMfaJZYV0s' // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseKey)
