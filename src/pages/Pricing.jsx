import { useNavigate } from 'react-router-dom'
import genieIcon from '../assets/genie-icon.png'

function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      sub: 'Get started today',
      features: ['Match score only', '1 analysis per day', 'Basic keyword check'],
      cta: 'Get started free',
      highlight: false
    },
    {
      name: 'Basic',
      price: '₹49',
      per: '/ resume',
      sub: 'For focused job seekers',
      features: ['Full ATS audit', 'Keyword gap analysis', 'Detailed match score', 'Fix suggestions'],
      cta: 'Get Basic',
      highlight: false
    },
    {
      name: 'Pro',
      price: '₹149',
      per: '/ resume',
      sub: 'Most popular',
      features: ['Everything in Basic', 'Full AI resume rewrite', 'Bullet point optimizer', 'Interview question hints'],
      cta: 'Get Pro',
      highlight: true
    },
    {
      name: 'Unlimited',
      price: '₹299',
      per: '/ month',
      sub: 'For active job seekers',
      features: ['Unlimited analyses', 'All Pro features', 'Priority support', 'Resume history saved'],
      cta: 'Get Unlimited',
      highlight: false
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 60px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={genieIcon}
            alt="Career Genie"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }}
          />
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.5px' }}>Career Genie</span>
        </div>
        <button onClick={() => navigate('/analyze')} style={{
          background: 'linear-gradient(135deg, #f5c518, #e8a200)',
          color: '#000', border: 'none', padding: '10px 24px',
          borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700'
        }}>Try free →</button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px' }}>

        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px' }}>
            Simple, honest pricing
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>
            Start free. Pay only when you need more.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight ? 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(232,162,0,0.05))' : 'rgba(255,255,255,0.03)',
              border: plan.highlight ? '1px solid rgba(245,197,24,0.35)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '32px 24px',
              position: 'relative'
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #f5c518, #e8a200)',
                  color: '#000', fontSize: '11px', fontWeight: '800',
                  padding: '4px 16px', borderRadius: '20px', letterSpacing: '0.5px'
                }}>MOST POPULAR</div>
              )}

              <h3 style={{ fontSize: '16px', fontWeight: '700', color: plan.highlight ? '#f5c518' : 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-2px', color: '#fff' }}>{plan.price}</span>
                {plan.per && <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>{plan.per}</span>}
              </div>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' }}>{plan.sub}</p>

              <ul style={{ listStyle: 'none', marginBottom: '28px' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    fontSize: '14px', color: 'rgba(255,255,255,0.65)',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <span style={{ color: plan.highlight ? '#f5c518' : '#4ade80', fontSize: '16px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/analyze')}
                style={{
                  width: '100%', padding: '12px',
                  background: plan.highlight ? 'linear-gradient(135deg, #f5c518, #e8a200)' : 'rgba(255,255,255,0.07)',
                  color: plan.highlight ? '#000' : '#fff',
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer'
                }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginTop: '48px' }}>
          All payments secured by Razorpay · UPI, cards and netbanking accepted
        </p>

      </div>
    </div>
  )
}

export default Pricing