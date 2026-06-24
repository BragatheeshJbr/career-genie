import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractTextFromPDF } from '../pdfUtils'
import jsPDF from 'jspdf'

function Analyze() {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [results, setResults] = useState(null)
  const [fullRewrite, setFullRewrite] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('keywords')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.')
      return
    }
    setPdfLoading(true)
    setError('')
    try {
      const text = await extractTextFromPDF(file)
      setResumeText(text)
      setUploadedFileName(file.name)
    } catch (err) {
      setError('Could not read PDF. Please paste your resume text manually.')
      console.error(err)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText) { setError('Please paste or upload your resume'); return }
    if (!jdText) { setError('Please paste the job description'); return }
    setError('')
    setLoading(true)
    setFullRewrite(null)

    try {
      const prompt = `Analyze the resume against the job description and return ONLY a valid JSON object with no extra text, no markdown, no backticks. Use this exact structure:
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
          messages: [
            {
              role: 'system',
              content: `You are Career Genie, an expert AI resume coach built specifically for Indian students and freshers. Your sole purpose is to analyze resumes against job descriptions and return structured JSON feedback. Always return valid JSON only — no markdown, no extra text.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
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

  const handleFullRewrite = async () => {
    if (!resumeText || !jdText) return
    setRewriting(true)
    setError('')

    try {
      const prompt = `You are an expert resume writer. Rewrite the entire resume below to perfectly match the job description. 

Rules:
- Keep all real experience, education and skills — do not fabricate anything
- Rewrite every bullet point to be quantified, action-verb led and keyword rich
- Add missing keywords from the JD naturally into the content
- Rewrite the summary/objective section to match the role
- Make it ATS friendly — no tables, no columns, clean formatting
- Return ONLY a valid JSON object with no markdown, no backticks:

{
  "name": "<candidate name>",
  "summary": "<rewritten professional summary — 3 lines>",
  "experience": [
    {
      "company": "<company name>",
      "role": "<job title>",
      "duration": "<duration>",
      "bullets": ["<rewritten bullet 1>", "<rewritten bullet 2>", "<rewritten bullet 3>"]
    }
  ],
  "education": [
    {
      "degree": "<degree>",
      "institution": "<institution>",
      "year": "<year>",
      "score": "<score if available>"
    }
  ],
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "improvements": ["<what was improved 1>", "<what was improved 2>", "<what was improved 3>"]
}

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
          messages: [
            {
              role: 'system',
              content: `You are Career Genie, an expert resume writer for Indian students and freshers. Rewrite resumes to perfectly match job descriptions. Always return valid JSON only.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setFullRewrite(parsed)
      setActiveTab('fullrewrite')

    } catch (err) {
      setError('Rewrite failed. Please try again.')
      console.error(err)
    } finally {
      setRewriting(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!fullRewrite) return
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    const addText = (text, fontSize, bold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(line, margin, y)
        y += fontSize * 0.5
      })
      y += 2
    }

    const addLine = () => {
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6
    }

    addText(fullRewrite.name || 'Resume', 22, true, [0, 0, 0])
    addLine()
    addText('PROFESSIONAL SUMMARY', 11, true, [80, 80, 80])
    y += 2
    addText(fullRewrite.summary || '', 10, false, [40, 40, 40])
    y += 4
    addLine()
    addText('EXPERIENCE', 11, true, [80, 80, 80])
    y += 2
    ;(fullRewrite.experience || []).forEach(exp => {
      addText(`${exp.role} — ${exp.company}`, 11, true, [0, 0, 0])
      addText(exp.duration || '', 9, false, [120, 120, 120])
      ;(exp.bullets || []).forEach(b => {
        addText(`• ${b}`, 10, false, [40, 40, 40])
      })
      y += 4
    })
    addLine()
    addText('EDUCATION', 11, true, [80, 80, 80])
    y += 2
    ;(fullRewrite.education || []).forEach(edu => {
      addText(`${edu.degree} — ${edu.institution}`, 11, true, [0, 0, 0])
      addText(`${edu.year || ''} ${edu.score ? '| ' + edu.score : ''}`, 9, false, [120, 120, 120])
      y += 4
    })
    addLine()
    addText('SKILLS', 11, true, [80, 80, 80])
    y += 2
    addText((fullRewrite.skills || []).join(' • '), 10, false, [40, 40, 40])
    doc.save(`${fullRewrite.name || 'resume'}_careergenie.pdf`)
  }

  const scoreColor = (val) => val >= 75 ? '#22c55e' : val >= 50 ? '#f5c518' : '#ef4444'
  const scoreGlow = (val) => val >= 75 ? 'rgba(34,197,94,0.3)' : val >= 50 ? 'rgba(245,197,24,0.3)' : 'rgba(239,68,68,0.3)'
  const scoreLabel = (val) => val >= 75 ? 'Excellent' : val >= 50 ? 'Needs work' : 'Poor'

  const tabs = ['keywords', 'ats', 'rewrite', ...(fullRewrite ? ['fullrewrite'] : [])]
  const tabLabels = {
    keywords: '🔑 Keywords',
    ats: '🛡️ ATS Issues',
    rewrite: '✍️ AI Rewrite',
    fullrewrite: '🚀 Full Resume'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .analyze-nav { padding: 14px 20px !important; }
          .analyze-main { padding: 24px 16px !important; }
          .analyze-h1 { font-size: 26px !important; letter-spacing: -1px !important; }
          .analyze-grid { grid-template-columns: 1fr !important; }
          .btn-row { grid-template-columns: 1fr !important; }
          .score-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .score-number { font-size: 32px !important; letter-spacing: -1px !important; }
          .score-card { padding: 16px 10px !important; }
          .tabs-row { flex-wrap: wrap !important; gap: 4px !important; }
          .tab-btn { font-size: 11px !important; padding: 8px 6px !important; }
          .tab-content { padding: 16px !important; }
          .download-row { flex-direction: column !important; gap: 12px !important; }
        }
      `}</style>

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
      <nav className="analyze-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px',
        background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
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

      <div className="analyze-main" style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 className="analyze-h1" style={{
            fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px',
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Analyze your resume</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            Upload your PDF or paste your resume — get your full AI analysis and complete rewrite instantly.
          </p>
        </div>

        {/* Input Grid */}
        <div className="analyze-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Resume Input */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px'
          }}>
            <label style={{
              fontSize: '13px', fontWeight: '700',
              color: 'rgba(255,255,255,0.45)', display: 'block',
              marginBottom: '12px', letterSpacing: '0.5px'
            }}>📄 YOUR RESUME</label>

            {/* PDF Upload Button */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(245,197,24,0.08)',
              border: '1px dashed rgba(245,197,24,0.3)',
              borderRadius: '10px', padding: '12px 16px',
              cursor: 'pointer', marginBottom: '12px',
              transition: 'all 0.2s', position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f5c518' }}>
                  {pdfLoading ? 'Reading PDF...' : uploadedFileName ? uploadedFileName : 'Upload PDF resume'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                  {uploadedFileName ? 'Text extracted successfully ✓' : 'Tap to upload — PDF files only'}
                </div>
              </div>
              <input
                type='file'
                accept='application/pdf'
                onChange={handlePDFUpload}
                style={{
                  position: 'absolute', opacity: 0,
                  width: '100%', height: '100%',
                  top: 0, left: 0, cursor: 'pointer'
                }}
              />
            </label>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', textAlign: 'center' }}>
              — or paste text below —
            </div>

            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder='Paste your full resume text here...'
              style={{
                width: '100%', height: '200px', padding: '0',
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.75)', resize: 'none',
                outline: 'none', lineHeight: '1.7', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* JD Input */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px'
          }}>
            <label style={{
              fontSize: '13px', fontWeight: '700',
              color: 'rgba(255,255,255,0.45)', display: 'block',
              marginBottom: '12px', letterSpacing: '0.5px'
            }}>💼 JOB DESCRIPTION</label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder='Paste the full job description here...'
              style={{
                width: '100%', height: '300px', padding: '0',
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.75)', resize: 'none',
                outline: 'none', lineHeight: '1.7', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', padding: '12px 18px', borderRadius: '12px',
            fontSize: '14px', marginBottom: '16px'
          }}>{error}</div>
        )}

        {/* Buttons Row */}
        <div className="btn-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '48px' }}>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '18px',
              background: loading ? 'rgba(245,197,24,0.3)' : 'linear-gradient(135deg, #f5c518, #e8a200)',
              color: '#000', border: 'none', borderRadius: '14px',
              fontSize: '17px', fontWeight: '900',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.3px',
              boxShadow: loading ? 'none' : '0 0 40px rgba(245,197,24,0.25)',
              transition: 'all 0.2s'
            }}>
            {loading ? '⏳ Analyzing...' : '✨ Analyze my resume →'}
          </button>

          <button
            onClick={handleFullRewrite}
            disabled={rewriting || !results}
            style={{
              padding: '18px 24px',
              background: rewriting ? 'rgba(139,92,246,0.2)' : !results ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.15)',
              color: !results ? 'rgba(255,255,255,0.2)' : '#a78bfa',
              border: `1px solid ${!results ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.3)'}`,
              borderRadius: '14px', fontSize: '15px', fontWeight: '800',
              cursor: rewriting || !results ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}>
            {rewriting ? '⏳ Rewriting...' : '🚀 Full Rewrite'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div>

            {/* Score Cards */}
            <div className="score-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Match Score', value: results.matchScore },
                { label: 'ATS Score', value: results.atsScore },
                { label: 'Readability', value: results.readabilityScore },
              ].map((s, i) => (
                <div className="score-card" key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${scoreGlow(s.value).replace('0.3', '0.2')}`,
                  borderRadius: '20px', padding: '28px 20px', textAlign: 'center',
                  boxShadow: `0 0 40px ${scoreGlow(s.value)}`
                }}>
                  <div className="score-number" style={{
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
            <div className="tabs-row" style={{
              display: 'flex', gap: '6px', marginBottom: '24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '6px'
            }}>
              {tabs.map(tab => (
                <button className="tab-btn" key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '10px 16px',
                  background: activeTab === tab
                    ? tab === 'fullrewrite' ? 'rgba(139,92,246,0.15)' : 'rgba(245,197,24,0.12)'
                    : 'transparent',
                  border: activeTab === tab
                    ? tab === 'fullrewrite' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(245,197,24,0.25)'
                    : '1px solid transparent',
                  borderRadius: '10px',
                  color: activeTab === tab
                    ? tab === 'fullrewrite' ? '#a78bfa' : '#f5c518'
                    : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>{tabLabels[tab]}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '28px'
            }}>

              {/* Keywords Tab */}
              {activeTab === 'keywords' && (
                <div>
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                        Missing keywords — add these to your resume
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {results.missingKeywords.map((k, i) => (
                        <span key={i} style={{
                          background: 'rgba(239,68,68,0.08)', color: '#f87171',
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
                          background: 'rgba(34,197,94,0.08)', color: '#4ade80',
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
                        background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
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
                      marginBottom: '24px', paddingBottom: '24px',
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
                        borderRadius: '0 10px 10px 0', fontSize: '14px',
                        color: 'rgba(255,255,255,0.85)', lineHeight: '1.65',
                        borderLeft: '3px solid #22c55e'
                      }}>{r.improved}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full Rewrite Tab */}
              {activeTab === 'fullrewrite' && fullRewrite && (
                <div>
                  <div className="download-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                        Your fully rewritten resume
                      </h3>
                    </div>
                    <button onClick={handleDownloadPDF} style={{
                      background: 'linear-gradient(135deg, #f5c518, #e8a200)',
                      color: '#000', border: 'none', padding: '10px 20px',
                      borderRadius: '10px', fontSize: '13px', fontWeight: '800',
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>⬇ Download PDF</button>
                  </div>

                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                    {fullRewrite.name}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '10px' }}>PROFESSIONAL SUMMARY</div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0 }}>{fullRewrite.summary}</p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '16px' }}>EXPERIENCE</div>
                    {(fullRewrite.experience || []).map((exp, i) => (
                      <div key={i} style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{exp.role}</div>
                        <div style={{ fontSize: '13px', color: '#f5c518', marginBottom: '8px' }}>{exp.company} · {exp.duration}</div>
                        {(exp.bullets || []).map((b, j) => (
                          <div key={j} style={{
                            fontSize: '14px', color: 'rgba(255,255,255,0.65)',
                            lineHeight: '1.6', marginBottom: '6px',
                            paddingLeft: '16px', position: 'relative'
                          }}>
                            <span style={{ position: 'absolute', left: 0, color: '#a78bfa' }}>•</span>
                            {b}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '16px' }}>EDUCATION</div>
                    {(fullRewrite.education || []).map((edu, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{edu.degree}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{edu.institution} · {edu.year} {edu.score ? '| ' + edu.score : ''}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '12px' }}>SKILLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(fullRewrite.skills || []).map((skill, i) => (
                        <span key={i} style={{
                          background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                          border: '1px solid rgba(139,92,246,0.2)',
                          padding: '5px 12px', borderRadius: '20px', fontSize: '13px'
                        }}>{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: '12px', padding: '16px', marginTop: '8px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#4ade80', letterSpacing: '1px', marginBottom: '10px' }}>WHAT WE IMPROVED</div>
                    {(fullRewrite.improvements || []).map((imp, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>✓ {imp}</div>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* Analyze Again */}
            <button
              onClick={() => { setResults(null); setResumeText(''); setJdText(''); setFullRewrite(null); setUploadedFileName('') }}
              style={{
                width: '100%', padding: '14px', marginTop: '20px',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
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