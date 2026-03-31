import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Button } from '../components/ui'
import { Zap, Mic, Brain, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'
import { useEffect } from 'react'

const FEATURES = [
  { icon: Brain, title: 'AI Question Engine', desc: 'Role-specific questions tailored to your target company and experience level.' },
  { icon: Mic,   title: 'Voice-First Interview', desc: 'Speak your answers naturally — just like the real thing. No typing.' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Post-session scores, speech pace, filler words, and personalized tips.' },
]

const ROLES = ['Frontend Engineer', 'Backend Engineer', 'Full Stack', 'ML Engineer', 'System Design', 'DevOps']

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'white' }}>InterviewIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/register"><Button size="sm">Get started free</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '80px 24px 60px' }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: 40, left: '25%', width: 288, height: 288, borderRadius: '50%', opacity: 0.1, filter: 'blur(60px)', background: 'var(--accent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 80, right: '25%', width: 224, height: 224, borderRadius: '50%', opacity: 0.08, filter: 'blur(60px)', background: 'var(--accent2)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 720, margin: '0 auto' }} className="fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 24, background: 'rgba(124,92,252,0.12)', color: 'var(--accent)', border: '1px solid rgba(124,92,252,0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
            AI-Powered Mock Interviews
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 24 }}>
            Ace your next{' '}
            <span className="shimmer-text">tech interview</span>
            <br />with AI coaching
          </h1>

          <p style={{ color: 'var(--muted)', fontSize: 17, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Realistic mock interviews with voice input, real-time AI feedback,
            confidence tracking, and deep analytics. Practice like it's the real thing.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/register"><Button size="xl" className="gap-3">Start practicing free <ArrowRight size={18} /></Button></Link>
            <Link to="/login"><Button variant="secondary" size="xl">Sign in</Button></Link>
          </div>
        </div>

        {/* Role pills */}
        <div style={{ position: 'relative', zIndex: 10, marginTop: 48, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 520, margin: '48px auto 0' }} className="fade-up">
          {ROLES.map(role => (
            <span key={role} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 80px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="fade-up" style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${0.15 + i * 0.08}s` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={18} color="var(--accent)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div className="fade-up" style={{ marginTop: 40, padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {['Voice-to-text transcription','Real-time confidence tracking','Per-question AI scoring','Speech pace analysis','Progressive hint system','Session history & progress'].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
                <CheckCircle size={14} color="var(--success)" />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}