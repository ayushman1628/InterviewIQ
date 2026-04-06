import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSessionStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Button } from '../components/ui'
import { QuestionSkeleton } from '../components/ui/Skeletons'
import { generateQuestions, generateCompanyQuestions, generateResumeQuestions } from '../lib/api'
import { ChevronRight, Upload, X, FileText, Building2 } from 'lucide-react'

const ROLES = [
  { id: 'frontend',  label: 'Frontend Engineer',  emoji: '🎨' },
  { id: 'backend',   label: 'Backend Engineer',    emoji: '⚙️' },
  { id: 'fullstack', label: 'Full Stack Engineer', emoji: '🔥' },
  { id: 'ml',        label: 'ML Engineer',         emoji: '🤖' },
  { id: 'devops',    label: 'DevOps Engineer',     emoji: '🚀' },
  { id: 'mobile',    label: 'Mobile Engineer',     emoji: '📱' },
]
const LEVELS = [
  { id: 'junior', label: 'Junior', desc: '0–2 yrs' },
  { id: 'mid',    label: 'Mid',    desc: '2–5 yrs' },
  { id: 'senior', label: 'Senior', desc: '5+ yrs'  },
]
const TYPES = [
  { id: 'coding',        label: 'Coding',        emoji: '💻', desc: 'Algorithms & DS' },
  { id: 'behavioral',    label: 'Behavioral',    emoji: '🗣️',  desc: 'STAR-method HR' },
  { id: 'system_design', label: 'System Design', emoji: '🏗️', desc: 'Architecture' },
  { id: 'domain',        label: 'Domain',        emoji: '📚', desc: 'Role-specific' },
]
const COMPANIES = [
  { id: 'Google',    emoji: '🔍' },
  { id: 'Amazon',    emoji: '📦' },
  { id: 'Meta',      emoji: '👥' },
  { id: 'Apple',     emoji: '🍎' },
  { id: 'Microsoft', emoji: '🪟' },
  { id: 'Netflix',   emoji: '🎬' },
  { id: 'Uber',      emoji: '🚗' },
  { id: 'Airbnb',    emoji: '🏠' },
  { id: 'Stripe',    emoji: '💳' },
  { id: 'Spotify',   emoji: '🎵' },
  { id: 'LinkedIn',  emoji: '💼' },
  { id: 'Twitter',   emoji: '🐦' },
]

// Mode tabs
const MODES = [
  { id: 'standard', label: 'Standard',       icon: '🎯', desc: 'General questions for your role' },
  { id: 'company',  label: 'Company-specific',icon: '🏢', desc: 'Tailored to a specific company' },
  { id: 'resume',   label: 'Resume-based',   icon: '📄', desc: 'Based on your actual experience' },
]

function Opt({ selected, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12,
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'rgba(124,92,252,0.12)' : 'var(--surface)',
      color: selected ? 'white' : 'var(--muted)',
      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
      fontWeight: selected ? 600 : 400, fontSize: 13, textAlign: 'left', width: '100%',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'white' }}}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.color = 'var(--muted)' }}}>
      {children}
    </button>
  )
}

function Label({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>{children}</p>
}

export default function InterviewSetupPage() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const store     = useSessionStore()
  const fileRef   = useRef(null)

  const [mode,    setMode]    = useState('standard')
  const [role,    setRole]    = useState(params.get('role') || store.selectedRole || '')
  const [level,   setLevel]   = useState(store.selectedLevel || 'mid')
  const [types,   setTypes]   = useState(store.selectedTypes?.length ? store.selectedTypes : ['coding', 'behavioral'])
  const [company, setCompany] = useState(store.selectedCompany || '')
  const [resumeText, setResumeText] = useState(store.resumeContext || '')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const toggleType = id => setTypes(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.txt')) { setError('Please upload a .txt file for resume.'); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setResumeText(String(reader.result || ''))
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }

  const handleStart = async () => {
    if (!role)                           return setError('Please select a role.')
    if (!types.length)                   return setError('Select at least one question type.')
    if (mode === 'company' && !company)  return setError('Select a company.')
    if (mode === 'resume' && !resumeText.trim()) return setError('Paste or upload your resume first.')
    setError(''); setLoading(true)

    try {
      store.setRole(role); store.setLevel(level); store.setTypes(types)
      store.setCompany(mode === 'company' ? company : null)
      store.setResumeContext(mode === 'resume' ? resumeText : null)

      const roleLabel = ROLES.find(r => r.id === role)?.label || role
      let questions

      if (mode === 'company') {
        questions = await generateCompanyQuestions({ role: roleLabel, level, types, company })
      } else if (mode === 'resume') {
        questions = await generateResumeQuestions({ resumeText, role: roleLabel, level, types })
      } else {
        questions = await generateQuestions({ role: roleLabel, level, types })
      }

      store.startSession(questions)
      navigate('/interview/session')
    } catch (e) {
      const msg = e?.message || String(e)
      const network =
        /failed to fetch|load failed|networkerror|fetch/i.test(msg) ||
        msg.includes('ECONNREFUSED')
      setError(
        network
          ? 'Cannot reach API server. From the project folder run: npm run server (port 3001). Keep Vite on localhost so /api proxies correctly.'
          : msg
      )
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div style={{ padding: 32, maxWidth: 660 }}>
        <PageHeader title="Setup Interview" subtitle="Configure your session, then start." />

        {/* Mode selector */}
        <div style={{ marginBottom: 28 }}>
          <Label>Interview Mode</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '12px 10px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                border: `1px solid ${mode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                background: mode === m.id ? 'rgba(124,92,252,0.12)' : 'var(--surface)',
                transition: 'all 0.15s', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { if (mode !== m.id) e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { if (mode !== m.id) e.currentTarget.style.borderColor = 'var(--border)' }}>
                <p style={{ fontSize: 20, margin: '0 0 4px' }}>{m.icon}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: mode === m.id ? 'white' : 'var(--muted)', margin: '0 0 2px' }}>{m.label}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Company picker */}
        {mode === 'company' && (
          <div style={{ marginBottom: 28 }}>
            <Label>Target Company</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {COMPANIES.map(c => (
                <Opt key={c.id} selected={company === c.id} onClick={() => setCompany(c.id)}>
                  <span style={{ fontSize: 16 }}>{c.emoji}</span>
                  <span style={{ fontSize: 13 }}>{c.id}</span>
                </Opt>
              ))}
            </div>
          </div>
        )}

        {/* Resume upload */}
        {mode === 'resume' && (
          <div style={{ marginBottom: 28 }}>
            <Label>Your Resume</Label>
            <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="var(--accent)" />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {fileName ? fileName : 'Paste or upload your resume (.txt)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                    <Upload size={11} /> Upload .txt
                    <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFile} />
                  </label>
                  {resumeText && (
                    <button onClick={() => { setResumeText(''); setFileName('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      <X size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume content here…"
                style={{ width: '100%', minHeight: 180, resize: 'vertical', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.6, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              {resumeText && (
                <p style={{ fontSize: 11, color: 'var(--success)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ✓ {resumeText.trim().split(/\s+/).length} words loaded — questions will reference your actual experience
                </p>
              )}
            </div>
          </div>
        )}

        {/* Role */}
        <div style={{ marginBottom: 28 }}>
          <Label>Target Role</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ROLES.map(r => (
              <Opt key={r.id} selected={role === r.id} onClick={() => setRole(r.id)}>
                <span style={{ fontSize: 18 }}>{r.emoji}</span>
                <span>{r.label}</span>
              </Opt>
            ))}
          </div>
        </div>

        {/* Level */}
        <div style={{ marginBottom: 28 }}>
          <Label>Experience Level</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {LEVELS.map(l => (
              <Opt key={l.id} selected={level === l.id} onClick={() => setLevel(l.id)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{l.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{l.desc}</div>
                </div>
              </Opt>
            ))}
          </div>
        </div>

        {/* Types */}
        <div style={{ marginBottom: 28 }}>
          <Label>Question Types</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {TYPES.map(t => (
              <Opt key={t.id} selected={types.includes(t.id)} onClick={() => toggleType(t.id)}>
                <span style={{ fontSize: 18 }}>{t.emoji}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{t.desc}</div>
                </div>
              </Opt>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--accent3)', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        <Button size="lg" onClick={handleStart} loading={loading} style={{ width: '100%', gap: 8 }}>
          {loading
            ? (mode === 'company' ? `Generating ${company} questions…` : mode === 'resume' ? 'Analysing your resume…' : 'Generating questions…')
            : <>Start Interview <ChevronRight size={17} /></>
          }
        </Button>

        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
          {mode === 'company' && company ? `5 questions tailored to ${company}'s interview style` :
           mode === 'resume' ? '5 questions based on your personal experience' :
           '5 questions · AI-generated for your role & level'}
        </p>

        {/* Loading skeleton while generating */}
        {loading && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 12 }}>Generating your questions…</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(3)].map((_, i) => <QuestionSkeleton key={i} />)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}