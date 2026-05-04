import { supabase } from './supabase'

// ── Doctor creates a scan with manually entered patient name ──────────────────
export async function createDoctorScan(doctorId: string, patientName: string) {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      doctor_id:    doctorId,
      patient_name: patientName,
      uploaded_by:  doctorId,
      status:       'processing'
    })
    .select().single()
  if (error) throw error
  return data
}

// ── Patient creates a scan for themselves ─────────────────────────────────────
export async function createPatientScan(patientId: string) {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      patient_id:  patientId,
      uploaded_by: patientId,
      status:      'processing'
    })
    .select().single()
  if (error) throw error
  return data
}

// ── Update functions (shared) ─────────────────────────────────────────────────
export async function updateScanPrediction(
  scanId: string, prediction: string,
  confidence: number, probabilities: object
) {
  const { error } = await supabase.from('scans')
    .update({ prediction, confidence, probabilities }).eq('id', scanId)
  if (error) throw error
}

export async function updateScanGradcam(scanId: string, gradcam_b64: string) {
  const { error } = await supabase.from('scans')
    .update({ gradcam_b64 }).eq('id', scanId)
  if (error) throw error
}

export async function updateScanShap(scanId: string, shap_b64: string) {
  const { error } = await supabase.from('scans')
    .update({ shap_b64 }).eq('id', scanId)
  if (error) throw error
}

export async function updateScanLime(scanId: string, lime_b64: string) {
  const { error } = await supabase.from('scans')
    .update({ lime_b64, status: 'done' }).eq('id', scanId)
  if (error) throw error
}

export async function updateScanError(scanId: string, message: string) {
  const { error } = await supabase.from('scans')
    .update({ status: 'error', error_message: message }).eq('id', scanId)
  if (error) throw error
}

export async function updateDoctorNotes(scanId: string, notes: string) {
  const { error } = await supabase.from('scans')
    .update({ doctor_notes: notes }).eq('id', scanId)
  if (error) throw error
}

// ── Doctor: fetch only HIS scans ──────────────────────────────────────────────
export async function getDoctorScans(doctorId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Patient: fetch only THEIR scans ──────────────────────────────────────────
export async function getPatientScans(patientId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Fetch single scan ─────────────────────────────────────────────────────────
export async function getScanById(scanId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single()
  if (error) throw error
  return data
}