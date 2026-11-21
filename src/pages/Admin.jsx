import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../useAuth'
import genieIcon from '../assets/genie-icon.png'

const ADMIN_EMAIL = 'bragatheeshj@gmail.com'

function Admin() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: profiles } = await supabase.from('profiles').select('*')
      const { data: analyses } = await supabase.from('analyses').select('*')
      const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      const { data: apiUsage } = await supabase.from('api_usage').select('*')

      const totalUsers = profiles?.length || 0
      const activeToday = profiles?.filter(p => p.last_analysis_date === today).length || 0
      const newToday = profiles?.filter(p => p.created_at?.startsWith(today)).length || 0
      const analysesToday = analyses?.filter(a => a.created_at?.startsWith(today)).length || 0

      const paymentEvents = events?.filter(e => e.event_name === 'payment_job_search') || []
      const totalRevenue = paymentEvents.reduce((sum, e) => sum + (e.event_data?.amount || 0), 0)
      const rev19 = paymentEvents.filter(e => e.event_data?.amount === 19).length
      const rev29 = paymentEvents.filter(e => e.event_data?.amount === 29).length
      const rev39 = paymentEvents.filter(e => e.event_data?.amount === 39).length

      const featureCounts = {}
      events?.forEach(e => {
        if (e.event_name?.startsWith('tab_') || ['job_search_broad','job_search_smart','job_search_direct','cover_letter','roadmap','interview'].includes(e.event_name)) {
          featureCounts[e.event_name] = (featureCounts[e.event_name] || 0) + 1
        }
      })

      const recentSignups = profiles?.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5) || []

      setStats({
        totalUsers, activeToday, newToday, analysesToday,
        totalRevenue, rev19, rev29, rev39,
        apiUsage: apiUsage || [],
        featureCounts,
        recentEvents: events?.slice(0, 10) || [],
        recentSignups
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.email !== ADMIN_EMAIL) return null

  const API_LIMITS = { groq: 14400, adzuna: 250, jsearch: 200, jobspipe: 500 }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '15px', fontWeight: '800' }}>Admin Panel</span>
          <span style={{ fontSize: '11px', background: 'rgba(245,197,24,0.15)', color: '#f5c518', border: '1px solid rgba(245,197,24,0.3)', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>PRIVATE</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchStats} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>↻ Refresh</button>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</div>
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#f87171' }}>Failed to load data</div>
        ) : (
          <>
            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, color: '#f5c518' },
                { label: 'Active Today', value: stats.activeToday, color: '#22c55e' },
                { label: 'New Today', value: stats.newToday, color: '#a78bfa' },
                { label: 'Analyses Today', value: stats.analysesToday, color: '#38bdf8' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue */}
            <div style={{ background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#f5c518', letterSpacing: '1px', marginBottom: '16px' }}>💰 REVENUE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#f5c518' }}>₹{stats.totalRevenue}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total collected</div>
                </div>
                {[
                  { label: '🌐 Broad (₹19)', count: stats.rev19, amount: stats.rev19 * 19 },
                  { label: '🔍 Smart (₹29)', count: stats.rev29, amount: stats.rev29 * 29 },
                  { label: '🎯 Direct (₹39)', count: stats.rev39, amount: stats.rev39 * 39 },
                ].map((r, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>₹{r.amount}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{r.label} × {r.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Usage */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', marginBottom: '16px' }}>⚡ API USAGE (ALL TIME)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {['groq', 'adzuna', 'jsearch', 'jobspipe'].map(api => {
                  const usage = stats.apiUsage.find(u => u.api_name === api)
                  const calls = usage?.total_calls || 0
                  const limit = API_LIMITS[api]
                  const pct = Math.min((calls / limit) * 100, 100)
                  const warn = pct >= 80
                  return (
                    <div key={api} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: warn ? '#f87171' : '#fff', textTransform: 'uppercase' }}>{api}</span>
                        <span style={{ fontSize: '12px', color: warn ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{calls} / {limit}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: warn ? '#ef4444' : '#22c55e', transition: 'width 0.3s' }} />
                      </div>
                      {warn && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ Near limit</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent signups + Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', marginBottom: '16px' }}>👤 RECENT SIGNUPS</div>
                {stats.recentSignups.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{p.email}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{p['full name'] || p.full_name || '—'}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', marginBottom: '16px' }}>🔔 RECENT ACTIVITY</div>
                {stats.recentEvents.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{e.event_name}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Admin