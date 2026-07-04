import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractTextFromPDF } from '../pdfUtils'
import genieIcon from '../assets/genie-icon.png'

function JobFinder() {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

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
    } finally {
      setPdfLoading(false)
    }
  }

  const extractProfileFromResume = async (resume) => {
    const prompt = `Extract the candidate profile from this resume and return ONLY a valid JSON object with no markdown, no backticks:
{
  "name": "<candidate name>",
  "currentRole": "<current or most recent job title>",
  "topSkills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
  "experienceYears": "<number of years experience as a number>",
  "searchQuery": "<best job search query string based on their profile — e.g. React Developer, Data Analyst, Marketing Manager>",
  "jobTitles": ["<job title 1>", "<job title 2>", "<job title 3>"]
}

RESUME:
${resume}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Extract structured profile data from resumes. Always return valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    })

    const data = await response.json()
    const raw = data.choices[0].message.content
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  }

  const searchJobs = async (query, locationQuery) => {
    const searchQuery = `${query} jobs in ${locationQuery}`
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=2&country=in`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': import.meta.env.VITE_JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    })
    
    const data = await response.json()
    console.log('JSearch response:', data)
    if (data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
      return data.data.jobs
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data
    }
    if (data.jobs && Array.isArray(data.jobs)) {
      return data.jobs
    }
    return []
  }

  const handleFindJobs = async () => {
    if (!resumeText) {
      setError('Please upload or paste your resume first')
      return
    }
    setError('')
    setLoading(true)
    setJobs([])
    setProfile(null)

    try {
      // Step 1 — Extract profile from resume using AI
      const extractedProfile = await extractProfileFromResume(resumeText)
      setProfile(extractedProfile)

      // Step 2 — Search jobs using extracted query
      const locationQuery = location || 'India'
      const jobResults = await searchJobs(extractedProfile.searchQuery, locationQuery)

      setJobs(jobResults.slice(0, 15))
      setSearched(true)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getPostedDate = (dateStr) => {
    if (!dateStr) return 'Recently posted'
    const date = new Date(dateStr * 1000)
    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .jf-nav { padding: 14px 20px !important; }
          .jf-main { padding: 24px 16px !important; }
          .jf-h1 { font-size: 28px !important; letter-spacing: -1px !important; }
          .jf-grid { grid-template-columns: 1fr !important; }
          .jf-profile-grid { grid-template-columns: 1fr 1fr !important; }
          .job-card-footer { flex-direction: column !important; gap: 10px !important; }
        }
      `}</style>

      {/* Gradient orbs */}
      <div style={{
        position: 'fixed', top: '-200px', left: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', right: '-200px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Navbar */}
      <nav className="jf-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 60px',
        background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/analyze')} style={{
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px',
            borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
          }}>Analyze Resume</button>
          <button onClick={() => navigate('/pricing')} style={{
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px',
            borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
          }}>Pricing</button>
        </div>
      </nav>

      <div className="jf-main" style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#a78bfa', fontSize: '13px', fontWeight: '600',
            padding: '7px 18px', borderRadius: '20px', marginBottom: '20px'
          }}>
            <span style={{ width: '7px', height: '7px', background: '#a78bfa', borderRadius: '50%', display: 'inline-block' }} />
            Pro Feature — Personalised Job Finder
          </div>
          <h1 className="jf-h1" style={{
            fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px',
            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Find jobs made for you</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            Upload your resume — our AI extracts your profile and finds the most relevant jobs from across the web.
          </p>
        </div>

        {/* Input Section */}
        <div className="jf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Resume Upload */}
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

            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(139,92,246,0.08)',
              border: '1px dashed rgba(139,92,246,0.3)',
              borderRadius: '10px', padding: '12px 16px',
              cursor: 'pointer', marginBottom: '12px',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#a78bfa' }}>
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
                width: '100%', height: '180px', padding: '0',
                fontSize: '13px', fontFamily: 'Inter, sans-serif',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.75)', resize: 'none',
                outline: 'none', lineHeight: '1.7', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Location + Info */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div>
              <label style={{
                fontSize: '13px', fontWeight: '700',
                color: 'rgba(255,255,255,0.45)', display: 'block',
                marginBottom: '12px', letterSpacing: '0.5px'
              }}>📍 PREFERRED LOCATION</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder='e.g. Bangalore, Chennai, Mumbai, Remote...'
                style={{
                  width: '100%', padding: '12px 14px',
                  fontSize: '14px', fontFamily: 'Inter, sans-serif',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#fff',
                  outline: 'none', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* How it works */}
            <div style={{
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: '12px', padding: '16px', flex: 1
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1px', marginBottom: '12px' }}>HOW IT WORKS</div>
              {[
                { icon: '🧠', text: 'AI reads your resume and extracts your profile' },
                { icon: '🔍', text: 'Searches jobs across LinkedIn, Indeed and more' },
                { icon: '🎯', text: 'Shows top matches ranked by relevance to your skills' },
                { icon: '⚡', text: 'One click to apply directly on the job portal' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0 }}>{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', padding: '12px 18px', borderRadius: '12px',
            fontSize: '14px', marginBottom: '16px'
          }}>{error}</div>
        )}

        {/* Find Jobs Button */}
        <button
          onClick={handleFindJobs}
          disabled={loading}
          style={{
            width: '100%', padding: '18px',
            background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: '#fff', border: 'none', borderRadius: '14px',
            fontSize: '17px', fontWeight: '900',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '40px', letterSpacing: '-0.3px',
            boxShadow: loading ? 'none' : '0 0 40px rgba(139,92,246,0.25)',
            transition: 'all 0.2s'
          }}>
          {loading ? '🔍 Finding your perfect jobs...' : '🚀 Find my jobs →'}
        </button>

        {/* Profile Card */}
        {profile && (
          <div style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '16px', padding: '20px', marginBottom: '28px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '14px' }}>
              YOUR AI EXTRACTED PROFILE
            </div>
            <div className="jf-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              {[
                { label: 'Name', value: profile.name },
                { label: 'Current Role', value: profile.currentRole },
                { label: 'Experience', value: profile.experienceYears + ' years' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>TOP SKILLS DETECTED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(profile.topSkills || []).map((skill, i) => (
                <span key={i} style={{
                  background: 'rgba(139,92,246,0.12)', color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.25)',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '13px'
                }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Job Results */}
        {searched && jobs.length === 0 && !loading && (
          <div style={{
            textAlign: 'center', padding: '48px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>No jobs found. Try a different location or update your resume with more skills.</p>
          </div>
        )}

        {jobs.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                {jobs.length} jobs found for you
              </h2>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                Based on your profile
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jobs.map((job, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '20px',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                    e.currentTarget.style.background = 'rgba(139,92,246,0.04)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>
                        {job.job_title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600' }}>
                          {job.employer_name}
                        </span>
                        {job.job_city && (
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                            📍 {job.job_city}{job.job_country ? ', ' + job.job_country : ''}
                          </span>
                        )}
                        {job.job_employment_type && (
                          <span style={{
                            fontSize: '11px', fontWeight: '700',
                            background: 'rgba(245,197,24,0.1)', color: '#f5c518',
                            border: '1px solid rgba(245,197,24,0.2)',
                            padding: '2px 8px', borderRadius: '20px'
                          }}>{job.job_employment_type}</span>
                        )}
                        {job.job_is_remote && (
                          <span style={{
                            fontSize: '11px', fontWeight: '700',
                            background: 'rgba(34,197,94,0.1)', color: '#4ade80',
                            border: '1px solid rgba(34,197,94,0.2)',
                            padding: '2px 8px', borderRadius: '20px'
                          }}>🏠 Remote</span>
                        )}
                      </div>
                    </div>
                    {job.employer_logo && (
                      <img
                        src={job.employer_logo}
                        alt={job.employer_name}
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#fff', padding: '4px', flexShrink: 0 }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    )}
                  </div>

                  {job.job_description && (
                    <p style={{
                      fontSize: '13px', color: 'rgba(255,255,255,0.45)',
                      lineHeight: '1.6', margin: '0 0 14px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {job.job_description}
                    </p>
                  )}

                  <div className="job-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        🕐 {getPostedDate(job.job_posted_at_timestamp)}
                      </span>
                      {job.job_min_salary && (
                        <span style={{ fontSize: '12px', color: '#4ade80' }}>
                          💰 {job.job_min_salary} - {job.job_max_salary} {job.job_salary_currency}
                        </span>
                      )}
                    </div>
                    <a
                      href={job.job_apply_link}
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        color: '#fff', border: 'none',
                        padding: '10px 24px', borderRadius: '10px',
                        fontSize: '13px', fontWeight: '700',
                        cursor: 'pointer', textDecoration: 'none',
                        display: 'inline-block'
                      }}>
                      Apply now →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Search again */}
            <button
              onClick={() => { setJobs([]); setProfile(null); setSearched(false); setResumeText(''); setUploadedFileName('') }}
              style={{
                width: '100%', padding: '14px', marginTop: '20px',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}>
              ↩ Search with different resume
            </button>

          </div>
        )}
      </div>
    </div>
  )
}

export default JobFinder