'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [role, setRole]         = useState<'doctor' | 'patient'>('doctor')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, name, role)
        setError('Account created! Please sign in.')
        setMode('login')
      } else {
        const data = await signIn(email, password)
        const userRole = data.user?.user_metadata?.role
        router.push(userRole === 'doctor' ? '/doctor/cases' : '/patient/scans')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🧠 Brain Tumour XAI</h1>
          <p className="text-gray-400">AI-powered MRI classification with explainability</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
                  ${mode === m ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  {(['doctor', 'patient'] as const).map(r => (
                    <button type="button" key={r} onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
                        ${role === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                      {r === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
                    </button>
                  ))}
                </div>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Full name" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                    text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              </>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="Email address" required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <input value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="Password" required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3
                text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            {error && (
              <p className={`text-sm ${error.includes('created') ? 'text-green-400' : 'text-red-400'}`}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                text-white font-semibold py-3 rounded-lg transition-colors">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}