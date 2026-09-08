import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../useAuth'
import genieIcon from '../assets/genie-icon.png'

function Dashboard() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    fetchAnalyses()
  }, [user, authLoading])

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setAnalyses(data)
        if (data.length > 0) {
          const avgMatch = Math.round(data.reduce((a, b) => a + b.match_score, 0) / data.length)
          const avgAts = Math.round(data.reduce((a, b) => a + b.ats_score, 0) / data.length)
          const best = data.reduce((a, b) => a.match_score > b.match_score ? a : b)
          const allMissing = data.flatMap(a => a.missing_keywords || [])
          const freq = {}
          allMissing.forEach(k => { freq[k] = (freq[k] || 0) + 1 })
          const topMissing = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0])
          setStats({ avgMatch, avgAts, best, topMissing, total: data.length })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (val) => val >= 75 ? '#22c55e' : val >= 50 ? '#f5c518' : '#ef4444'

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#05050a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Loading...</p>
    </div>
  )

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .db-nav { padding: 14px 20px !important; }
          .db-main { padding: 24px 16px !important; }
          .db-stats { grid-template-columns: 1fr 1fr !important; }
          .db-h1 { font-size: 28px !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav className="db-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px', background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>
            New analysis
          </button>
          <button onClick={() => navigate('/jobs')} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
            Job Finder
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '9px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5c518, #e8a200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#000' }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{user.email.split('@')[0]}</span>
          </div>
          <button onClick={async () => { await signOut(); navigate('/') }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="db-main" style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 className="db-h1" style={{
            fontSize: '36px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '8px',
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Your dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            Track your resume progress and see how you've improved over time.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Loading your history...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>No analyses yet</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '28px', fontSize: '15px' }}>
              Analyze your first resume to start tracking your progress
            </p>
            <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '14px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
              Analyze my resume
            </button>
          </div>
        ) : (
          <div>
            {/* Stats */}
            {stats && (
              <div className="db-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Total analyses', value: stats.total, color: '#fff', sub: 'all time' },
                  { label: 'Avg match score', value: `${stats.avgMatch}%`, color: scoreColor(stats.avgMatch), sub: 'across all roles' },
                  { label: 'Avg ATS score', value: `${stats.avgAts}%`, color: scoreColor(stats.avgAts), sub: 'formatting health' },
                  { label: 'Best match', value: `${stats.best.match_score}%`, color: '#22c55e', sub: stats.best.job_title?.substring(0, 20) || 'Your top result' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: s.color, letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Most missing keywords */}
            {stats && stats.topMissing.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#f87171', letterSpacing: '1px', marginBottom: '12px' }}>
                  🔴 MOST COMMONLY MISSING — SKILLS TO PRIORITISE
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {stats.topMissing.map((k, i) => (
                    <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>✗ {k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* History list */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>Analysis history</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analyses.map((a, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                        {a.job_title || 'Resume analysis'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{formatDate(a.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Match', value: a.match_score },
                        { label: 'ATS', value: a.ats_score },
                      ].map((s, j) => (
                        <div key={j} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: '900', color: scoreColor(s.value), letterSpacing: '-0.5px' }}>{s.value}%</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                        </div>
                      ))}
                      {a.missing_keywords && a.missing_keywords.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {a.missing_keywords.slice(0, 3).map((k, ki) => (
                            <span key={ki} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>✗ {k}</span>
                          ))}
                          {a.missing_keywords.length > 3 && (
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>+{a.missing_keywords.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '14px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                + New analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard