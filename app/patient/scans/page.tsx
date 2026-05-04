'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPatientScans } from '@/lib/scans'

export default function PatientScansPage() {
  const router = useRouter()
  const [scans, setScans]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u || u.profile?.role !== 'patient') { router.push('/'); return }
      const data = await getPatientScans(u.id)
      setScans(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">🧾 My Scans</h1>
        <button onClick={() => router.push('/patient/upload')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm
            font-medium px-4 py-2 rounded-lg transition-colors">
          + New Scan
        </button>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p>
      : scans.length === 0
        ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No scans yet.</p>
            <button onClick={() => router.push('/patient/upload')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Upload your first MRI
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map(scan => (
              <div key={scan.id}
                onClick={() => router.push(`/patient/result/${scan.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4
                  cursor-pointer hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">
                      {new Date(scan.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <p className="font-semibold capitalize mt-1">
                      {scan.prediction?.replace('_', ' ') ?? 'Processing...'}
                    </p>
                    {scan.doctor_notes && (
                      <p className="text-xs text-green-400 mt-1">✓ Doctor notes available</p>
                    )}
                  </div>
                  {scan.confidence && (
                    <p className="text-blue-400 font-medium">
                      {(scan.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}