'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getScanById } from '@/lib/scans'

export default function ResultPage() {
  const router    = useRouter()
  const { id }    = useParams()
  const [scan, setScan]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push('/'); return }
      const data = await getScanById(id as string)
      setScan(data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (!scan) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">Scan not found.</p>
    </div>
  )

  const COLORS: Record<string, string> = {
    glioma: 'text-red-400', meningioma: 'text-yellow-400',
    no_tumor: 'text-green-400', pituitary: 'text-blue-400'
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()}
        className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors">
        ← Back
      </button>

      {/* Prediction */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
        <p className="text-sm text-gray-400 mb-1">Diagnosis Result</p>
        <p className={`text-3xl font-bold capitalize mb-1 ${COLORS[scan.prediction] ?? 'text-white'}`}>
          {scan.prediction?.replace('_', ' ') ?? 'Pending'}
        </p>
        {scan.confidence && (
          <p className="text-gray-400">Confidence: {(scan.confidence * 100).toFixed(1)}%</p>
        )}
        <p className="text-xs text-gray-500 mt-3">
          {new Date(scan.created_at).toLocaleString()}
        </p>
      </div>

      {/* Doctor notes */}
      {scan.doctor_notes && (
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-6 mb-4">
          <p className="text-sm text-green-400 mb-2">👨‍⚕️ Doctor's Analysis</p>
          <p className="text-white text-sm leading-relaxed">{scan.doctor_notes}</p>
        </div>
      )}

      {/* XAI images */}
      {[
        { label: 'Grad-CAM Heatmap', b64: scan.gradcam_b64 },
        { label: 'SHAP Attribution', b64: scan.shap_b64 },
        { label: 'LIME Explanation', b64: scan.lime_b64 },
      ].map(({ label, b64 }) => b64 && (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
          <p className="text-sm text-gray-400 mb-3">{label}</p>
          <img src={`data:image/png;base64,${b64}`} alt={label} className="w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}