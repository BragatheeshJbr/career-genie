import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import genieIcon from '../assets/genie-icon.png'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/analyze')
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', cursor: 'pointer' }}>
        <img src={genieIcon} alt="Career Genie" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '40px 36px' }}>

        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Welcome back</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>Sign in to your Career Genie account</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Email</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='you@example.com'
              required
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff',
                fontSize: '14px', fontFamily: 'Inter, sans-serif',
                outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(245,197,24,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='••••••••••'
              required
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff',
                fontSize: '14px', fontFamily: 'Inter, sans-serif',
                outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(245,197,24,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(245,197,24,0.4)' : 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Don't have an account?{' '}
          <span onClick={() => navigate('/signup')} style={{ color: '#f5c518', fontWeight: '700', cursor: 'pointer' }}>
            Sign up free
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login