import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Button, Input, Card } from '../components/ui'
import { Zap, Database } from 'lucide-react'
import { signUp, signIn, isConfigured } from '../lib/supabase'

// ── Login ───────────────────────────────────────────────────────
export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Please fill in all fields.')
    setLoading(true)

    // ── Supabase auth ──────────────────────────────────────────
    if (isConfigured) {
      try {
        const data = await signIn({ email, password })
        const user = data.user
        login({
          id:         user.id,
          name:       user.user_metadata?.name || email.split('@')[0],
          email:      user.email,
          targetRole: user.user_metadata?.targetRole || '',
          supabase:   true,
        })
        navigate('/dashboard')
      } catch (e) {
        setError(e.message || 'Login failed.')
      } finally {
        setLoading(false)
      }
      return
    }

    // ── localStorage fallback ──────────────────────────────────
    await new Promise(r => setTimeout(r, 600))
    const stored = localStorage.getItem(`user_${email}`)
    if (!stored) { setError('No account found. Please register.'); setLoading(false); return }
    const user = JSON.parse(stored)
    if (user.password !== password) { setError('Incorrect password.'); setLoading(false); return }
    login({ id: user.id, name: user.name, email: user.email, targetRole: user.targetRole })
    navigate('/dashboard')
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your InterviewIQ account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} error={error} />
        <Button type="submit" size="lg" style={{ width: '100%', marginTop: 4 }} loading={loading}>Sign in</Button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Create one free</Link>
      </p>
    </AuthShell>
  )
}

// ── Register ────────────────────────────────────────────────────
export function RegisterPage() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '', targetRole: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) return setError('Please fill in all fields.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)

    // ── Supabase auth ──────────────────────────────────────────
    if (isConfigured) {
      try {
        const data = await signUp({ email: form.email, password: form.password, name: form.name })
        const user = data.user
        login({
          id:         user.id,
          name:       form.name,
          email:      form.email,
          targetRole: form.targetRole,
          supabase:   true,
        })
        navigate('/dashboard')
      } catch (e) {
        setError(e.message || 'Registration failed.')
      } finally {
        setLoading(false)
      }
      return
    }

    // ── localStorage fallback ──────────────────────────────────
    await new Promise(r => setTimeout(r, 600))
    const id = crypto.randomUUID()
    localStorage.setItem(`user_${form.email}`, JSON.stringify({ ...form, id }))
    login({ id, name: form.name, email: form.email, targetRole: form.targetRole })
    navigate('/dashboard')
  }

  return (
    <AuthShell title="Create account" subtitle="Start practicing for free — no credit card required">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full name" placeholder="Alex Johnson" value={form.name} onChange={set('name')} />
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
        <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Target role (optional)</label>
          <select value={form.targetRole} onChange={set('targetRole')}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}>
            <option value="">Select a role</option>
            {['Frontend Engineer','Backend Engineer','Full Stack Engineer','ML Engineer','DevOps / Platform','Mobile Engineer'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--accent3)', margin: 0 }}>{error}</p>}
        <Button type="submit" size="lg" style={{ width: '100%' }} loading={loading}>Create free account</Button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
      </p>
    </AuthShell>
  )
}

// ── Shared shell ─────────────────────────────────────────────────
function AuthShell({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 384, height: 384, borderRadius: '50%', opacity: 0.07, filter: 'blur(80px)', background: 'var(--accent)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'white' }}>InterviewIQ</span>
        </Link>

        <Card style={{ boxShadow: '0 0 30px rgba(124,92,252,0.15)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>{subtitle}</p>
          {children}
        </Card>

        {/* Supabase status indicator */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Database size={11} color={isConfigured ? 'var(--success)' : 'var(--muted)'} />
          <span style={{ fontSize: 11, color: isConfigured ? 'var(--success)' : 'var(--muted)' }}>
            {isConfigured ? 'Cloud sync enabled' : 'Local mode (data stays on this device)'}
          </span>
        </div>
      </div>
    </div>
  )
}