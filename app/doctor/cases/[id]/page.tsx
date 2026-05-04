'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getScanById, updateDoctorNotes } from '@/lib/scans'

export default function DoctorCaseDetailPage() {
  const router    = useRouter()
  const { id }    = useParams()
  const [scan, setScan]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u || u.profile?.role !== 'doctor') { router.push('/'); return }
      const data = await getScanById(id as string)
      setScan(data)
      setNotes(data?.doctor_notes ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await updateDoctorNotes(id as string, notes)
    setSaving(false); setSaved(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (!scan) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">Case not found.</p>
    </div>
  )

  const COLORS: Record<string, string> = {
    glioma: 'text-red-400', meningioma: 'text-yellow-400',
    no_tumor: 'text-green-400', pituitary: 'text-blue-400'
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <button onClick={() => router.push('/doctor/cases')}
        className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors">
        ← Back to My Cases
      </button>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400 mb-1">Patient</p>
            <p className="text-xl font-bold">{scan.patient_name ?? 'Unnamed'}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold capitalize ${COLORS[scan.prediction] ?? 'text-white'}`}>
              {scan.prediction?.replace('_', ' ') ?? 'Pending'}
            </p>
            {scan.confidence && (
              <p className="text-gray-400 text-sm">
                {(scan.confidence * 100).toFixed(1)}% confidence
              </p>
            )}
          </div>
        </div>
      </div>

      {/* XAI images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Grad-CAM', b64: scan.gradcam_b64 },
          { label: 'SHAP',     b64: scan.shap_b64 },
          { label: 'LIME',     b64: scan.lime_b64 },
        ].map(({ label, b64 }) => b64 && (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400 mb-2">{label}</p>
            <img src={`data:image/png;base64,${b64}`} alt={label} className="w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <label className="block text-sm text-gray-400 mb-3">
          Clinical Notes / Analysis
        </label>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          placeholder="Write your clinical analysis, observations, and recommendations..."
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
            text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
            resize-none text-sm"
        />
        <button onClick={handleSave} disabled={saving}
          className="mt-3 bg-green-700 hover:bg-green-600 disabled:opacity-50
            text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}