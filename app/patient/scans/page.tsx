'use client'
// app/patient/scans/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPatientScans } from '@/lib/scans'          // ← was getMyScans
import { getCurrentUser, signOut } from '@/lib/auth'   // ← was getProfile
import type { Scan } from '@/lib/supabase'

const CLASS_BADGE: Record<string, string> = {
  glioma:     'bg-red-500/10 text-red-400 border-red-500/20',
  meningioma: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  no_tumor:   'bg-green-500/10 text-green-400 border-green-500/20',
  pituitary:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
}
const CLASS_LABEL: Record<string, string> = {
  glioma: 'Glioma', meningioma: 'Meningioma', no_tumor: 'No Tumour', pituitary: 'Pituitary',
}

export default function PatientScansPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [scans,    setScans]    = useState<Scan[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.profile?.role !== 'patient') { router.push('/'); return }
      setUserName(u.profile?.name ?? '')
      getPatientScans(u.id).then(s => {
        setScans((s ?? []).filter((sc: Scan) => sc.status === 'done'))
        setLoading(false)
      })
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-purple-400">Brain Tumour XAI</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Patient</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/patient/upload"
            className="text-sm text-gray-400 hover:text-white border border-gray-700
              hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
            + New Scan
          </Link>
          <button onClick={() => { signOut(); router.push('/') }}
            className="text-sm text-gray-500 hover:text-white">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">My Scans</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {userName ? `Welcome, ${userName}` : 'Your MRI analysis history.'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-600">Loading your scans…</div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No completed scans yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              Upload your MRI scan to get an AI analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map(scan => (
              <Link key={scan.id} href={`/patient/result/${scan.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-800
                           bg-gray-900 hover:border-gray-700 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">🧠</div>
                  <div>
                    <p className="text-sm font-medium">MRI Scan Analysis</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(scan.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs border
                    ${CLASS_BADGE[scan.prediction ?? ''] ?? 'border-gray-700 text-gray-400'}`}>
                    {CLASS_LABEL[scan.prediction ?? ''] ?? scan.prediction ?? '—'}
                  </span>
                  <span className="text-gray-600 text-xs group-hover:text-gray-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}