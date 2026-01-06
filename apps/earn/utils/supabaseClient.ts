import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.dozer.finance'
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzMwODYyMDAwLAogICJleHAiOiAxODg4NjI4NDAwCn0.3YXtYh8-q3Z1k_cMhgGPtuKnEZzzPVTlF-VTFanwSKk'

export const supabase = createClient(supabaseUrl, supabaseKey)
