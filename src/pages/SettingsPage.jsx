import { useState } from 'react'
import { useAuthStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Button, Card, Input } from '../components/ui'
import { CheckCircle, ExternalLink, Key, User, Server, Database, Code2 } from 'lucide-react'
import { isConfigured } from '../lib/supabase'

const ROLES = [
  'Frontend Engineer','Backend Engineer','Full Stack Engineer',
  'ML Engineer','DevOps / Platform','Mobile Engineer',
]

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [name,       setName]       = useState(user?.name || '')
  const [targetRole, setTargetRole] = useState(user?.targetRole || '')
  const [saved,      setSaved]      = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSave = () => {
    updateUser({ name, targetRole })
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const handleTestServer = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      if (res.ok) setTestResult({ ok: true, msg: `✓ Server running · Model active · Key: ${data.key ? '✓' : '✗'}` })
      else        setTestResult({ ok: false, msg: 'Server responded with error.' })
    } catch {
      setTestResult({ ok: false, msg: '✗ Cannot reach server. Run "npm run server" in terminal.' })
    }
    setTesting(false)
  }

  return (
    <AppLayout>
      <div style={{ padding: 32, maxWidth: 600 }}>
        <PageHeader title="Settings" subtitle="Manage your account and integrations." />

        {/* Server / OpenRouter */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={15} color="var(--accent)" />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white', margin: 0 }}>AI API Key (OpenRouter)</p>
          </div>
          <div style={{ borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', margin: '0 0 4px' }}>Your .env file:</p>
            <code style={{ fontSize: 12, color: 'var(--accent2)', fontFamily: 'monospace' }}>OPENROUTER_API_KEY=sk-or-v1-...</code>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
            Get a free key at{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              openrouter.ai <ExternalLink size={11} />
            </a>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={handleTestServer} loading={testing} style={{ gap: 6 }}>
              <Server size={13} /> Test Server
            </Button>
            {testResult && (
              <span style={{ fontSize: 12, color: testResult.ok ? 'var(--success)' : 'var(--accent3)' }}>
                {testResult.msg}
              </span>
            )}
          </div>
        </Card>

        {/* Piston — code execution */}
        <Card style={{ marginBottom: 14, border: '1px solid rgba(0,229,160,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,229,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={15} color="var(--success)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white', margin: 0 }}>
                Code Execution <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 400 }}>✓ No setup needed</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Powered by Judge0 CE — 100% free, no account, no API key</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Run Code in DSA Round works out of the box. Supports JavaScript, Python, Java, C++, TypeScript.
            Uses the official Judge0 CE public instance — no credit card, no registration, just works.
          </p>
        </Card>

        {/* Supabase */}
        <Card style={{ marginBottom: 14, border: isConfigured ? '1px solid rgba(0,229,160,0.3)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: isConfigured ? 'rgba(0,229,160,0.12)' : 'rgba(124,92,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={15} color={isConfigured ? 'var(--success)' : 'var(--accent)'} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white', margin: 0 }}>
                Cloud Sync (Supabase) {isConfigured && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 400 }}>✓ Connected</span>}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                {isConfigured ? 'Data syncs across all your devices' : 'Currently storing data locally only'}
              </p>
            </div>
          </div>

          {!isConfigured && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--warning)', margin: '0 0 4px', fontWeight: 600 }}>⚠️ Local mode only</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                Without Supabase, your sessions are saved in browser storage only — they'll be lost if you clear browser data or switch devices.
              </p>
            </div>
          )}

          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.6 }}>
            Add to your .env file to enable real accounts across devices:
          </p>
          <div style={{ borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 14px', marginBottom: 12 }}>
            <code style={{ fontSize: 12, color: 'var(--accent2)', fontFamily: 'monospace', display: 'block', lineHeight: 1.8 }}>
              VITE_SUPABASE_URL=https://xxxx.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=eyJhbG...
            </code>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://supabase.com" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              1. Create free Supabase project <ExternalLink size={11} />
            </a>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>→</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>2. Run supabase-schema.sql in SQL Editor</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>→</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>3. Copy URL + anon key to .env</span>
          </div>
        </Card>

        {/* How to run */}
        <Card style={{ marginBottom: 14, background: 'rgba(0,229,160,0.03)', border: '1px solid rgba(0,229,160,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Server size={14} color="var(--success)" />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>How to run</p>
          </div>
          {[
            { n: 1, label: 'Install deps', cmd: 'npm install' },
            { n: 2, label: 'Start both servers', cmd: 'npm run dev:all' },
          ].map(({ n, label, cmd }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)', color: 'var(--success)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}: </span>
              <code style={{ fontSize: 12, color: 'var(--accent2)', fontFamily: 'monospace' }}>{cmd}</code>
            </div>
          ))}
        </Card>

        {/* Profile */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} color="var(--accent)" />
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white', margin: 0 }}>Profile</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Display name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Target role</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}>
                <option value="">Select a role</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Button size="lg" onClick={handleSave} style={{ width: '100%', gap: 8 }}>
          {saved ? <><CheckCircle size={15} /> Saved!</> : 'Save Changes'}
        </Button>
      </div>
    </AppLayout>
  )
}
