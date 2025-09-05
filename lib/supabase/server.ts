import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

export function getSupabaseAdmin() {
  // no session persistence on the server
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}
