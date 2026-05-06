// lib/grok.ts
// Uses Groq API (groq.com) — free tier, fast inference with Llama models.
// Generates a patient-friendly explanation and stores it in Supabase.

import { supabase } from './supabase'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'   // free, fast, high quality

// ── Types ────────────────────────────────────────────────────────────────────
export interface GrokExplanation {
  what_is_it:  string
  causes:      string
  symptoms:    string
  precautions: string
  disclaimer:  string
  xai_note:    string
}

// ── Main function ─────────────────────────────────────────────────────────────
export async function generateAndStoreScanExplanation(
  scanId:     string,
  prediction: string,
  confidence: number
): Promise<GrokExplanation> {

  // 1. Return cached result if already generated
  const { data: existing, error: fetchError } = await supabase
    .from('scans')
    .select('ai_explanation')
    .eq('id', scanId)
    .single()

  if (fetchError) {
    throw new Error(`Supabase fetch error: ${fetchError.message}`)
  }

  if (existing?.ai_explanation) {
    return existing.ai_explanation as GrokExplanation
  }

  // 2. Check API key
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  if (!apiKey) {
    throw new Error(
      'NEXT_PUBLIC_GROQ_API_KEY is not set. Get a free key at console.groq.com and add it to .env.local'
    )
  }

  // 3. Build prompt
  const humanLabel =
    prediction === 'no_tumor'
      ? 'No Tumour Detected'
      : prediction.charAt(0).toUpperCase() + prediction.slice(1)

  const prompt = `You are a compassionate medical AI assistant. A patient just received an MRI brain scan result from an AI classification system.

Result: ${humanLabel} (confidence: ${(confidence * 100).toFixed(1)}%)

Generate a structured, patient-friendly explanation as a JSON object with EXACTLY these keys:
{
  "what_is_it":  "2-3 sentence plain-English explanation of this condition, or reassurance if no tumour detected",
  "causes":      "3-4 bullet points of common causes or risk factors. Use bullet character •",
  "symptoms":    "3-4 bullet points of typical symptoms to watch for. Use bullet character •",
  "precautions": "3-4 actionable next steps the patient should take. Use bullet character •",
  "disclaimer":  "This AI result is for informational purposes only and does not constitute a medical diagnosis. Please consult a qualified neurologist or radiologist for confirmation and treatment.",
  "xai_note":    "The highlighted regions in Grad-CAM, SHAP, and LIME images do NOT directly mark your tumour location. They show which areas of the MRI scan the AI model paid most attention to while making its decision — this helps researchers understand the model's reasoning, not pinpoint the lesion."
}

Rules:
- Use plain language a non-medical person can understand
- Keep each field concise (max 60 words per field)
- Output ONLY the raw JSON object — no markdown, no code fences, no explanation before or after`

  // 4. Call Groq API (OpenAI-compatible format)
  let res: Response
  try {
    res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.3,
        max_tokens:  800,
        messages: [
          {
            role:    'system',
            content: 'You are a medical AI assistant. Always respond with valid JSON only, no markdown, no extra text.',
          },
          {
            role:    'user',
            content: prompt,
          },
        ],
      }),
    })
  } catch (networkErr: any) {
    throw new Error(`Network error calling Groq API: ${networkErr.message}`)
  }

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API returned ${res.status}: ${errText}`)
  }

  const json = await res.json()
  const raw  = json?.choices?.[0]?.message?.content ?? ''

  if (!raw) {
    throw new Error('Groq API returned an empty response')
  }

  // 5. Parse JSON — strip any accidental markdown fences
  let explanation: GrokExplanation
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    explanation = JSON.parse(clean)
  } catch (parseErr: any) {
    throw new Error(`Failed to parse Groq response as JSON: ${raw.slice(0, 200)}`)
  }

  // 6. Persist to Supabase
  const { error: updateError } = await supabase
    .from('scans')
    .update({ ai_explanation: explanation })
    .eq('id', scanId)

  if (updateError) {
    throw new Error(`Supabase update error: ${updateError.message}`)
  }

  return explanation
}