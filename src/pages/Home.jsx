import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

function Home() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1
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
    return () => cancelAnimationFrame(animId)
  }, [])

  const features = [
    { icon: '🎯', title: 'Match Score', desc: 'See exactly how well your resume aligns with the JD — with a clear percentage breakdown.' },
    { icon: '🛡️', title: 'ATS Audit', desc: 'Catch every formatting issue and missing keyword before the recruiter even sees your resume.' },
    { icon: '✍️', title: 'AI Rewrite', desc: 'Your bullet points rewritten with action verbs, metrics and job-specific keywords that get callbacks.' },
    { icon: '⚡', title: 'Instant Results', desc: 'Full deep analysis in under 30 seconds. No signup required to get started.' },
  ]

  const testimonials = [
    { name: 'Priya S.', role: 'Got placed at TCS', text: 'My match score went from 42% to 89% after the AI rewrite. Got the interview in 3 days.' },
    { name: 'Arjun M.', role: 'Hired at Infosys', text: 'I had no idea my resume had so many ATS issues. Career Genie fixed everything in one click.' },
    { name: 'Sneha R.', role: 'Placed at Wipro', text: 'The keyword suggestions were spot on. Every single one was in the JD. Highly recommend.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', overflow: 'hidden' }}>

      {/* Animated particle canvas */}
      <canvas ref={canvasRef} style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.4
      }} />

      {/* Gradient orbs */}
      <div style={{
        position: 'fixed', top: '-200px', left: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', right: '-200px',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px',
        background: 'rgba(5,5,10,0.7)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/src/assets/genie-icon.png"
            alt="Career Genie"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }}
          />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => navigate('/pricing')} style={{
            background: 'transparent', color: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px',
            borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
          }}>Pricing</button>
          <button onClick={() => navigate('/analyze')} style={{
            background: 'linear-gradient(135deg, #f5c518, #e8a200)',
            color: '#000', border: 'none', padding: '10px 24px',
            borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800'
          }}>Try free →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '120px 20px 80px', maxWidth: '860px', margin: '0 auto' }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(245,197,24,0.08)',
          border: '1px solid rgba(245,197,24,0.2)',
          color: '#f5c518', fontSize: '13px', fontWeight: '600',
          padding: '7px 18px', borderRadius: '20px', marginBottom: '40px'
        }}>
          <span style={{ width: '7px', height: '7px', background: '#f5c518', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Free for students and freshers
        </div>

        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 80px)',
          fontWeight: '900',
          lineHeight: '1.0',
          letterSpacing: '-3px',
          marginBottom: '28px'
        }}>
          <span style={{
            background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Stop getting<br />filtered out.</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #f5c518 0%, #ff8c00 50%, #e8a200 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Start getting hired.</span>
        </h1>

        <p style={{
          fontSize: '19px', color: 'rgba(255,255,255,0.45)',
          lineHeight: '1.75', maxWidth: '580px', margin: '0 auto 48px'
        }}>
          Career Genie analyzes your resume against any job description —
          gives you a match score, ATS audit, and rewrites your bullets using AI.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/analyze')} style={{
            background: 'linear-gradient(135deg, #f5c518, #e8a200)',
            color: '#000', border: 'none',
            padding: '18px 48px', borderRadius: '14px',
            fontSize: '17px', fontWeight: '900',
            cursor: 'pointer', letterSpacing: '-0.5px',
            boxShadow: '0 0 40px rgba(245,197,24,0.3)'
          }}>
            Analyze my resume →
          </button>
          <button onClick={() => navigate('/pricing')} style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.65)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '18px 40px', borderRadius: '14px',
            fontSize: '17px', fontWeight: '600', cursor: 'pointer'
          }}>
            See pricing
          </button>
        </div>

        {/* Social proof strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginTop: '40px'
        }}>
          <div style={{ display: 'flex' }}>
            {['P', 'A', 'S', 'R', 'K'].map((l, i) => (
              <div key={i} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: `hsl(${i * 40 + 200}, 60%, 45%)`,
                border: '2px solid #05050a',
                marginLeft: i === 0 ? 0 : '-8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '700', color: '#fff'
              }}>{l}</div>
            ))}
          </div>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: '#f5c518', fontWeight: '700' }}>2,400+ students</span> already got more interviews
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto', padding: '0 20px 80px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', overflow: 'hidden'
        }}>
          {[
            { value: '10K+', label: 'Resumes analyzed' },
            { value: '85%', label: 'Get more interviews' },
            { value: '30s', label: 'Analysis time' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '32px 20px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#f5c518', letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '0 20px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', color: '#fff', marginBottom: '12px' }}>
            Built different.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>Not just a keyword matcher. A full career upgrade engine.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px', padding: '32px 24px',
                transition: 'all 0.25s ease', cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(245,197,24,0.06)'
                e.currentTarget.style.borderColor = 'rgba(245,197,24,0.25)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: '48px', height: '48px',
                background: 'rgba(245,197,24,0.1)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '20px'
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.65' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '0 20px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '48px' }}>
          Real results from real students
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px'
            }}>
              <div style={{ fontSize: '28px', color: '#f5c518', marginBottom: '16px', letterSpacing: '-1px' }}>"</div>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '20px' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f5c518, #e8a200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '800', color: '#000'
                }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,197,24,0.1), rgba(139,92,246,0.08))',
          border: '1px solid rgba(245,197,24,0.2)',
          borderRadius: '28px', padding: '72px 40px', textAlign: 'center',
          boxShadow: '0 0 80px rgba(245,197,24,0.08)'
        }}>
          <h2 style={{ fontSize: '44px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px' }}>
            Your dream job is<br />
            <span style={{
              background: 'linear-gradient(135deg, #f5c518, #ff8c00)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>one analysis away.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', marginBottom: '40px' }}>
            Free to start. No credit card needed.
          </p>
          <button onClick={() => navigate('/analyze')} style={{
            background: 'linear-gradient(135deg, #f5c518, #e8a200)',
            color: '#000', border: 'none',
            padding: '18px 56px', borderRadius: '14px',
            fontSize: '18px', fontWeight: '900', cursor: 'pointer',
            boxShadow: '0 0 40px rgba(245,197,24,0.35)'
          }}>
            Analyze my resume for free →
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #f5c518, #e8a200)',
            borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '800', color: '#000'
          }}>G</div>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>Career Genie</span>
        </div>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>Built for Indian students and freshers</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

    </div>
  )
}

export default Home