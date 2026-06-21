import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Analyze() {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('keywords')

  const handleAnalyze = async () => {
    if (!resumeText) { setError('Please paste your resume text'); return }
    if (!jdText) { setError('Please paste the job description'); return }
    setError('')
    setLoading(true)

    try {
      const prompt = `You are an expert resume coach and ATS specialist. Analyze the resume against the job description and return ONLY a valid JSON object with no extra text, no markdown, no backticks. Use this exact structure:
{
  "matchScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "missingKeywords": [<5 to 8 important missing keywords from JD>],
  "presentKeywords": [<5 to 8 keywords already in resume that match JD>],
  "atsIssues": [<3 to 5 specific ATS issues as strings>],
  "rewrites": [
    {
      "original": "<original bullet point from resume>",
      "improved": "<rewritten version optimized for this JD>"
    }
  ]
}
Provide 3 rewritten bullet points. Make rewrites quantified, action-verb led and keyword rich.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jdText}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResults(parsed)
      setActiveTab('keywords')

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (val) => val >= 75 ? '#22c55e' : val >= 50 ? '#f5c518' : '#ef4444'
  const scoreGlow = (val) => val >= 75 ? 'rgba(34,197,94,0.3)' : val >= 50 ? 'rgba(245,197,24,0.3)' : 'rgba(239,68,68,0.3)'
  const scoreLabel = (val) => val >= 75 ? 'Excellent' : val >= 50 ? 'Needs work' : 'Poor'

  const tabs = ['keywords', 'ats', 'rewrite']
  const tabLabels = { keywords: '🔑 Keywords', ats: '🛡️ ATS Issues', rewrite: '✍️ AI Rewrite' }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      {/* Gradient orbs */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', left: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px',
        background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #f5c518, #e8a200)',
            borderRadius: '9px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#000'
          }}>G</div>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <button onClick={() => navigate('/pricing')} style={{
          background: 'transparent', color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px',
          borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
        }}>Pricing</button>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px',
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Analyze your resume</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            Paste your resume and job description below — get your full AI analysis instantly.
          </p>
        </div>

        {/* Input Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'Your resume', icon: '📄', value: resumeText, setter: setResumeText, placeholder: 'Paste your full resume text here...' },
            { label: 'Job description', icon: '💼', value: jdText, setter: setJdText, placeholder: 'Paste the full job description here...' }
          ].map((field, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '20px'
            }}>
              <label style={{
                fontSize: '13px', fontWeight: '700',
                color: 'rgba(255,255,255,0.45)', display: 'block',
                marginBottom: '12px', letterSpacing: '0.5px'
              }}>
                {field.icon} {field.label.toUpperCase()}
              </label>
              <textarea
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', height: '260px', padding: '0',
                  fontSize: '13px', fontFamily: 'Inter, sans-serif',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.75)', resize: 'none',
                  outline: 'none', lineHeight: '1.7',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', padding: '12px 18px', borderRadius: '12px',
            fontSize: '14px', marginBottom: '16px'
          }}>{error}</div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            width: '100%', padding: '18px',
            background: loading
              ? 'rgba(245,197,24,0.3)'
              : 'linear-gradient(135deg, #f5c518, #e8a200)',
            color: '#000', border: 'none', borderRadius: '14px',
            fontSize: '17px', fontWeight: '900',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '48px', letterSpacing: '-0.3px',
            boxShadow: loading ? 'none' : '0 0 40px rgba(245,197,24,0.25)',
            transition: 'all 0.2s'
          }}>
          {loading ? '⏳  Analyzing your resume...' : '✨  Analyze my resume →'}
        </button>

        {/* Results */}
        {results && (
          <div>

            {/* Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Match Score', value: results.matchScore },
                { label: 'ATS Score', value: results.atsScore },
                { label: 'Readability', value: results.readabilityScore },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${scoreGlow(s.value).replace('0.3', '0.2')}`,
                  borderRadius: '20px', padding: '28px 20px', textAlign: 'center',
                  boxShadow: `0 0 40px ${scoreGlow(s.value)}`
                }}>
                  <div style={{
                    fontSize: '52px', fontWeight: '900', letterSpacing: '-3px',
                    color: scoreColor(s.value), lineHeight: '1'
                  }}>{s.value}%</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '8px 0 4px' }}>{s.label}</div>
                  <div style={{
                    display: 'inline-block', fontSize: '11px', fontWeight: '700',
                    color: scoreColor(s.value),
                    background: `${scoreGlow(s.value).replace('0.3', '0.1')}`,
                    padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px'
                  }}>{scoreLabel(s.value)}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '6px', marginBottom: '24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '6px'
            }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '10px 16px',
                  background: activeTab === tab ? 'rgba(245,197,24,0.12)' : 'transparent',
                  border: activeTab === tab ? '1px solid rgba(245,197,24,0.25)' : '1px solid transparent',
                  borderRadius: '10px',
                  color: activeTab === tab ? '#f5c518' : 'rgba(255,255,255,0.4)',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>{tabLabels[tab]}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px'
            }}>

              {/* Keywords Tab */}
              {activeTab === 'keywords' && (
                <div>
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444'
                      }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                        Missing keywords — add these to your resume
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {results.missingKeywords.map((k, i) => (
                        <span key={i} style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.2)',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500'
                        }}>✗ {k}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                        Keywords you already have
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {results.presentKeywords.map((k, i) => (
                        <span key={i} style={{
                          background: 'rgba(34,197,94,0.08)',
                          color: '#4ade80',
                          border: '1px solid rgba(34,197,94,0.2)',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500'
                        }}>✓ {k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ATS Tab */}
              {activeTab === 'ats' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c518' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                      Fix these issues to pass ATS filters
                    </h3>
                  </div>
                  {results.atsIssues.map((issue, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '16px', alignItems: 'flex-start',
                      padding: '16px 0',
                      borderBottom: i < results.atsIssues.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(245,197,24,0.1)',
                        border: '1px solid rgba(245,197,24,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px'
                      }}>⚠</div>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.65', margin: 0 }}>{issue}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rewrite Tab */}
              {activeTab === 'rewrite' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                      AI-upgraded bullet points for this role
                    </h3>
                  </div>
                  {results.rewrites.map((r, i) => (
                    <div key={i} style={{
                      marginBottom: '24px',
                      paddingBottom: '24px',
                      borderBottom: i < results.rewrites.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px',
                        color: 'rgba(255,255,255,0.25)', marginBottom: '8px'
                      }}>BEFORE</div>
                      <div style={{
                        background: 'rgba(255,255,255,0.03)', padding: '14px 16px',
                        borderRadius: '10px', fontSize: '14px',
                        color: 'rgba(255,255,255,0.4)', lineHeight: '1.65', marginBottom: '12px'
                      }}>{r.original}</div>
                      <div style={{
                        fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px',
                        color: '#4ade80', marginBottom: '8px'
                      }}>AFTER — AI IMPROVED</div>
                      <div style={{
                        background: 'rgba(34,197,94,0.06)', padding: '14px 16px',
                        borderRadius: '10px', fontSize: '14px',
                        color: 'rgba(255,255,255,0.85)', lineHeight: '1.65',
                        borderLeft: '3px solid #22c55e', borderRadius: '0 10px 10px 0'
                      }}>{r.improved}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Analyze Again */}
            <button
              onClick={() => { setResults(null); setResumeText(''); setJdText('') }}
              style={{
                width: '100%', padding: '14px', marginTop: '20px',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}>
              ↩ Analyze another resume
            </button>

          </div>
        )}
      </div>
    </div>
  )
}

export default Analyze