'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createPatientScan, updateScanPrediction, updateScanGradcam,
    updateScanShap, updateScanLime, updateScanError } from '@/lib/scans'

const HF_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL

export default function PatientUploadPage() {
  const router = useRouter()
  const [user, setUser]             = useState<any>(null)
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [status, setStatus]         = useState('')
  const [prediction, setPrediction] = useState<any>(null)
  const [gradcam, setGradcam]       = useState<string | null>(null)
  const [shap, setShap]             = useState<string | null>(null)
  const [lime, setLime]             = useState<string | null>(null)
  const [running, setRunning]       = useState(false)

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.profile?.role !== 'patient') { router.push('/'); return }
      setUser(u)
    })
  }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setPrediction(null); setGradcam(null); setShap(null); setLime(null); setStatus('')
  }

  async function handleSubmit() {
    if (!file || !user) return
    setRunning(true)
    setPrediction(null); setGradcam(null); setShap(null); setLime(null)

    const scan = await createPatientScan(user.id)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${HF_URL}/predict`, { method: 'POST', body: formData })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const eventMatch = chunk.match(/^event: (\w+)/m)
        const dataMatch  = chunk.match(/^data: (.+)/m)
        if (!eventMatch || !dataMatch) continue
        const event = eventMatch[1]
        const data  = JSON.parse(dataMatch[1])

        if (event === 'status')     { setStatus(data.message) }
        if (event === 'prediction') {
          setPrediction(data)
          await updateScanPrediction(scan.id, data.prediction, data.confidence, data.probabilities)
        }
        if (event === 'gradcam') {
          setGradcam(data.image_b64)
          await updateScanGradcam(scan.id, data.image_b64)
        }
        if (event === 'shap') {
          setShap(data.image_b64)
          await updateScanShap(scan.id, data.image_b64)
        }
        if (event === 'lime') {
          setLime(data.image_b64)
          await updateScanLime(scan.id, data.image_b64)
          setStatus('All analyses complete.')
        }
        if (event === 'error') {
          setStatus(`Error: ${data.message}`)
          await updateScanError(scan.id, data.message)
        }
      }
    }
    setRunning(false)
  }

  const COLORS: Record<string, string> = {
    glioma: 'text-red-400', meningioma: 'text-yellow-400',
    no_tumor: 'text-green-400', pituitary: 'text-blue-400'
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">🧠 My MRI Analysis</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push('/patient/scans')}
            className="text-sm text-gray-400 hover:text-white border border-gray-700
              hover:border-gray-500 px-4 py-2 rounded-lg transition-colors">
            My Scans
          </button>
          <button onClick={() => { import('@/lib/auth').then(m => m.signOut()); router.push('/') }}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — upload */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Upload MRI Image (jpg/png)</label>
            <label className="block w-full cursor-pointer border-2 border-dashed border-gray-700
              hover:border-blue-500 rounded-xl p-6 text-center transition-colors">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {preview
                ? <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                : <p className="text-gray-500">Click to upload your MRI image</p>}
            </label>
          </div>

          <button onClick={handleSubmit} disabled={!file || running}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40
              text-white font-semibold py-3 rounded-lg transition-colors">
            {running ? 'Analysing...' : 'Run Analysis'}
          </button>

          {status && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-yellow-300">
              {running && <span className="mr-2 animate-pulse">⏳</span>}
              {status}
            </div>
          )}
        </div>

        {/* Right — results */}
        <div className="space-y-4">
          {prediction && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm text-gray-400 mb-3">Classification Result</h2>
              <p className={`text-3xl font-bold capitalize mb-1 ${COLORS[prediction.prediction]}`}>
                {prediction.prediction.replace('_', ' ')}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </p>
              <div className="space-y-2">
                {Object.entries(prediction.probabilities).map(([cls, prob]: any) => (
                  <div key={cls}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="capitalize">{cls.replace('_', ' ')}</span>
                      <span>{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full">
                      <div className="h-1.5 bg-blue-500 rounded-full"
                        style={{ width: `${prob * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {[
            { label: 'Grad-CAM', b64: gradcam },
            { label: 'SHAP',     b64: shap    },
            { label: 'LIME',     b64: lime    },
          ].map(({ label, b64 }) => b64 && (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-sm text-gray-400 mb-2">{label}</p>
              <img src={`data:image/png;base64,${b64}`} alt={label} className="w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}