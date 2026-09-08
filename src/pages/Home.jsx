import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useAuth } from '../useAuth'
import genieIcon from '../assets/genie-icon.png'

function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1
    }))

    let animId
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,197,24,${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  const features = [
    {
      icon: '🎯',
      title: 'Match score',
      desc: 'See exactly how aligned your resume is with the job — with a clear percentage and reasoning.'
    },
    {
      icon: '🛡️',
      title: 'ATS audit',
      desc: 'Find formatting issues, missing keywords and structural problems before a recruiter even sees it.'
    },
    {
      icon: '✍️',
      title: 'AI rewrite',
      desc: 'Get your bullet points rewritten with action verbs, numbers and job-specific language.'
    },
    {
      icon: '📅',
      title: '4 week roadmap',
      desc: 'A personalised week-by-week plan to close the gap between where you are and where you need to be.'
    },
    {
      icon: '🔍',
      title: 'Job finder',
      desc: 'Search across Indian job portals and MNC hiring systems — filtered to your actual profile.'
    },
    {
      icon: '📄',
      title: 'Full rewrite',
      desc: 'Rewrite your entire resume to match a specific role, then download it as a clean PDF.'
    },
  ]

  const honest = [
    {
      q: 'Does this guarantee I get a job?',
      a: 'No. We help you put your best foot forward — but getting a job depends on many factors beyond a resume. What we can do is make sure your resume is not the reason you get filtered out.'
    },
    {
      q: 'Is the AI perfect?',
      a: 'No AI is. The analysis is based on pattern matching between your resume and the JD. Always review the suggestions — you know your experience better than any algorithm.'
    },
    {
      q: 'Why did you build this?',
      a: 'The Indian job market is brutal for freshers right now. Campus placements are shrinking. Off-campus is opaque. We built this because we believe a good resume should not be a privilege — it should be accessible to everyone.'
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', overflow: 'hidden' }}>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.25s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.4s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.55s; opacity: 0; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(245,197,24,0.25) !important; background: rgba(245,197,24,0.04) !important; }
        .feature-card { transition: all 0.25s ease; }
        .cta-btn:hover { transform: scale(1.02); box-shadow: 0 0 60px rgba(245,197,24,0.4) !important; }
        .cta-btn { transition: all 0.2s ease; }
        .nav-btn:hover { color: #fff !important; }
        @media (max-width: 768px) {
          .hero-title { font-size: 42px !important; letter-spacing: -2px !important; }
          .hero-sub { font-size: 16px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .honest-grid { grid-template-columns: 1fr !important; }
          .nav-inner { padding: 14px 20px !important; }
          .hero-inner { padding: 80px 20px 60px !important; }
          .section-inner { padding: 0 20px 80px !important; }
          .cta-inner { padding: 48px 24px !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .genie-float { width: 160px !important; height: 160px !important; }
        }
      `}</style>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.5
      }} />

      {/* 3D orbs */}
      <div style={{
        position: 'fixed', top: '-300px', left: '-200px',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(245,197,24,0.15) 0%, rgba(245,197,24,0.05) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'fixed', bottom: '-300px', right: '-200px',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 60%, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        filter: 'blur(30px)'
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.75)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="nav-inner" style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={genieIcon} alt="Career Genie" style={{
              width: '36px', height: '36px', borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'center top'
            }} />
            <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Career Genie
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="nav-btn" onClick={() => navigate('/pricing')} style={{
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              border: 'none', padding: '8px 16px',
              cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s'
            }}>Pricing</button>
            <button onClick={() => navigate('/jobs')} style={{
              background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.3)', padding: '9px 18px',
              borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700'
            }}>Job finder</button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '7px 14px', borderRadius: '9px'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f5c518, #e8a200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', color: '#000'
                  }}>{user.email[0].toUpperCase()}</div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                    {user.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={async () => { await signOut(); navigate('/') }} style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '8px 14px', borderRadius: '9px',
                  cursor: 'pointer', fontSize: '13px'
                }}>Sign out</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigate('/login')} style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '9px 18px', borderRadius: '9px',
                  cursor: 'pointer', fontSize: '14px'
                }}>Sign in</button>
                <button onClick={() => navigate('/analyze')} style={{
                  background: 'linear-gradient(135deg, #f5c518, #e8a200)',
                  color: '#000', border: 'none',
                  padding: '9px 20px', borderRadius: '9px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '800'
                }}>Try free</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-inner" style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1100px', margin: '0 auto',
        padding: '100px 40px 80px',
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: '60px', alignItems: 'center'
      }}>
        <div>
          {/* Honest badge */}
          <div className="fade-up fade-up-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: '13px',
            padding: '7px 16px', borderRadius: '20px', marginBottom: '32px'
          }}>
            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Built for off-campus placements in a tough market
          </div>

          <h1 className="hero-title fade-up fade-up-2" style={{
            fontSize: '64px', fontWeight: '900',
            lineHeight: '1.0', letterSpacing: '-3px',
            marginBottom: '24px'
          }}>
            <span style={{
              background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Your resume<br />deserves a<br /></span>
            <span style={{
              background: 'linear-gradient(135deg, #f5c518 0%, #ff8c00 60%, #e8a200 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>fair shot.</span>
          </h1>

          <p className="hero-sub fade-up fade-up-3" style={{
            fontSize: '18px', color: 'rgba(255,255,255,0.45)',
            lineHeight: '1.75', marginBottom: '40px', maxWidth: '520px'
          }}>
            Campus placements are shrinking. Off-campus is opaque and exhausting.
            Career Genie won't fix the market — but it will make sure your resume
            isn't the reason you get filtered out.
          </p>

          <div className="hero-buttons fade-up fade-up-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="cta-btn" onClick={() => navigate('/analyze')} style={{
              background: 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none',
              padding: '16px 40px', borderRadius: '12px',
              fontSize: '16px', fontWeight: '900',
              cursor: 'pointer', letterSpacing: '-0.3px',
              boxShadow: '0 0 40px rgba(245,197,24,0.3)'
            }}>
              Analyze my resume — free
            </button>
            <button onClick={() => navigate('/jobs')} style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '16px 32px', borderRadius: '12px',
              fontSize: '16px', fontWeight: '600', cursor: 'pointer'
            }}>
              Find jobs
            </button>
          </div>

          {/* Honest note */}
          <p style={{
            fontSize: '13px', color: 'rgba(255,255,255,0.25)',
            marginTop: '20px', lineHeight: '1.6'
          }}>
            No fake placement stats. No "10,000 users" claims. Just a tool we built
            because we think good resume help should be accessible to everyone.
          </p>
        </div>

        {/* Genie illustration */}
        <div className="genie-float" style={{
          width: '220px', height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, rgba(245,197,24,0.15), rgba(139,92,246,0.08), transparent)',
          border: '1px solid rgba(245,197,24,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'float 4s ease-in-out infinite',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', inset: '-1px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245,197,24,0.2), transparent 60%)',
            zIndex: 0
          }} />
          <img src={genieIcon} alt="Career Genie" style={{
            width: '160px', height: '160px',
            borderRadius: '50%', objectFit: 'cover',
            objectPosition: 'center top',
            position: 'relative', zIndex: 1
          }} />
        </div>
      </div>

      {/* What this actually does */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '36px', fontWeight: '900',
            letterSpacing: '-1.5px', marginBottom: '12px', color: '#fff'
          }}>
            What Career Genie actually does
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '500px', lineHeight: '1.6' }}>
            Six features. All free to start. No account required for the basics.
          </p>
        </div>

        <div className="features-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'
        }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(245,197,24,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '16px'
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.2px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.65', margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The honest section */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '24px', padding: '48px'
        }}>
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#4ade80', fontSize: '12px', fontWeight: '700',
              padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
              letterSpacing: '0.5px'
            }}>
              HONEST ANSWERS
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
              Questions we'd want answered if we were you
            </h2>
          </div>

          <div className="honest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {honest.map((item, i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#f5c518', marginBottom: '10px', lineHeight: '1.4' }}>
                  {item.q}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '40px', color: '#fff' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
          {[
            { step: '01', title: 'Upload your resume', desc: 'PDF or paste — takes 10 seconds' },
            { step: '02', title: 'Paste the JD', desc: 'Any job description from any portal' },
            { step: '03', title: 'Get your analysis', desc: 'Match score, ATS audit, rewrites' },
            { step: '04', title: 'Apply with confidence', desc: 'Or use the job finder to discover roles' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '28px 24px',
              borderLeft: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
            }}>
              <div style={{
                fontSize: '32px', fontWeight: '900', letterSpacing: '-1px',
                color: 'rgba(245,197,24,0.3)', marginBottom: '12px'
              }}>{s.step}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto 100px', padding: '0 40px' }}>
        <div className="cta-inner" style={{
          background: 'linear-gradient(135deg, rgba(245,197,24,0.08), rgba(139,92,246,0.06))',
          border: '1px solid rgba(245,197,24,0.15)',
          borderRadius: '28px', padding: '72px 60px', textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px',
            marginBottom: '16px', color: '#fff'
          }}>
            The market is hard.<br />
            <span style={{
              background: 'linear-gradient(135deg, #f5c518, #ff8c00)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Your resume doesn't have to be.</span>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.4)', fontSize: '16px',
            marginBottom: '36px', lineHeight: '1.6'
          }}>
            Free to use. No sign-up needed for the basics.<br />
            Built by people who know what off-campus job hunting feels like.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta-btn" onClick={() => navigate('/analyze')} style={{
              background: 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none',
              padding: '16px 48px', borderRadius: '12px',
              fontSize: '16px', fontWeight: '900', cursor: 'pointer',
              boxShadow: '0 0 40px rgba(245,197,24,0.3)'
            }}>
              Analyze my resume — free
            </button>
            <button onClick={() => navigate('/jobs')} style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '16px 32px', borderRadius: '12px',
              fontSize: '16px', fontWeight: '600', cursor: 'pointer'
            }}>
              Find jobs
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '28px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
        maxWidth: '1100px', margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={genieIcon} alt="Career Genie" style={{
            width: '28px', height: '28px', borderRadius: '50%',
            objectFit: 'cover', objectPosition: 'center top'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>Career Genie</span>
        </div>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
          Made for Indian students and freshers navigating a tough job market
        </span>
      </div>

    </div>
  )
}

export default Home