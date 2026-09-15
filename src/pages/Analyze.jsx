import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractTextFromPDF } from '../pdfUtils'
import genieIcon from '../assets/genie-icon.png'
import { useAuth } from '../useAuth'
import { supabase } from '../supabase'

function Analyze() {
  const navigate = useNavigate()
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [coverLoading, setCoverLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [fullRewrite, setFullRewrite] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [interview, setInterview] = useState(null)
  const [coverLetter, setCoverLetter] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('keywords')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const { user, signOut } = useAuth()

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

  const checkAndUpdateLimit = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('analyses_today, last_analysis_date')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          plan: 'free',
          analyses_today: 1,
          last_analysis_date: new Date().toISOString().split('T')[0]
        })
        return true
      }

      const today = new Date().toISOString().split('T')[0]
      const lastDate = profile.last_analysis_date

      if (lastDate !== today) {
        await supabase
          .from('profiles')
          .update({ analyses_today: 1, last_analysis_date: today })
          .eq('id', user.id)
        return true
      }

      if (profile.analyses_today >= 3) return false

      await supabase
        .from('profiles')
        .update({ analyses_today: profile.analyses_today + 1 })
        .eq('id', user.id)
      return true

    } catch (err) {
      console.error('Limit check failed:', err)
      return true
    }
  }

  const saveAnalysis = async (parsed, jd) => {
    try {
      const lines = jd.split('\n').filter(l => l.trim()).slice(0, 3).join(' ')
      const jobTitle = lines.substring(0, 60)
      await supabase.from('analyses').insert({
        user_id: user.id,
        job_title: jobTitle,
        match_score: parsed.matchScore,
        ats_score: parsed.atsScore,
        readability_score: parsed.readabilityScore,
        missing_keywords: parsed.missingKeywords,
        present_keywords: parsed.presentKeywords
      })
    } catch (err) {
      console.error('Failed to save analysis:', err)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText) { setError('Please paste or upload your resume'); return }
    if (!jdText) { setError('Please paste the job description'); return }

    if (!user) {
      setError('Please sign in to analyze your resume')
      setTimeout(() => navigate('/login'), 1500)
      return
    }

    setError('')
    const allowed = await checkAndUpdateLimit()
    if (!allowed) {
      setError('🔒 You have used your 3 free analyses for today. Come back tomorrow or upgrade for unlimited access.')
      return
    }

    setLoading(true)
    setFullRewrite(null)
    setRoadmap(null)
    setInterview(null)
    setCoverLetter(null)

    try {
      const prompt = `Analyze the resume against the job description and return ONLY a valid JSON object with no extra text, no markdown, no backticks:
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
Provide 3 rewritten bullet points.

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
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are Career Genie, an expert AI resume coach for Indian students. Always return valid JSON only.' },
            { role: 'user', content: prompt }
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
      await saveAnalysis(parsed, jdText)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const runFullRewrite = async () => {
    setRewriting(true)
    setError('')
    try {
      const prompt = `Rewrite the entire resume to perfectly match the job description. Return ONLY valid JSON no markdown no backticks:
{
  "name": "<candidate full name>",
  "email": "<email from resume exact>",
  "phone": "<phone from resume exact>",
  "linkedin": "<linkedin URL from resume if present else empty string>",
  "location": "<city from resume if present else empty string>",
  "summary": "<rewritten professional summary — 3 strong specific sentences>",
  "experience": [
    {
      "company": "<company name>",
      "role": "<job title>",
      "duration": "<e.g. Jan 2023 – Present>",
      "location": "<city if available else empty string>",
      "bullets": ["<action verb led quantified bullet>", "<bullet 2>", "<bullet 3>"]
    }
  ],
  "education": [
    {
      "degree": "<full degree name and specialisation>",
      "institution": "<institution name>",
      "year": "<e.g. Aug 2020 – June 2024>",
      "score": "<CGPA or percentage if available>",
      "location": "<city if available else empty string>"
    }
  ],
  "projects": [
    {
      "name": "<project name>",
      "tech": "<tech stack used>",
      "duration": "<duration if available>",
      "bullets": ["<what was built and impact>", "<bullet 2>"]
    }
  ],
  "achievements": ["<certification or achievement 1>", "<certification or achievement 2>"],
  "skills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>", "<skill 6>", "<skill 7>", "<skill 8>"],
  "skillCategories": [
    {"label": "<e.g. Programming Languages>", "items": ["<skill 1>", "<skill 2>"]},
    {"label": "<e.g. Frameworks>", "items": ["<skill 1>", "<skill 2>"]},
    {"label": "<e.g. Tools>", "items": ["<skill 1>", "<skill 2>"]}
  ],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

Rules:
- Extract ALL sections present in resume including projects and certifications
- Keep all real experience — do not fabricate
- Rewrite bullets to be quantified action verb led and keyword rich
- Add missing keywords from JD naturally
- Extract contact details exactly as they appear
- Group skills logically by type in skillCategories

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
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are Career Genie, an expert resume writer. Always return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      setFullRewrite(JSON.parse(clean))
      setActiveTab('fullrewrite')

    } catch (err) {
      setError('Rewrite failed. Please try again.')
      console.error(err)
    } finally {
      setRewriting(false)
    }
  }

  const handleFullRewrite = async () => {
    if (!resumeText || !jdText) return
    if (!user) { setError('Please sign in to use Full Rewrite'); navigate('/login'); return }
    await runFullRewrite()
  }

  const handleGenerateRoadmap = async () => {
    if (!resumeText || !jdText || !results) return
    if (!user) { setError('Please sign in'); navigate('/login'); return }
    setRoadmapLoading(true)
    setError('')
    try {
      const prompt = `Create a personalized 4 week career roadmap. Return ONLY valid JSON no markdown no backticks:
{
  "targetRole": "<job title>",
  "candidateName": "<name>",
  "overallGoal": "<one sentence goal>",
  "weeks": [
    {
      "week": 1,
      "theme": "<theme>",
      "goal": "<weekly goal>",
      "days": [
        {"day": "Day 1-2", "task": "<task>", "resource": "<free resource>", "outcome": "<outcome>"},
        {"day": "Day 3-4", "task": "<task>", "resource": "<free resource>", "outcome": "<outcome>"},
        {"day": "Day 5-7", "task": "<task>", "resource": "<free resource>", "outcome": "<outcome>"}
      ],
      "weeklyMilestone": "<milestone>"
    }
  ],
  "finalOutcome": "<4 week outcome>",
  "quickWins": ["<win 1>", "<win 2>", "<win 3>"]
}
RESUME: ${resumeText}
JOB DESCRIPTION: ${jdText}
MISSING KEYWORDS: ${results?.missingKeywords?.join(', ')}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are Career Genie, an expert career coach. Always return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      setRoadmap(JSON.parse(clean))
      setActiveTab('roadmap')
    } catch (err) {
      setError('Roadmap generation failed. Please try again.')
      console.error(err)
    } finally {
      setRoadmapLoading(false)
    }
  }

  const handleGenerateInterview = async () => {
    if (!resumeText || !jdText || !results) return
    if (!user) { setError('Please sign in'); navigate('/login'); return }
    setInterviewLoading(true)
    setError('')
    try {
      const prompt = `Generate likely interview questions. Return ONLY valid JSON no markdown no backticks:
{
  "role": "<job title>",
  "categories": [
    {
      "name": "<category>",
      "questions": [
        {
          "question": "<interview question>",
          "why": "<why interviewers ask this>",
          "tip": "<how to answer>",
          "sampleAnswer": "<brief sample structure>"
        }
      ]
    }
  ],
  "gapQuestions": [
    {"question": "<gap question>", "how": "<how to handle>"}
  ]
}
3 categories with 3 questions each. 2 gap questions.
RESUME: ${resumeText}
JOB DESCRIPTION: ${jdText}
MISSING KEYWORDS: ${results?.missingKeywords?.join(', ')}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are Career Genie, an expert interview coach. Always return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      setInterview(JSON.parse(clean))
      setActiveTab('interview')
    } catch (err) {
      setError('Interview prep generation failed. Please try again.')
      console.error(err)
    } finally {
      setInterviewLoading(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!resumeText || !jdText || !results) return
    if (!user) { setError('Please sign in'); navigate('/login'); return }
    setCoverLoading(true)
    setError('')
    try {
      const prompt = `Write a professional cover letter. Return ONLY valid JSON no markdown no backticks:
{
  "candidateName": "<name>",
  "role": "<job title>",
  "company": "<company name if available else Target Company>",
  "subject": "<email subject line>",
  "letter": "<full cover letter 3 to 4 paragraphs honest specific 250 to 300 words>",
  "keyPoints": ["<strength 1>", "<strength 2>", "<strength 3>"]
}
RESUME: ${resumeText}
JOB DESCRIPTION: ${jdText}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are Career Genie, an expert career writer. Always return valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5
        })
      })

      const data = await response.json()
      const raw = data.choices[0].message.content
      const clean = raw.replace(/```json|```/g, '').trim()
      setCoverLetter(JSON.parse(clean))
      setActiveTab('cover')
    } catch (err) {
      setError('Cover letter generation failed. Please try again.')
      console.error(err)
    } finally {
      setCoverLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!fullRewrite) return

    const rawName = fullRewrite.name || 'Your Name'
    const nameFmt = rawName.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')

    const contactParts = [
      fullRewrite.phone,
      fullRewrite.email,
      fullRewrite.linkedin,
      fullRewrite.location
    ].filter(Boolean)

    const html = `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>${nameFmt} — Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      color: #111;
      background: #fff;
      width: 210mm;
      margin: 0 auto;
    }
    .page {
      width: 210mm;
      padding: 18mm 18mm 28mm 18mm;
    }
    .name {
      text-align: center;
      font-size: 22pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .contact {
      text-align: center;
      font-size: 9.5pt;
      color: #444;
      margin-bottom: 2px;
    }
    .section-header {
      font-size: 10pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-top: 0.8px solid #bbb;
      padding-top: 5px;
      margin-bottom: 7px;
      margin-top: 14px;
      color: #111;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .bold { font-weight: bold; font-size: 10.5pt; }
    .italic { font-style: italic; font-size: 10pt; color: #333; }
    .date {
      font-size: 9.5pt;
      color: #444;
      white-space: nowrap;
      padding-left: 12px;
      flex-shrink: 0;
    }
    .location-right {
      font-size: 9.5pt;
      color: #444;
      white-space: nowrap;
      padding-left: 12px;
      flex-shrink: 0;
      font-style: italic;
    }
    .exp-block {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .bullets {
      margin-top: 4px;
      padding-left: 0;
      list-style: none;
    }
    .bullets li {
      display: flex;
      gap: 7px;
      margin-bottom: 3px;
      font-size: 10pt;
      line-height: 1.45;
      color: #222;
    }
    .bullets li .dot { flex-shrink: 0; }
    .project-tech {
      font-weight: normal;
      font-style: italic;
      font-size: 10pt;
      color: #444;
    }
    .skill-row {
      font-size: 10pt;
      margin-bottom: 4px;
      line-height: 1.5;
    }
    .skill-label { font-weight: bold; }
    .ach-list { list-style: none; padding: 0; }
    .ach-list li {
      display: flex;
      gap: 7px;
      margin-bottom: 3px;
      font-size: 10pt;
      line-height: 1.45;
    }
    .bottom-spacer {
      height: 24mm;
      display: block;
    }
    @page {
      size: A4;
      margin: 0;
    }
    @page :first {
      margin: 0;
    }
    @page :left {
      margin-top: 18mm;
    }
    @page :right {
      margin-top: 18mm;
    }
    .page-break-spacer {
      height: 18mm;
      display: block;
    }
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
      }
      .page {
        padding: 18mm 18mm 28mm 18mm;
      }
      .exp-block {
        page-break-inside: avoid;
      }
    }
  </style>
  </head>
  <body>
  <div class="page">

    <div class="name">${nameFmt}</div>
    ${contactParts.length > 0 ? `<div class="contact">${contactParts.join(' &nbsp;|&nbsp; ')}</div>` : ''}

    ${fullRewrite.education && fullRewrite.education.length > 0 ? `
    <div class="section-header">Education</div>
    ${fullRewrite.education.map(edu => `
      <div class="exp-block">
        <div class="row">
          <div class="bold">${edu.institution || ''}</div>
          <div class="date">${edu.location || ''}</div>
        </div>
        <div class="row">
          <div class="italic">${[edu.degree, edu.score ? `CGPA: ${edu.score}` : ''].filter(Boolean).join('; ')}</div>
          <div class="date">${edu.year || ''}</div>
        </div>
      </div>
    `).join('')}` : ''}

    ${fullRewrite.experience && fullRewrite.experience.length > 0 ? `
    <div class="section-header">Experience</div>
    ${fullRewrite.experience.map(exp => `
      <div class="exp-block">
        <div class="row">
          <div class="bold">${exp.role || ''}</div>
          <div class="date">${exp.duration || ''}</div>
        </div>
        <div class="row">
          <div class="italic">${exp.company || ''}</div>
          <div class="location-right">${exp.location || ''}</div>
        </div>
        ${exp.bullets && exp.bullets.length > 0 ? `
        <ul class="bullets">
          ${exp.bullets.map(b => `<li><span class="dot">•</span><span>${b.startsWith('•') ? b.substring(1).trim() : b}</span></li>`).join('')}
        </ul>` : ''}
      </div>
    `).join('')}` : ''}

    ${fullRewrite.projects && fullRewrite.projects.length > 0 ? `
    <div class="section-header">Projects</div>
    ${fullRewrite.projects.map(proj => `
      <div class="exp-block">
        <div class="row">
          <div class="bold">${proj.name || ''} ${proj.tech ? `<span class="project-tech"> | ${proj.tech}</span>` : ''}</div>
          <div class="date">${proj.duration || ''}</div>
        </div>
        ${proj.bullets && proj.bullets.length > 0 ? `
        <ul class="bullets">
          ${proj.bullets.map(b => `<li><span class="dot">•</span><span>${b.startsWith('•') ? b.substring(1).trim() : b}</span></li>`).join('')}
        </ul>` : ''}
      </div>
    `).join('')}` : ''}

    ${fullRewrite.achievements && fullRewrite.achievements.length > 0 ? `
    <div class="section-header">Certifications / Achievements</div>
    <ul class="ach-list">
      ${fullRewrite.achievements.map(a => `<li><span class="dot">•</span><span>${a.startsWith('•') ? a.substring(1).trim() : a}</span></li>`).join('')}
    </ul>` : ''}

    ${(fullRewrite.skillCategories && fullRewrite.skillCategories.length > 0) || (fullRewrite.skills && fullRewrite.skills.length > 0) ? `
    <div class="section-header">Technical Skills</div>
    ${fullRewrite.skillCategories && fullRewrite.skillCategories.length > 0
      ? fullRewrite.skillCategories.map(cat => `
        <div class="skill-row">
          <span class="skill-label">${cat.label}: </span>
          <span>${(cat.items || []).join(', ')}</span>
        </div>`).join('')
      : `<div class="skill-row">${(fullRewrite.skills || []).join('  •  ')}</div>`
    }` : ''}

    <div class="bottom-spacer"></div>

  </div>
  </body>
  </html>`

    const printWindow = window.open('', '_blank')
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 600)
  }

  const scoreColor = (val) => val >= 75 ? '#22c55e' : val >= 50 ? '#f5c518' : '#ef4444'
  const scoreGlow = (val) => val >= 75 ? 'rgba(34,197,94,0.3)' : val >= 50 ? 'rgba(245,197,24,0.3)' : 'rgba(239,68,68,0.3)'
  const scoreLabel = (val) => val >= 75 ? 'Excellent' : val >= 50 ? 'Needs work' : 'Poor'

  const tabs = [
    'keywords', 'ats', 'rewrite',
    ...(fullRewrite ? ['fullrewrite'] : []),
    ...(roadmap ? ['roadmap'] : []),
    ...(interview ? ['interview'] : []),
    ...(coverLetter ? ['cover'] : [])
  ]

  const tabLabels = {
    keywords: '🔑 Keywords',
    ats: '🛡️ ATS',
    rewrite: '✍️ Rewrite',
    fullrewrite: '🚀 Full Resume',
    roadmap: '📅 Roadmap',
    interview: '🎤 Interview',
    cover: '📝 Cover Letter'
  }

  const weekColors = [
    { bg: '99,102,241', text: '#6366f1', grad: '#6366f1, #4338ca', dark: false },
    { bg: '245,197,24', text: '#f5c518', grad: '#f5c518, #e8a200', dark: true },
    { bg: '34,197,94', text: '#22c55e', grad: '#22c55e, #16a34a', dark: false },
    { bg: '167,139,250', text: '#a78bfa', grad: '#a78bfa, #7c3aed', dark: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .analyze-nav { padding: 14px 20px !important; }
          .analyze-main { padding: 24px 16px !important; }
          .analyze-h1 { font-size: 26px !important; }
          .analyze-grid { grid-template-columns: 1fr !important; }
          .btn-row { grid-template-columns: 1fr !important; }
          .score-grid { gap: 8px !important; }
          .score-number { font-size: 32px !important; }
          .score-card { padding: 16px 10px !important; }
          .tabs-row { flex-wrap: wrap !important; gap: 4px !important; }
          .tab-btn { font-size: 11px !important; padding: 8px 6px !important; }
          .tab-content { padding: 16px !important; }
          .download-row { flex-direction: column !important; gap: 12px !important; }
          .day-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav className="analyze-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 60px', background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/jobs')} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>🚀 Job Finder</button>
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

      <div className="analyze-main" style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 className="analyze-h1" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '10px', background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Analyze your resume
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '15px', marginBottom: '12px' }}>
            Upload your PDF or paste your resume — get your full AI analysis, rewrite, roadmap, interview prep and cover letter.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '6px 14px', borderRadius: '20px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80' }}>3 free analyses per day</span>
            </div>
            {user && (
              <div onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#f5c518' }}>📊 View history</span>
              </div>
            )}
          </div>
        </div>

        {/* Input Grid */}
        <div className="analyze-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>📄 YOUR RESUME</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(245,197,24,0.08)', border: '1px dashed rgba(245,197,24,0.3)', borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', marginBottom: '12px', position: 'relative', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ fontSize: '20px' }}>📎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f5c518' }}>{pdfLoading ? 'Reading PDF...' : uploadedFileName ? uploadedFileName : 'Upload PDF resume'}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{uploadedFileName ? 'Text extracted ✓' : 'Tap to upload — PDF only'}</div>
              </div>
              <input type='file' accept='application/pdf' onChange={handlePDFUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }} />
            </label>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', textAlign: 'center' }}>— or paste text below —</div>
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder='Paste your full resume text here...' style={{ width: '100%', height: '200px', padding: '0', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.75)', resize: 'none', outline: 'none', lineHeight: '1.7', boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>💼 JOB DESCRIPTION</label>
            <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder='Paste the full job description here...' style={{ width: '100%', height: '300px', padding: '0', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.75)', resize: 'none', outline: 'none', lineHeight: '1.7', boxSizing: 'border-box' }} />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span>{error}</span>
            {error.includes('🔒') && (
              <button onClick={() => navigate('/pricing')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Upgrade</button>
            )}
          </div>
        )}

        {/* Buttons Row */}
        <div className="btn-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', marginBottom: '48px' }}>
          <button onClick={handleAnalyze} disabled={loading} style={{ padding: '18px', background: loading ? 'rgba(245,197,24,0.3)' : 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 40px rgba(245,197,24,0.25)', transition: 'all 0.2s' }}>
            {loading ? '⏳ Analyzing...' : '✨ Analyze my resume'}
          </button>
          <button onClick={handleFullRewrite} disabled={rewriting || !results} style={{ padding: '18px 20px', background: rewriting ? 'rgba(139,92,246,0.2)' : !results ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.15)', color: !results ? 'rgba(255,255,255,0.2)' : '#a78bfa', border: `1px solid ${!results ? 'rgba(255,255,255,0.06)' : 'rgba(139,92,246,0.3)'}`, borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: rewriting || !results ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {rewriting ? '⏳...' : '🚀 Full Rewrite'}
          </button>
          <button onClick={handleGenerateRoadmap} disabled={roadmapLoading || !results} style={{ padding: '18px 20px', background: roadmapLoading ? 'rgba(245,197,24,0.2)' : !results ? 'rgba(255,255,255,0.04)' : 'rgba(245,197,24,0.12)', color: !results ? 'rgba(255,255,255,0.2)' : '#f5c518', border: `1px solid ${!results ? 'rgba(255,255,255,0.06)' : 'rgba(245,197,24,0.3)'}`, borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: roadmapLoading || !results ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {roadmapLoading ? '⏳...' : '📅 Roadmap'}
          </button>
          <button onClick={handleGenerateInterview} disabled={interviewLoading || !results} style={{ padding: '18px 20px', background: interviewLoading ? 'rgba(34,197,94,0.2)' : !results ? 'rgba(255,255,255,0.04)' : 'rgba(34,197,94,0.12)', color: !results ? 'rgba(255,255,255,0.2)' : '#4ade80', border: `1px solid ${!results ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.3)'}`, borderRadius: '14px', fontSize: '14px', fontWeight: '800', cursor: interviewLoading || !results ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            {interviewLoading ? '⏳...' : '🎤 Interview'}
          </button>
        </div>

        {/* Cover letter button */}
        {results && !coverLetter && (
          <button onClick={handleGenerateCoverLetter} disabled={coverLoading} style={{ width: '100%', padding: '14px', marginTop: '-36px', marginBottom: '24px', background: coverLoading ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: coverLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {coverLoading ? '⏳ Writing cover letter...' : '📝 Generate cover letter — Free'}
          </button>
        )}

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
                <div className="score-card" key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${scoreGlow(s.value).replace('0.3', '0.2')}`, borderRadius: '20px', padding: '28px 20px', textAlign: 'center', boxShadow: `0 0 40px ${scoreGlow(s.value)}` }}>
                  <div className="score-number" style={{ fontSize: '52px', fontWeight: '900', letterSpacing: '-3px', color: scoreColor(s.value), lineHeight: '1' }}>{s.value}%</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '8px 0 4px' }}>{s.label}</div>
                  <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: '700', color: scoreColor(s.value), background: scoreGlow(s.value).replace('0.3', '0.1'), padding: '3px 10px', borderRadius: '20px' }}>{scoreLabel(s.value)}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="tabs-row" style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '6px' }}>
              {tabs.map(tab => (
                <button className="tab-btn" key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px 12px', background: activeTab === tab ? 'rgba(245,197,24,0.12)' : 'transparent', border: activeTab === tab ? '1px solid rgba(245,197,24,0.25)' : '1px solid transparent', borderRadius: '10px', color: activeTab === tab ? '#f5c518' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>

              {activeTab === 'keywords' && (
                <div>
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Missing keywords — add these to your resume</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {results.missingKeywords.map((k, i) => (
                        <span key={i} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>✗ {k}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Keywords you already have</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {results.presentKeywords.map((k, i) => (
                        <span key={i} style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>✓ {k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ats' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c518' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Fix these issues to pass ATS filters</h3>
                  </div>
                  {results.atsIssues.map((issue, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px 0', borderBottom: i < results.atsIssues.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚠</div>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.65', margin: 0 }}>{issue}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'rewrite' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>AI-upgraded bullet points</h3>
                  </div>
                  {results.rewrites.map((r, i) => (
                    <div key={i} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: i < results.rewrites.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>BEFORE</div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.65', marginBottom: '12px' }}>{r.original}</div>
                      <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: '#4ade80', marginBottom: '8px' }}>AFTER — AI IMPROVED</div>
                      <div style={{ background: 'rgba(34,197,94,0.06)', padding: '14px 16px', borderRadius: '0 10px 10px 0', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.65', borderLeft: '3px solid #22c55e' }}>{r.improved}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'fullrewrite' && fullRewrite && (
                <div>
                  <div className="download-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Your fully rewritten resume</h3>
                    </div>
                    <button onClick={handleDownloadPDF} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>⬇ Download PDF</button>
                  </div>

                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>{fullRewrite.name}</div>
                  {(fullRewrite.phone || fullRewrite.email || fullRewrite.linkedin || fullRewrite.location) && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                      {[fullRewrite.phone, fullRewrite.email, fullRewrite.linkedin, fullRewrite.location].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  {fullRewrite.summary && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: '8px', marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '8px' }}>SUMMARY</div>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', margin: 0 }}>{fullRewrite.summary}</p>
                    </div>
                  )}

                  {fullRewrite.education && fullRewrite.education.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '12px' }}>EDUCATION</div>
                      {fullRewrite.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{edu.institution}</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{edu.degree} {edu.score ? `· CGPA: ${edu.score}` : ''} · {edu.year}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {fullRewrite.experience && fullRewrite.experience.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '12px' }}>EXPERIENCE</div>
                      {fullRewrite.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '18px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{exp.role}</div>
                          <div style={{ fontSize: '13px', color: '#f5c518', marginBottom: '6px' }}>{exp.company} · {exp.duration}</div>
                          {(exp.bullets || []).map((b, j) => (
                            <div key={j} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '4px', paddingLeft: '14px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#a78bfa' }}>•</span>{b}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {fullRewrite.projects && fullRewrite.projects.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '12px' }}>PROJECTS</div>
                      {fullRewrite.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{proj.name} {proj.tech && <span style={{ fontWeight: '400', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>| {proj.tech}</span>}</div>
                          {(proj.bullets || []).map((b, j) => (
                            <div key={j} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '4px', paddingLeft: '14px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#a78bfa' }}>•</span>{b}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {fullRewrite.achievements && fullRewrite.achievements.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '10px' }}>CERTIFICATIONS / ACHIEVEMENTS</div>
                      {fullRewrite.achievements.map((item, i) => (
                        <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', paddingLeft: '14px', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#a78bfa' }}>•</span>{item}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1.5px', marginBottom: '10px' }}>SKILLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(fullRewrite.skills || []).map((skill, i) => (
                        <span key={i} style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#4ade80', letterSpacing: '1px', marginBottom: '8px' }}>WHAT WE IMPROVED</div>
                    {(fullRewrite.improvements || []).map((imp, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>✓ {imp}</div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'roadmap' && roadmap && (
                <div>
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c518' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Your personalised 4 week roadmap</h3>
                    </div>
                    <div style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '12px', color: '#f5c518', fontWeight: '700', marginBottom: '4px' }}>🎯 YOUR GOAL</div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{roadmap.overallGoal}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e', letterSpacing: '1px', marginBottom: '12px' }}>⚡ DO THESE TODAY</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(roadmap.quickWins || []).map((win, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '12px 16px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#22c55e' }}>{i + 1}</div>
                          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>{win}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(roadmap.weeks || []).map((week, wi) => {
                    const wc = weekColors[wi] || weekColors[0]
                    return (
                      <div key={wi} style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, background: `linear-gradient(135deg, ${wc.grad})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: wc.dark ? '#000' : '#fff' }}>W{week.week}</div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>Week {week.week} — {week.theme}</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{week.goal}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                          {(week.days || []).map((day, di) => (
                            <div key={di} className="day-grid" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: wc.text }}>{day.day}</div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>{day.task}</div>
                                {day.resource && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>📚 {day.resource}</div>}
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.5' }}>✓ {day.outcome}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: `rgba(${wc.bg},0.08)`, border: `1px solid rgba(${wc.bg},0.2)`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>🏆</span>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '2px' }}>WEEK {week.week} MILESTONE</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{week.weeklyMilestone}</div>
                          </div>
                        </div>
                        {wi < 3 && <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 4px' }}><div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.15)' }}>↓</div></div>}
                      </div>
                    )
                  })}
                  <div style={{ background: 'linear-gradient(135deg, rgba(245,197,24,0.1), rgba(139,92,246,0.08))', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#f5c518', letterSpacing: '1px', marginBottom: '8px' }}>AFTER 4 WEEKS YOU WILL HAVE</div>
                    <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7' }}>{roadmap.finalOutcome}</div>
                  </div>
                </div>
              )}

              {activeTab === 'interview' && interview && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Likely interview questions for {interview.role}</h3>
                  </div>
                  {(interview.categories || []).map((cat, ci) => (
                    <div key={ci} style={{ marginBottom: '28px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#22c55e', letterSpacing: '1px', marginBottom: '16px' }}>{cat.name.toUpperCase()}</div>
                      {(cat.questions || []).map((q, qi) => (
                        <div key={qi} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Q{qi + 1}. {q.question}</div>
                          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#4ade80', letterSpacing: '0.5px', marginBottom: '4px' }}>💡 WHY THEY ASK THIS</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{q.why}</div>
                          </div>
                          <div style={{ background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#f5c518', letterSpacing: '0.5px', marginBottom: '4px' }}>🎯 HOW TO ANSWER</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{q.tip}</div>
                          </div>
                          <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', letterSpacing: '0.5px', marginBottom: '4px' }}>✍️ SAMPLE STRUCTURE</div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{q.sampleAnswer}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {interview.gapQuestions && interview.gapQuestions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', letterSpacing: '1px', marginBottom: '16px' }}>⚠ TOUGH QUESTIONS — GAPS IN YOUR PROFILE</div>
                      {interview.gapQuestions.map((q, i) => (
                        <div key={i} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '18px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>{q.question}</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                            <span style={{ color: '#f87171', fontWeight: '700' }}>How to handle: </span>{q.how}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cover' && coverLetter && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Your cover letter</h3>
                    </div>
                    <button onClick={() => {
                      const text = `Subject: ${coverLetter.subject}\n\n${coverLetter.letter}`
                      navigator.clipboard.writeText(text)
                        .then(() => alert('Cover letter copied!'))
                        .catch(() => alert('Please select and copy manually.'))
                    }} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                      📋 Copy to clipboard
                    </button>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#818cf8', letterSpacing: '0.5px', marginBottom: '4px' }}>EMAIL SUBJECT</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{coverLetter.subject}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>{coverLetter.letter}</div>
                  </div>
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#4ade80', letterSpacing: '1px', marginBottom: '10px' }}>WHY THIS WORKS FOR YOU</div>
                    {(coverLetter.keyPoints || []).map((point, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>✓ {point}</div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <button onClick={() => { setResults(null); setResumeText(''); setJdText(''); setFullRewrite(null); setUploadedFileName(''); setRoadmap(null); setInterview(null); setCoverLetter(null) }} style={{ width: '100%', padding: '14px', marginTop: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Analyze another resume
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analyze