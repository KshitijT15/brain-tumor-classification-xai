import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    `Missing Supabase env vars — URL: ${supabaseUrl ?? 'MISSING'}, KEY: ${supabaseAnon ? 'present' : 'MISSING'}`
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Scan {
  id:             string
  patient_id:     string | null
  doctor_id:      string | null
  uploaded_by:    string
  patient_name:   string | null
  status:         'processing' | 'done' | 'error'
  prediction:     string | null
  confidence:     number | null
  probabilities:  Record<string, number> | null
  // Storage URLs — canonical source for display & admin access
  gradcam_url:    string | null
  shap_url:       string | null
  lime_url:       string | null
  doctor_notes:   string | null
  ai_explanation: Record<string, string> | null
  error_message:  string | null
  created_at:     string
  locked_at:      string | null
}