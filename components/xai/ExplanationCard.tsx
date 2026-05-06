'use client'
// components/xai/ExplanationCard.tsx

import { useEffect, useState } from 'react'
import { generateAndStoreScanExplanation, GrokExplanation } from '@/lib/grok'

interface Props {
  scanId:     string
  prediction: string
  confidence: number
}

const SECTION_ICONS: Record<keyof GrokExplanation, string> = {
  what_is_it:  '🔬',
  causes:      '⚠️',
  symptoms:    '🩺',
  precautions: '✅',
  disclaimer:  '⚖️',
  xai_note:    '🧩',
}

const SECTION_LABELS: Record<keyof GrokExplanation, string> = {
  what_is_it:  'What is this?',
  causes:      'Possible Causes & Risk Factors',
  symptoms:    'Symptoms to Watch For',
  precautions: 'Recommended Next Steps',
  disclaimer:  'Medical Disclaimer',
  xai_note:    'About the Highlighted Images (Grad-CAM / SHAP / LIME)',
}

const SECTION_COLORS: Record<keyof GrokExplanation, string> = {
  what_is_it:  'border-blue-500/20 bg-blue-500/5',
  causes:      'border-orange-500/20 bg-orange-500/5',
  symptoms:    'border-red-500/20 bg-red-500/5',
  precautions: 'border-green-500/20 bg-green-500/5',
  disclaimer:  'border-amber-500/20 bg-amber-500/5',
  xai_note:    'border-purple-500/20 bg-purple-500/5',
}

const SECTION_LABEL_COLORS: Record<keyof GrokExplanation, string> = {
  what_is_it:  'text-blue-400',
  causes:      'text-orange-400',
  symptoms:    'text-red-400',
  precautions: 'text-green-400',
  disclaimer:  'text-amber-400',
  xai_note:    'text-purple-400',
}

const DISPLAY_ORDER: (keyof GrokExplanation)[] = [
  'what_is_it', 'causes', 'symptoms', 'precautions', 'xai_note', 'disclaimer',
]

// Render bullet strings (uses • as separator) as a list
function BulletText({ text }: { text: string }) {
  if (!text) return null
  const hasBullets = text.includes('•')
  if (!hasBullets) {
    return <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
  }
  const items = text.split('•').map(s => s.trim()).filter(Boolean)
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-300 leading-relaxed flex gap-2">
          <span className="text-gray-500 mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ExplanationCard({ scanId, prediction, confidence }: Props) {
  const [explanation, setExplanation] = useState<GrokExplanation | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!scanId || !prediction) {
      setLoading(false)
      setError('Missing scan ID or prediction — cannot generate explanation.')
      return
    }

    generateAndStoreScanExplanation(scanId, prediction, confidence)
      .then(data => {
        setExplanation(data)
      })
      .catch(err => {
        console.error('[ExplanationCard] Error:', err)
        setError(err?.message ?? 'Unknown error generating explanation.')
      })
      .finally(() => setLoading(false))
  }, [scanId, prediction, confidence])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-48" />
      <div className="h-3 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-5/6" />
      <div className="h-3 bg-gray-800 rounded w-4/6" />
      <p className="text-xs text-gray-600 pt-2">Generating AI explanation via Groq…</p>
    </div>
  )

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="rounded-2xl border border-red-900/50 bg-red-900/10 p-5 space-y-2">
      <p className="text-sm font-semibold text-red-400">⚠️ Could not load AI explanation</p>
      <p className="text-xs text-red-300/80 font-mono break-all">{error}</p>
      <p className="text-xs text-gray-500 mt-2">
        Check that <code className="text-red-300">NEXT_PUBLIC_GROQ_API_KEY</code> is set in{' '}
        <code className="text-red-300">.env.local</code> and restart your dev server.
      </p>
    </div>
  )

  if (!explanation) return null

  // ── Explanation cards ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🤖</span> AI Explanation
        </h3>
        <p className="text-sm text-gray-400 mt-0.5">
          Plain-language summary powered by Groq.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {DISPLAY_ORDER.map(key => (
          <div key={key} className={`rounded-xl border ${SECTION_COLORS[key]} p-4 space-y-2`}>
            <div className="flex items-center gap-2">
              <span>{SECTION_ICONS[key]}</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${SECTION_LABEL_COLORS[key]}`}>
                {SECTION_LABELS[key]}
              </span>
            </div>
            <BulletText text={explanation[key]} />
          </div>
        ))}
      </div>
    </div>
  )
}