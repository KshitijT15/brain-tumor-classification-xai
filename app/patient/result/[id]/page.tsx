'use client'
// app/patient/result/[id]/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getScanById } from '@/lib/scans'
import { getCurrentUser, signOut } from '@/lib/auth'
import { ResultCard } from '@/components/xai/ResultCard'
import ExplanationCard from '@/components/xai/ExplanationCard'
import type { Scan } from '@/lib/supabase'

const XAI_INFO = {
  gradcam: {
    label:  'Grad-CAM',
    colour: 'teal',
    desc:   'Red/yellow areas show which regions the AI focused on when making its prediction.',
  },
  shap: {
    label:  'SHAP',
    colour: 'purple',
    desc:   'Red dots pushed the AI toward this diagnosis. Blue dots pushed against it.',
  },
  lime: {
    label:  'LIME',
    colour: 'amber',
    desc:   "Green highlighted areas are the regions that most supported the AI's decision.",
  },
}

function XAICard({ url, b64, type }: {
  url:  string | null
  b64?: string | null
  type: keyof typeof XAI_INFO
}) {
  const info  = XAI_INFO[type]
  const ring  = {
    teal:   'border-teal-500/20 bg-teal-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    amber:  'border-amber-500/20 bg-amber-500/5',
  }[info.colour]
  const badge = {
    teal:   'bg-teal-500/10 text-teal-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber:  'bg-amber-500/10 text-amber-400',
  }[info.colour]

  // prefer storage URL, fall back to base64 for older records
  const src = url ? url : b64 ? `data:image/png;base64,${b64}` : null

  return (
    <div className={`rounded-xl border ${ring} p-4 space-y-3`}>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
        {info.label}
      </span>

      {/* ── Wide box, object-contain so matplotlib side-by-side is never cropped ── */}
      <div className="w-full rounded-lg overflow-hidden bg-black">
        {src ? (
          <img
            src={src}
            alt={info.label}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs text-gray-600">Not available</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{info.desc}</p>
    </div>
  )
}

export default function PatientResultPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id as string

  const [scan,    setScan]    = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    getCurrentUser().then(u => { if (!u) { router.push('/'); return } })
    if (id) {
      getScanById(id).then(s => {
        if (!s) setDenied(true)
        setScan(s)
        setLoading(false)
      })
    }
  }, [id, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-700 border-t-purple-400 rounded-full animate-spin" />
    </div>
  )

  if (denied || !scan) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-gray-400">Scan not found or access denied.</p>
      <Link href="/patient/scans" className="text-sm text-purple-400 hover:underline">
        ← Back to my scans
      </Link>
    </div>
  )

  // parse probabilities — handles both object and JSON string from Supabase
  let probs: Record<string, number> = {}
  if (scan.probabilities) {
    probs = typeof scan.probabilities === 'string'
      ? JSON.parse(scan.probabilities)
      : scan.probabilities as Record<string, number>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-purple-400">Brain Tumour XAI</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Patient</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/patient/scans" className="text-sm text-gray-400 hover:text-white">
            ← My Scans
          </Link>
          <button
            onClick={() => { signOut(); router.push('/') }}
            className="text-sm text-gray-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Title ── */}
        <div>
          <h2 className="text-xl font-semibold">Scan Result</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(scan.created_at).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* ── 1. Classification result card ── */}
        {scan.prediction && scan.confidence != null && (
          <ResultCard
            predictedClass={scan.prediction}
            confidence={scan.confidence}
            probabilities={probs}
          />
        )}

        {/* ── 2. XAI visualisations ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">What the AI found</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Three different techniques explain which parts of your MRI scan drove the AI's decision.
            </p>
          </div>

          {/* Stack on mobile, 3-col on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <XAICard
              url={scan.gradcam_url ?? null}
              b64={(scan as any).gradcam_b64 ?? null}
              type="gradcam"
            />
            <XAICard
              url={scan.shap_url ?? null}
              b64={(scan as any).shap_b64 ?? null}
              type="shap"
            />
            <XAICard
              url={scan.lime_url ?? null}
              b64={(scan as any).lime_b64 ?? null}
              type="lime"
            />
          </div>
        </div>

        {/* ── 3. Grok AI plain-language explanation ── */}
        {scan.status === 'done' && scan.prediction && scan.confidence != null && (
          <ExplanationCard
            scanId={scan.id}
            prediction={scan.prediction}
            confidence={scan.confidence}
          />
        )}

        {/* ── 4. Doctor notes (if written) ── */}
        {scan.doctor_notes && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              👨‍⚕️ Doctor's Notes
            </p>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {scan.doctor_notes}
            </p>
          </div>
        )}

        {/* ── 5. Medical disclaimer ── */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
          <p className="text-xs text-amber-400/70">
            <strong className="text-amber-400">Medical disclaimer:</strong> This AI analysis is
            for research and educational purposes only. Always consult a qualified radiologist
            or neurologist.
          </p>
        </div>

      </div>
    </div>
  )
}