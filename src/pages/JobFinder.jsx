import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractTextFromPDF } from '../pdfUtils'
import genieIcon from '../assets/genie-icon.png'
import { useAuth } from '../useAuth'
import { openRazorpay, PLANS } from '../payment'

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
  const [activeTier, setActiveTier] = useState('broad')
  const { user, signOut } = useAuth()

  const tiers = [
    {
      id: 'broad',
      name: 'Broad Search',
      icon: '🌐',
      price: '₹19',
      priceNote: 'per search',
      description: 'Cast the widest net — thousands of job boards aggregated into one search',
      color: '#22c55e',
      bgColor: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.25)',
      tags: ['Adzuna', 'Thousands of boards', 'Wide coverage'],
      paid: true,
      plan: 'FRESHER_SEARCH'
    },
    {
      id: 'smart',
      name: 'Smart Search',
      icon: '🔍',
      price: '₹29',
      priceNote: 'per search',
      description: 'Google for Jobs powered — Naukri, LinkedIn, Indeed and Internshala in one search',
      color: '#f5c518',
      bgColor: 'rgba(245,197,24,0.08)',
      borderColor: 'rgba(245,197,24,0.25)',
      tags: ['Google for Jobs', 'Naukri', 'LinkedIn', 'Indeed'],
      paid: true,
      plan: 'INDIA_SEARCH'
    },
    {
      id: 'direct',
      name: 'Direct Search',
      icon: '🎯',
      price: '₹39',
      priceNote: 'per search',
      description: 'Straight from company career pages — freshest listings, no middleman',
      color: '#a78bfa',
      bgColor: 'rgba(139,92,246,0.08)',
      borderColor: 'rgba(139,92,246,0.25)',
      tags: ['Workday', 'Greenhouse', 'Lever', 'Direct ATS'],
      paid: true,
      plan: 'MNC_SEARCH'
    }
  ]

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
  "experienceYears": "<number of years>",
  "searchQuery": "<best job search query string — 2 to 4 words maximum>",
  "category": "<best Remotive category — pick ONE: software-dev, devops, design, finance, marketing, product, data, hr, customer-support, qa, writing, management>"
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
          { role: 'system', content: 'You are a resume parser. Extract structured profile data. Always return valid JSON only.' },
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

  const searchAdzuna = async (profile, locationQuery) => {
    const loc = locationQuery || 'india'
    const query = encodeURIComponent(profile.searchQuery || profile.currentRole)
    const appId = import.meta.env.VITE_ADZUNA_APP_ID
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${query}&where=${encodeURIComponent(loc)}&content-type=application/json`
    const response = await fetch(url)
    const data = await response.json()
    return (data.results || []).map(job => ({
      job_title: job.title,
      employer_name: job.company?.display_name || 'Company',
      employer_logo: null,
      job_city: job.location?.display_name || loc,
      job_country: 'India',
      job_is_remote: job.title?.toLowerCase().includes('remote') || false,
      job_employment_type: job.contract_time || 'Full Time',
      job_description: job.description?.substring(0, 300),
      job_apply_link: job.redirect_url,
      job_posted_at_timestamp: job.created ? new Date(job.created).getTime() / 1000 : null,
      job_min_salary: job.salary_min ? Math.round(job.salary_min) : null,
      job_max_salary: job.salary_max ? Math.round(job.salary_max) : null,
      job_salary_currency: '₹',
      source: 'Adzuna'
    }))
  }

  const searchJSearch = async (profile, locationQuery) => {
    const searchQuery = `${profile.searchQuery} jobs in ${locationQuery}`
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(searchQuery)}&page=1&num_pages=2&country=in`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': import.meta.env.VITE_JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    })
    const data = await response.json()
    if (data.data && data.data.jobs && Array.isArray(data.data.jobs)) return data.data.jobs
    if (data.data && Array.isArray(data.data)) return data.data
    if (data.jobs && Array.isArray(data.jobs)) return data.jobs
    return []
  }

  const searchJobsPipe = async (profile) => {
    const response = await fetch('https://api.jobspipe.dev/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_JOBSPIPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_title_or: [profile.searchQuery],
        limit: 20
      })
    })
    const data = await response.json()
    return (data.jobs || data.data || []).map(job => ({
      job_title: job.title || job.job_title,
      employer_name: job.company || job.employer_name,
      employer_logo: job.company_logo || job.employer_logo,
      job_city: job.location || job.job_city,
      job_country: job.country || job.job_country,
      job_is_remote: job.remote || job.job_is_remote,
      job_employment_type: job.employment_type || job.job_employment_type,
      job_description: job.description || job.job_description,
      job_apply_link: job.apply_url || job.job_apply_link || job.url,
      job_posted_at_timestamp: job.posted_at ? new Date(job.posted_at).getTime() / 1000 : null,
      job_min_salary: job.salary_min || job.min_salary,
      job_max_salary: job.salary_max || job.max_salary,
      source: 'JobsPipe'
    }))
  }

  const runJobSearch = async (tier) => {
    setLoading(true)
    setJobs([])
    setProfile(null)
    setSearched(false)
    setError('')

    try {
      const extractedProfile = await extractProfileFromResume(resumeText)
      setProfile(extractedProfile)
      const locationQuery = location || 'India'
      let jobResults = []

      if (tier === 'broad') {
        jobResults = await searchAdzuna(extractedProfile, locationQuery)
        if (jobResults.length === 0) {
          jobResults = await searchAdzuna({ ...extractedProfile, searchQuery: extractedProfile.currentRole }, locationQuery)
        }
      } else if (tier === 'smart') {
        jobResults = await searchJSearch(extractedProfile, locationQuery)
        if (jobResults.length === 0) {
          jobResults = await searchJSearch(extractedProfile, 'India')
        }
      } else if (tier === 'direct') {
        jobResults = await searchJobsPipe(extractedProfile)
      }

      setJobs(jobResults.slice(0, 15))
      setSearched(true)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleFindJobs = async () => {
    if (!resumeText) {
      setError('Please upload or paste your resume first')
      return
    }
    if (!user) {
      setError('Please sign in to use Job Finder')
      navigate('/login')
      return
    }
    setError('')

    const tier = tiers.find(t => t.id === activeTier)
    const plan = PLANS[tier.plan]

    openRazorpay({
      plan,
      user,
      onSuccess: async () => {
        await runJobSearch(activeTier)
      },
      onFailure: () => {
        setError('Payment cancelled. Please try again.')
      }
    })
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

  const activeTierData = tiers.find(t => t.id === activeTier)

  const getBtnGradient = () => {
    if (activeTier === 'broad') return 'linear-gradient(135deg, #22c55e, #16a34a)'
    if (activeTier === 'smart') return 'linear-gradient(135deg, #f5c518, #e8a200)'
    return 'linear-gradient(135deg, #a78bfa, #7c3aed)'
  }

  const getBtnColor = () => activeTier === 'smart' ? '#000' : '#fff'

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .jf-nav { padding: 14px 20px !important; }
          .jf-main { padding: 24px 16px !important; }
          .jf-h1 { font-size: 28px !important; letter-spacing: -1px !important; }
          .jf-grid { grid-template-columns: 1fr !important; }
          .tier-grid { grid-template-columns: 1fr !important; }
          .job-card-footer { flex-direction: column !important; gap: 10px !important; }
          .jf-profile-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav className="jf-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 60px', background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Analyze Resume</button>
          <button onClick={() => navigate('/pricing')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px' }}>Pricing</button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '9px', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5c518, #e8a200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#000' }}>{user.email[0].toUpperCase()}</div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{user.email.split('@')[0]}</span>
              </div>
              <button onClick={async () => { await signOut(); navigate('/') }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Sign out</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Sign in</button>
          )}
        </div>
      </nav>

      <div className="jf-main" style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 className="jf-h1" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px', background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Find jobs made for you
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            Upload your resume — choose your search type and find the most relevant jobs instantly.
          </p>
        </div>

        {/* Three Tier Selector */}
        <div className="tier-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {tiers.map(tier => (
            <div
              key={tier.id}
              onClick={() => { setActiveTier(tier.id); setJobs([]); setSearched(false); setProfile(null) }}
              style={{ background: activeTier === tier.id ? tier.bgColor : 'rgba(255,255,255,0.02)', border: `1px solid ${activeTier === tier.id ? tier.borderColor : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{tier.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: activeTier === tier.id ? tier.color : '#fff', marginBottom: '4px' }}>{tier.name}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', lineHeight: '1.5' }}>{tier.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {tier.tags.map((tag, i) => (
                  <span key={i} style={{ fontSize: '10px', fontWeight: '700', background: activeTier === tier.id ? tier.bgColor : 'rgba(255,255,255,0.05)', color: activeTier === tier.id ? tier.color : 'rgba(255,255,255,0.4)', border: `1px solid ${activeTier === tier.id ? tier.borderColor : 'rgba(255,255,255,0.08)'}`, padding: '3px 8px', borderRadius: '20px' }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: tier.color }}>
                {tier.price}
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '400', marginLeft: '4px' }}>{tier.priceNote}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Grid */}
        <div className="jf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>📄 YOUR RESUME</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: activeTierData.bgColor, border: `1px dashed ${activeTierData.borderColor}`, borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', marginBottom: '12px', position: 'relative', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: activeTierData.color }}>{pdfLoading ? 'Reading PDF...' : uploadedFileName ? uploadedFileName : 'Upload PDF resume'}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{uploadedFileName ? 'Text extracted ✓' : 'Tap to upload — PDF only'}</div>
              </div>
              <input type='file' accept='application/pdf' onChange={handlePDFUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }} />
            </label>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', textAlign: 'center' }}>— or paste text below —</div>
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder='Paste your full resume text here...' style={{ width: '100%', height: '160px', padding: '0', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.75)', resize: 'none', outline: 'none', lineHeight: '1.7', boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>📍 PREFERRED LOCATION</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder='e.g. Bangalore, Chennai, Mumbai, Remote...' style={{ width: '100%', padding: '12px 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = activeTierData.borderColor }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <div style={{ background: activeTierData.bgColor, border: `1px solid ${activeTierData.borderColor}`, borderRadius: '12px', padding: '16px', flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: activeTierData.color, letterSpacing: '1px', marginBottom: '12px' }}>
                {activeTier === 'broad' ? '🌐 BROAD SEARCH' : activeTier === 'smart' ? '🔍 SMART SEARCH' : '🎯 DIRECT SEARCH'}
              </div>
              {activeTier === 'broad' && [
                { icon: '🌐', text: 'Thousands of job boards in one search' },
                { icon: '📍', text: 'Location based filtering' },
                { icon: '💰', text: 'Salary data included' },
                { icon: '⚡', text: 'Fast results — widest coverage' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', alignItems: 'flex-start' }}>
                  <span>{s.icon}</span><span>{s.text}</span>
                </div>
              ))}
              {activeTier === 'smart' && [
                { icon: '🔍', text: 'Powered by Google for Jobs India' },
                { icon: '🎯', text: 'Naukri, LinkedIn, Indeed, Internshala' },
                { icon: '📍', text: 'Location based filtering' },
                { icon: '💰', text: 'Salary data included' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', alignItems: 'flex-start' }}>
                  <span>{s.icon}</span><span>{s.text}</span>
                </div>
              ))}
              {activeTier === 'direct' && [
                { icon: '🎯', text: 'Direct from company career pages' },
                { icon: '✨', text: 'Freshest listings — no middleman' },
                { icon: '🔄', text: 'Cross source deduplication' },
                { icon: '📋', text: 'Full job descriptions and requirements' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', alignItems: 'flex-start' }}>
                  <span>{s.icon}</span><span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
        )}

        {/* Find Jobs Button */}
        <button onClick={handleFindJobs} disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? 'rgba(255,255,255,0.1)' : getBtnGradient(), color: loading ? 'rgba(255,255,255,0.4)' : getBtnColor(), border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '40px', letterSpacing: '-0.3px', transition: 'all 0.2s' }}>
          {loading
            ? '🔍 Finding your perfect jobs...'
            : activeTier === 'broad'
              ? `🌐 Broad Search — ₹19`
              : activeTier === 'smart'
                ? `🔍 Smart Search — ₹29`
                : `🎯 Direct Search — ₹39`}
        </button>

        {/* Profile Card */}
        {profile && (
          <div style={{ background: activeTierData.bgColor, border: `1px solid ${activeTierData.borderColor}`, borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: activeTierData.color, letterSpacing: '1.5px', marginBottom: '14px' }}>YOUR AI EXTRACTED PROFILE</div>
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
                <span key={i} style={{ background: activeTierData.bgColor, color: activeTierData.color, border: `1px solid ${activeTierData.borderColor}`, padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* No jobs found */}
        {searched && jobs.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>😔</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>No jobs found this time</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Try a different location or switch to another search type.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setSearched(false); setError(''); runJobSearch(activeTier) }} style={{ background: getBtnGradient(), color: getBtnColor(), border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                🔄 Retry — free
              </button>
              <button onClick={() => { setSearched(false); setProfile(null); setResumeText(''); setUploadedFileName(''); setLocation('') }} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Try different resume
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '20px' }}>Retry is free — you already paid for this search</p>
          </div>
        )}

        {/* Job Results */}
        {jobs.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>{jobs.length} jobs found for you</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: activeTierData.bgColor, border: `1px solid ${activeTierData.borderColor}`, padding: '6px 14px', borderRadius: '20px' }}>
                <span style={{ fontSize: '14px' }}>{activeTierData.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: activeTierData.color }}>{activeTierData.name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jobs.map((job, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', transition: 'border-color 0.2s, background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = activeTierData.borderColor; e.currentTarget.style.background = activeTierData.bgColor }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>{job.job_title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: activeTierData.color, fontWeight: '600' }}>{job.employer_name}</span>
                        {job.job_city && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>📍 {job.job_city}{job.job_country ? ', ' + job.job_country : ''}</span>}
                        {job.job_employment_type && <span style={{ fontSize: '11px', fontWeight: '700', background: activeTierData.bgColor, color: activeTierData.color, border: `1px solid ${activeTierData.borderColor}`, padding: '2px 8px', borderRadius: '20px' }}>{job.job_employment_type}</span>}
                        {job.job_is_remote && <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: '20px' }}>🏠 Remote</span>}
                      </div>
                    </div>
                    {job.employer_logo && <img src={job.employer_logo} alt={job.employer_name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#fff', padding: '4px', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />}
                  </div>

                  {job.job_description && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.job_description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}

                  <div className="job-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{getPostedDate(job.job_posted_at_timestamp)}</span>
                      {job.job_min_salary && <span style={{ fontSize: '12px', color: '#4ade80' }}>💰 {job.job_min_salary}{job.job_max_salary ? ' - ' + job.job_max_salary : ''} {job.job_salary_currency || ''}</span>}
                    </div>
                    <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer" style={{ background: getBtnGradient(), color: getBtnColor(), border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                      Apply now
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { setJobs([]); setProfile(null); setSearched(false); setResumeText(''); setUploadedFileName('') }} style={{ width: '100%', padding: '14px', marginTop: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Search with different resume
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobFinder