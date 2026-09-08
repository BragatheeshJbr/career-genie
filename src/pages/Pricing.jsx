import { useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import genieIcon from '../assets/genie-icon.png'

function Pricing() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      sub: 'forever',
      badge: null,
      color: '#fff',
      highlight: false,
      features: [
        { text: '3 resume analyses per day', included: true },
        { text: 'Match score + ATS audit', included: true },
        { text: 'Keyword gap analysis', included: true },
        { text: 'AI bullet point rewrite', included: true },
        { text: 'Full resume rewrite', included: true },
        { text: 'PDF download', included: true },
        { text: '4 week career roadmap', included: true },
        { text: 'Interview prep + cover letter', included: true },
        { text: 'Analysis history dashboard', included: true },
        { text: 'Job Finder', included: false },
      ],
      cta: 'Get started free',
      ctaAction: () => navigate('/analyze')
    },
    {
      name: 'Broad Search',
      price: '₹19',
      sub: 'per search',
      badge: null,
      color: '#22c55e',
      highlight: false,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Widest job coverage', included: true },
        { text: 'Thousands of job boards', included: true },
        { text: 'Location based filtering', included: true },
        { text: 'Salary data included', included: true },
        { text: 'Pay per search — no subscription', included: true },
        { text: 'Google for Jobs India', included: false },
        { text: 'Direct ATS access', included: false },
      ],
      cta: 'Try Broad Search — ₹19',
      ctaAction: () => navigate('/jobs')
    },
    {
      name: 'Smart Search',
      price: '₹29',
      sub: 'per search',
      badge: 'MOST POPULAR',
      color: '#f5c518',
      highlight: true,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Google for Jobs India', included: true },
        { text: 'Naukri, LinkedIn, Indeed, Internshala', included: true },
        { text: 'Location based filtering', included: true },
        { text: 'Salary data included', included: true },
        { text: 'Pay per search — no subscription', included: true },
        { text: 'Best Indian job coverage', included: true },
        { text: 'Direct ATS access', included: false },
      ],
      cta: 'Try Smart Search — ₹29',
      ctaAction: () => navigate('/jobs')
    },
    {
      name: 'Direct Search',
      price: '₹39',
      sub: 'per search',
      badge: 'BEST QUALITY',
      color: '#a78bfa',
      highlight: false,
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Direct from company career pages', included: true },
        { text: 'Freshest listings — no middleman', included: true },
        { text: 'Workday, Greenhouse, Lever + more', included: true },
        { text: 'Cross source deduplication', included: true },
        { text: 'Full job descriptions', included: true },
        { text: 'Pay per search — no subscription', included: true },
        { text: 'Best data quality', included: true },
      ],
      cta: 'Try Direct Search — ₹39',
      ctaAction: () => navigate('/jobs')
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#05050a', color: '#fff' }}>

      <style>{`
        @media (max-width: 768px) {
          .pricing-nav { padding: 14px 20px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-h1 { font-size: 32px !important; letter-spacing: -1px !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav className="pricing-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 60px', background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src={genieIcon} alt="Career Genie" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/jobs')} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>🚀 Job Finder</button>
          <button onClick={() => navigate('/analyze')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Analyze Resume</button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '9px', cursor: 'pointer' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5c518, #e8a200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#000' }}>{user.email[0].toUpperCase()}</div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{user.email.split('@')[0]}</span>
              </div>
              <button onClick={async () => { await signOut(); navigate('/') }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 16px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Sign out</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px' }}>Sign in</button>
              <button onClick={() => navigate('/signup')} style={{ background: 'linear-gradient(135deg, #f5c518, #e8a200)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Sign up free</button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '80px 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 className="pricing-h1" style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
            Resume analysis is completely free. Pay only when you search for jobs.
          </p>
        </div>

        {/* Free banner */}
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', padding: '20px 28px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#4ade80', marginBottom: '4px' }}>
              Everything in the Analyze section is free — always
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
              Match score · ATS audit · Keyword gap · AI rewrite · Full rewrite · PDF · 4 week roadmap · Interview prep · Cover letter — all free, 3 times a day. Sign in required.
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '48px' }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight
                ? 'linear-gradient(135deg, rgba(245,197,24,0.08), rgba(245,197,24,0.03))'
                : 'rgba(255,255,255,0.03)',
              border: plan.highlight
                ? '1px solid rgba(245,197,24,0.3)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '24px 20px',
              position: 'relative', display: 'flex', flexDirection: 'column'
            }}>
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: plan.highlight
                    ? 'linear-gradient(135deg, #f5c518, #e8a200)'
                    : plan.color === '#a78bfa'
                      ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                      : 'linear-gradient(135deg, #f5c518, #e8a200)',
                  color: plan.highlight ? '#000' : '#fff',
                  fontSize: '10px', fontWeight: '800',
                  padding: '3px 12px', borderRadius: '20px',
                  letterSpacing: '0.5px', whiteSpace: 'nowrap'
                }}>{plan.badge}</div>
              )}

              <h3 style={{ fontSize: '14px', fontWeight: '700', color: plan.color, marginBottom: '10px' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
                  {plan.price}
                </span>
                {plan.sub && (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>
                    {plan.sub}
                  </span>
                )}
              </div>

              <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0, flex: 1 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    fontSize: '12px',
                    color: f.included ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'flex-start', gap: '6px'
                  }}>
                    <span style={{ color: f.included ? plan.color : 'rgba(255,255,255,0.15)', fontSize: '13px', flexShrink: 0 }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <button onClick={plan.ctaAction} style={{
                width: '100%', padding: '11px',
                background: plan.highlight
                  ? 'linear-gradient(135deg, #f5c518, #e8a200)'
                  : 'rgba(255,255,255,0.07)',
                color: plan.highlight ? '#000' : plan.color,
                border: plan.highlight ? 'none' : `1px solid rgba(255,255,255,0.1)`,
                borderRadius: '10px', fontSize: '12px',
                fontWeight: '700', cursor: 'pointer'
              }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Job search explainer */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
            Why is job search paid?
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: '1.6' }}>
            Job search APIs have real costs — each query costs us money. We charge a small per-search fee to cover this and keep everything else completely free.
          </p>
          {[
            { icon: '🌐', name: 'Broad Search — ₹19', desc: 'Powered by Adzuna — thousands of job boards in one search. Widest coverage, good for exploring.', color: '#22c55e' },
            { icon: '🔍', name: 'Smart Search — ₹29', desc: 'Powered by Google for Jobs India — Naukri, LinkedIn, Indeed, Internshala in one query. Best for Indian market.', color: '#f5c518' },
            { icon: '🎯', name: 'Direct Search — ₹39', desc: 'Powered by JobsPipe — reads directly from company career pages. Freshest data, no duplicates, highest quality.', color: '#a78bfa' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '14px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: item.color, marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '24px' }}>Common questions</h2>
          {[
            { q: 'Do I need to create an account?', a: 'Yes — sign in is required for all features. This helps us track your daily usage limit and save your analysis history.' },
            { q: 'What is included in the free plan?', a: 'Everything in the Analyze section — match score, ATS audit, keyword gap, AI rewrite, full resume rewrite, PDF download, 4 week roadmap, interview prep and cover letter. All free, 3 times a day.' },
            { q: 'What is the difference between the three job search tiers?', a: 'Broad casts the widest net across thousands of boards. Smart uses Google for Jobs India for best local coverage. Direct goes straight to company career pages for the freshest listings.' },
            { q: 'Can I use the same search again if no jobs are found?', a: 'Yes — retry is always free. You only pay for the initial search. If we find no results you can retry without paying again.' },
            { q: 'What payment methods are accepted?', a: 'UPI (GPay, PhonePe, Paytm), debit cards, credit cards and netbanking — all via Razorpay.' },
          ].map((faq, i, arr) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{faq.q}</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>{faq.a}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
          All payments secured by Razorpay · UPI, GPay, PhonePe, cards and netbanking accepted
        </p>
      </div>
    </div>
  )
}

export default Pricing