import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Plane, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [tab, setTab]               = useState('login')

  // Register fields
  const [regUser,  setRegUser]  = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass,  setRegPass]  = useState('')
  const [regRole,  setRegRole]  = useState('OPERATOR')

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await register(regUser, regPass, regEmail, regRole)
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-3xl" />
      </div>

      {/* Runway lines decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-indigo-800/20 to-transparent" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-900/60 mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">AeroOps</h1>
          <p className="text-gray-500 text-sm mt-1">Airport Ground Operations System</p>
        </div>

        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors capitalize
                  ${tab === t
                    ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
                    : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800/40 rounded-lg text-red-400 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input className="input" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username" required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input className="input pr-10" type={showPass ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password" required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
                  {loading ? <Spinner size="sm" /> : 'Sign In'}
                </button>
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-xs text-gray-600">
                    First time here? Use the Register tab to create an account, then sign in.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input className="input" value={regUser} onChange={e => setRegUser(e.target.value)}
                    placeholder="Choose a username" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="your@email.com" required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={regPass} onChange={e => setRegPass(e.target.value)}
                    placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="select" value={regRole} onChange={e => setRegRole(e.target.value)}>
                    <option value="OPERATOR">Operator (View only)</option>
                    <option value="STAFF">Staff (Read + Write)</option>
                    <option value="ADMIN">Admin (Full access)</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
                  {loading ? <Spinner size="sm" /> : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Airport Ground Operations Management System v1.0
        </p>
      </div>
    </div>
  )
}
