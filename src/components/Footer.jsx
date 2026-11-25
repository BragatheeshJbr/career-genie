import { useNavigate } from 'react-router-dom'

// Small site-wide footer with links to the policy pages.
// Rendered once in App.jsx, below <Routes>, so it appears on every page.
function Footer() {
  const navigate = useNavigate()
  const links = [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Refund Policy', to: '/refund' },
    { label: 'Contact', to: '/contact' },
    { label: 'Pricing', to: '/pricing' },
  ]

  return (
    <footer style={{ position: 'relative', zIndex: 1, background: '#05050a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 20px 28px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 20px', marginBottom: '10px' }}>
        {links.map(l => (
          <a
            key={l.to}
            href={l.to}
            onClick={e => { e.preventDefault(); navigate(l.to); window.scrollTo(0, 0) }}
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f5c518' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
          >
            {l.label}
          </a>
        ))}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
        © {new Date().getFullYear()} Career Genie · Chennai, Tamil Nadu · careergeniesupport@gmail.com
      </div>
    </footer>
  )
}

export default Footer
