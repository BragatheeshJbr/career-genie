import { useNavigate } from 'react-router-dom'
import genieIcon from '../assets/genie-icon.png'

// Policy pages: Privacy, Terms, Refund, Contact.
// Each is a named export; routes are added in App.jsx.

const OPERATOR = 'Bragatheesh J'
const EMAIL = 'careergeniesupport@gmail.com'
const LOCATION = 'Chennai, Tamil Nadu, India'
const UPDATED = '25 November 2026'

function LegalLayout({ title, children }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .legal h2 { font-size: 18px; font-weight: 800; color: #fff; margin: 32px 0 10px; }
        .legal p, .legal li { font-size: 15px; color: rgba(255,255,255,0.65); line-height: 1.75; }
        .legal p { margin: 0 0 12px; }
        .legal ul { margin: 0 0 12px; padding-left: 20px; }
        .legal li { margin-bottom: 6px; }
        .legal a { color: #f5c518; }
        .legal b { color: rgba(255,255,255,0.9); }
        @media (max-width: 768px) {
          .legal-nav { padding: 14px 20px !important; }
          .legal-h1 { font-size: 30px !important; }
        }
      `}</style>

      <nav className="legal-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 60px', background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Analyze Resume</button>
      </nav>

      <main className="legal" style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 20px 72px' }}>
        <h1 className="legal-h1" style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-1.5px', margin: '0 0 8px' }}>{title}</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 28px' }}>Last updated: {UPDATED}</p>
        {children}
      </main>
    </div>
  )
}

// ---------------- Privacy Policy ----------------
export function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>Career Genie ("we", "us") is an online resume coach for students and job seekers, operated by {OPERATOR} from {LOCATION}. This policy explains what information we collect, why, and how we protect it.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address and, if you provide it, your name. These are used to sign you in.</li>
        <li><b>Resume and job descriptions:</b> the resume text you upload or paste, and the job descriptions you analyse.</li>
        <li><b>Results we generate:</b> scores, rewrites, roadmaps, interview questions and cover letters, so you can see your history.</li>
        <li><b>Payment records:</b> the payment ID, amount and status of searches you pay for. <b>We never see or store your card, UPI or bank details</b>; payments are handled entirely by Razorpay.</li>
        <li><b>Usage data:</b> basic events such as searches run, analyses completed and downloads, used to improve the product and enforce daily limits.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the service: analysing your resume, finding jobs and generating results.</li>
        <li>To verify payments and prevent misuse (for example, one payment unlocking one search).</li>
        <li>To enforce free-tier limits and to fix problems.</li>
        <li>To reply when you contact us.</li>
      </ul>
      <p>We do <b>not</b> sell your personal information or use it for advertising.</p>

      <h2>Services we rely on</h2>
      <p>To run Career Genie we share only the information each service needs:</p>
      <ul>
        <li><b>Supabase</b>: account sign-in and secure data storage.</li>
        <li><b>Groq</b>: AI processing of your resume and job descriptions to generate results.</li>
        <li><b>Job search providers</b> (Adzuna, JSearch, JobsPipe): receive only the job title and location we search for, <b>not</b> your resume.</li>
        <li><b>Razorpay</b>: payment processing.</li>
        <li><b>Vercel</b>: website hosting.</li>
      </ul>
      <p>Some of these providers may process data outside India. Each is bound by its own privacy and security terms.</p>

      <h2>Storage and security</h2>
      <p>Data is sent over encrypted connections (HTTPS). API keys and payment checks are handled on our servers, never in your browser. Your browser may store small items (such as your login session and your last job search in the current tab) to keep the site working.</p>

      <h2>Your choices</h2>
      <p>You can ask us to show you, correct or delete your account and data at any time by emailing <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We respond within 7 working days. Payment records may be kept as long as required for tax and legal purposes.</p>

      <h2>Children</h2>
      <p>Career Genie is meant for users aged 18 and above.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date at the top of this page.</p>

      <h2>Contact</h2>
      <p>Questions about privacy: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </LegalLayout>
  )
}

// ---------------- Terms of Service ----------------
export function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p>These terms apply to your use of Career Genie, operated by {OPERATOR} from {LOCATION}. By using the website, you agree to them.</p>

      <h2>What Career Genie does</h2>
      <p>Career Genie helps you improve your resume for specific jobs. It offers free AI resume analysis (ATS score, match score, keyword gaps, rewrites, a skill roadmap, interview preparation and cover letters, up to 3 times a day) and paid job searches (Broad ₹19, Smart ₹29, Global ₹39 per search), which show job listings with Top 3 picks for your profile.</p>

      <h2>No guarantee of a job or interview</h2>
      <p><b>We do not guarantee that you will get an interview, job or offer.</b> Hiring decisions are made by employers. Our goal is to help make sure your resume is not the reason you are filtered out.</p>

      <h2>AI-generated content</h2>
      <p>Scores, rewrites and suggestions are generated by AI and may contain mistakes. Please review everything before you use it. You are responsible for making sure your resume and applications are accurate and truthful. Do not add skills or experience you do not have.</p>

      <h2>Job listings</h2>
      <p>Job listings come from third-party job boards and company career pages. We do not employ, represent or verify these employers, and you apply on their websites. Listings may be outdated, removed or inaccurate. Overseas jobs shown in Global Search usually require a work visa.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 18 or older and provide a valid email address.</li>
        <li>Keep your login secure. You are responsible for activity on your account.</li>
        <li>Do not misuse the service: no automated scraping, attempts to bypass payments or limits, or uploading content you have no right to share.</li>
      </ul>
      <p>We may suspend accounts that misuse the service.</p>

      <h2>Payments</h2>
      <p>Paid searches are one-time payments processed by Razorpay. There are no subscriptions or automatic renewals. Prices are in Indian Rupees and shown before you pay. Refunds follow our <a href="/refund">Refund Policy</a>.</p>

      <h2>Limitation of liability</h2>
      <p>Career Genie is provided "as is". To the extent the law allows, we are not liable for indirect losses, missed opportunities or decisions you make based on our results. Our total liability for any claim is limited to the amount you paid us for the search in question.</p>

      <h2>Changes and availability</h2>
      <p>We may update features, prices or these terms. Changes apply from the date shown at the top of this page. We try to keep the site available but cannot promise uninterrupted service.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Any disputes are subject to the courts of Chennai, Tamil Nadu.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    </LegalLayout>
  )
}

// ---------------- Refund Policy ----------------
export function Refund() {
  return (
    <LegalLayout title="Refund & Cancellation Policy">
      <p>Resume analysis on Career Genie is free. Payments apply only to job searches (Broad ₹19, Smart ₹29, Global ₹39), each a one-time payment for one search. There are no subscriptions, so there is nothing to cancel.</p>

      <h2>Free retries</h2>
      <p>If a paid search fails or returns no jobs, you can <b>retry it for free up to 2 times within 2 hours</b> of paying, using the "Retry — free" button on the results page.</p>

      <h2>When you get a refund</h2>
      <p>If a paid search still fails because of a technical problem on our side (for example, the search does not run or no results load even after retrying), we will refund the full amount.</p>

      <h2>When refunds are not given</h2>
      <ul>
        <li>The search ran and showed job results. Results depend on what employers have posted, so we cannot refund based on the jobs shown.</li>
        <li>You changed your mind after the search was completed.</li>
        <li>You were not selected for a job you applied to.</li>
      </ul>

      <h2>How to request a refund</h2>
      <p>Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> within <b>7 days</b> of the payment, with the email address you used to sign in and your Razorpay payment ID (found in your Razorpay payment confirmation).</p>

      <h2>Processing time</h2>
      <p>Approved refunds are returned to your original payment method within <b>5–7 working days</b>. The exact time depends on your bank or UPI app.</p>
    </LegalLayout>
  )
}

// ---------------- Contact ----------------
export function Contact() {
  return (
    <LegalLayout title="Contact Us">
      <p>Questions, feedback, refund requests or data requests: we'd love to hear from you.</p>

      <div style={{ background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '16px', padding: '24px 28px', margin: '24px 0' }}>
        <p style={{ margin: '0 0 10px' }}><b>Email:</b> <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        <p style={{ margin: '0 0 10px' }}><b>Operated by:</b> {OPERATOR}</p>
        <p style={{ margin: 0 }}><b>Location:</b> {LOCATION}</p>
      </div>

      <p>We usually reply within <b>2 working days</b>.</p>
      <p>For a payment issue, please include the email you signed in with and your Razorpay payment ID, so we can find it quickly.</p>
    </LegalLayout>
  )
}
