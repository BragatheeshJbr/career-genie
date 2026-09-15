import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import genieIcon from '../assets/genie-icon.png'

function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) throw error

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          "full name": fullName,
          plan: 'free',
          analyses_today: 0,
          last_analysis_date: null,
          trial_started_at: new Date().toISOString()
        }, { onConflict: 'id' })
      }

      navigate('/analyze')

    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
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

        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Create your account</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
          Free to start — no credit card needed
        </p>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Full name</label>
            <input
              type='text'
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder='Your full name'
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
              placeholder='Min 6 characters'
              required
              minLength={6}
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
            {loading ? 'Creating account...' : 'Create free account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: '#f5c518', fontWeight: '700', cursor: 'pointer' }}>
            Sign in
          </span>
        </p>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.2)', lineHeight: '1.5' }}>
          By signing up you agree to our terms of service.
          No spam, no credit card required.
        </p>
      </div>
    </div>
  )
}

export default Signup