import { supabase } from './supabase'

export async function uploadXaiImage(
  b64: string,
  scanId: string,
  label: 'gradcam' | 'shap' | 'lime'
): Promise<string> {
  const byteChars = atob(b64)
  const byteNums  = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i)
  }
  const blob = new Blob([new Uint8Array(byteNums)], { type: 'image/png' })

  const path = `${scanId}/${label}.png`

  const { error } = await supabase.storage
    .from('xai-images')
    .upload(path, blob, { contentType: 'image/png', upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('xai-images')
    .getPublicUrl(path)

  return data.publicUrl
}