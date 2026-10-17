import { createClient } from '@supabase/supabase-js'

// A sign-in link that failed (expired or already used) comes back with the
// error in the URL. Read it before supabase-js handles the URL.
export const linkError = new URLSearchParams(window.location.hash.slice(1)).get('error_code')

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
