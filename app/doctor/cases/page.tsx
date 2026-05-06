'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { getDoctorScans } from '@/lib/scans'

const CLASS_BADGE: Record<string, string> = {
  glioma:     'text-red-400',
  meningioma: 'text-orange-400',
  no_tumor:   'text-green-400',
  pituitary:  'text-blue-400',
}
const CLASS_LABEL: Record<string, string> = {
  glioma: 'Glioma', meningioma: 'Meningioma', no_tumor: 'No Tumour', pituitary: 'Pituitary',
}

export default function DoctorCasesPage() {
  const router = useRouter()
  const [scans,   setScans]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.profile?.role !== 'doctor') { router.push('/'); return }
      getDoctorScans(u.id).then(s => { setScans(s ?? []); setLoading(false) })
    })
  }, [router])

  // Only show done scans — hide processing/error clutter
  const filtered = scans
    .filter(s => s.status === 'done')
    .filter(s => filter === 'all' || s.prediction === filter)
    .filter(s => (s.patient_name ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-teal-400">Brain Tumour XAI</span>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Doctor</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/doctor/upload" className="text-sm text-gray-400 hover:text-white">+ New Analysis</Link>
          <button onClick={() => { signOut(); router.push('/') }} className="text-sm text-gray-500 hover:text-white">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Cases</h2>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} completed scans</p>
          </div>
          <Link href="/doctor/upload" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-sm rounded-lg transition-colors">
            + New Scan
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white
                       placeholder-gray-500 focus:outline-none focus:border-teal-500" />
          <div className="flex gap-2 flex-wrap">
            {['all', 'glioma', 'meningioma', 'no_tumor', 'pituitary'].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filter === c ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                {CLASS_LABEL[c] ?? 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">No completed scans yet.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(scan => (
              <Link key={scan.id} href={`/doctor/cases/${scan.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-800
                           bg-gray-900 hover:border-gray-700 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">🧠</div>
                  <div>
                    <p className="text-sm font-medium">{scan.patient_name ?? 'Unnamed'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(scan.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${CLASS_BADGE[scan.prediction ?? ''] ?? 'text-gray-400'}`}>
                    {CLASS_LABEL[scan.prediction ?? ''] ?? scan.prediction ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scan.confidence != null ? `${(scan.confidence * 100).toFixed(1)}%` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}