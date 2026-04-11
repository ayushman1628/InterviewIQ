import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 800, color: 'var(--accent)', margin: '0 0 8px', lineHeight: 1, opacity: 0.3 }}>404</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 10px' }}>Page not found</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
          This page doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Go back
          </button>
          <button onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
