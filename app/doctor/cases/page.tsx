'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getDoctorScans } from '@/lib/scans'

export default function DoctorCasesPage() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [scans, setScans]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u || u.profile?.role !== 'doctor') { router.push('/'); return }
      setUser(u)
      const data = await getDoctorScans(u.id)
      setScans(data ?? [])
      setLoading(false)
    })
  }, [])

  const STATUS_COLOR: Record<string, string> = {
    done: 'text-green-400', processing: 'text-yellow-400',
    error: 'text-red-400',  pending: 'text-gray-400'
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">📋 My Cases</h1>
          {user && <p className="text-sm text-gray-400 mt-1">Dr. {user.profile?.name}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/doctor/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm
              font-medium px-4 py-2 rounded-lg transition-colors">
            + New Scan
          </button>
          <button onClick={() => { import('@/lib/auth').then(m => m.signOut()); router.push('/') }}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p>
      : scans.length === 0
        ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No cases yet.</p>
            <button onClick={() => router.push('/doctor/upload')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Run your first analysis
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map(scan => (
              <div key={scan.id}
                onClick={() => router.push(`/doctor/case/${scan.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4
                  cursor-pointer hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {scan.patient_name ?? 'Unnamed patient'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(scan.created_at).toLocaleString()}
                    </p>
                    {scan.doctor_notes && (
                      <p className="text-xs text-green-400 mt-1">✓ Notes saved</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold capitalize ${STATUS_COLOR[scan.status]}`}>
                      {scan.prediction?.replace('_', ' ') ?? scan.status}
                    </p>
                    {scan.confidence && (
                      <p className="text-sm text-gray-400">
                        {(scan.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}