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
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
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
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          plan: 'free',
          analyses_count: 0
        })
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/analyze' }
    })
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          maxWidth: '420px', width: '100%', margin: '0 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', padding: '40px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Check your email!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            We sent a confirmation link to <strong style={{ color: '#f5c518' }}>{email}</strong>. Click it to activate your account.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '800', cursor: 'pointer'
            }}>
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Gradient orbs */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px',
        background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1
      }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
      </nav>

      {/* Signup Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', padding: '40px'
        }}>

          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>Create account</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
            Start your Career Genie journey for free
          </p>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', color: '#fff',
              fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Full name
            </label>
            <input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='Arjun Sharma'
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff',
                fontSize: '14px', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(245,197,24,0.4)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff',
                fontSize: '14px', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(245,197,24,0.4)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Min 6 characters'
              onKeyDown={(e) => { if (e.key === 'Enter') handleSignup() }}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#fff',
                fontSize: '14px', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(245,197,24,0.4)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13px', marginBottom: '16px'
            }}>{error}</div>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(245,197,24,0.3)' : 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}>
            {loading ? 'Creating account...' : 'Create free account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{ color: '#f5c518', cursor: 'pointer', fontWeight: '600' }}>
              Sign in
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Signup