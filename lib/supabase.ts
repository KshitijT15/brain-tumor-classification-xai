import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// TEMPORARY DEBUG - remove after fixing
console.log('ENV CHECK:', { 
  url: supabaseUrl, 
  keyPresent: !!supabaseAnon 
})

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    `Missing Supabase env vars — URL: ${supabaseUrl ?? 'MISSING'}, KEY: ${supabaseAnon ? 'present' : 'MISSING'}`
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)