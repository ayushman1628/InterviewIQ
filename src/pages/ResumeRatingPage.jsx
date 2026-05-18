import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Badge, Button, Card, ScoreRing } from '../components/ui'
import { rateResume } from '../lib/api'
import { FileText, Sparkles, RotateCcw, Upload, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const GRADE_COLOR = { A: 'success', B: 'cyan', C: 'warning', D: 'warning', F: 'danger' }
const LEVELS = ['Junior', 'Mid', 'Senior']
const MAX_CHARS = 12000

const ROLES = [
  'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
  'ML Engineer', 'DevOps / Platform', 'Mobile Engineer', 'Product Manager',
  'Data Engineer', 'QA Engineer', 'Other',
]

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.round(value)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function Section({ title, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        {open ? <ChevronUp size={14} color="var(--muted)" /> : <ChevronDown size={14} color="var(--muted)" />}
      </button>
      {open && <div style={{ padding: '14px 18px' }}>{children}</div>}
    </Card>
  )
}

export default function ResumeRatingPage() {
  const { user }       = useAuthStore()
  const fileInputRef   = useRef(null)

  const [targetRole, setTargetRole] = useState(user?.targetRole || '')
  const [level, setLevel]           = useState('Mid')
  const [resumeText, setResumeText] = useState('')
  const [fileName, setFileName]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [result, setResult]         = useState(null)
  const [truncated, setTruncated]   = useState(false)

  useEffect(() => { setTargetRole(user?.targetRole || '') }, [user?.targetRole])

  const canRate = useMemo(() => resumeText.trim().length > 0 && !loading, [resumeText, loading])
  const charCount = resumeText.length

  // ── File upload handler ──────────────────────────────────────
  const handleFile = async (e) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const ext = file.name.toLowerCase().split('.').pop()

    // .txt — read directly in browser
    if (ext === 'txt') {
      const reader = new FileReader()
      reader.onload = () => setResumeText(String(reader.result || ''))
      reader.onerror = () => setError('Failed to read the file.')
      reader.readAsText(file)
      return
    }

    // .pdf / .docx — send to backend for text extraction
    if (ext === 'pdf' || ext === 'docx') {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/extract-text', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Text extraction failed')
        }
        const { text } = await res.json()
        setResumeText(text)
      } catch (e) {
        setError(`Could not extract text from ${file.name}: ${e.message}`)
      } finally {
        setLoading(false)
      }
      return
    }

    setError('Unsupported file type. Upload a .txt, .pdf, or .docx file.')
  }

  // ── Rate resume ──────────────────────────────────────────────
  const handleRate = async () => {
    setError(''); setResult(null)
    const raw = resumeText.trim()
    if (!raw) { setError('Paste your resume text first.'); return }

    const isTruncated = raw.length > MAX_CHARS
    setTruncated(isTruncated)
    const payload = isTruncated ? raw.slice(0, MAX_CHARS) : raw

    setLoading(true)
    try {
      const res = await rateResume({ resumeText: payload, targetRole, level })
      setResult({
        overall_score:      Number(res?.overall_score ?? 0),
        grade:              res?.grade || 'F',
        summary:            res?.summary || '',
        category_scores: {
          ats_score:        Number(res?.category_scores?.ats_score ?? 0),
          content_score:    Number(res?.category_scores?.content_score ?? 0),
          impact_score:     Number(res?.category_scores?.impact_score ?? 0),
          clarity_score:    Number(res?.category_scores?.clarity_score ?? 0),
          formatting_score: Number(res?.category_scores?.formatting_score ?? 0),
        },
        strengths:           Array.isArray(res?.strengths)           ? res.strengths           : [],
        improvements:        Array.isArray(res?.improvements)        ? res.improvements        : [],
        keyword_gaps:        Array.isArray(res?.keyword_gaps)        ? res.keyword_gaps        : [],
        rewrite_suggestions: Array.isArray(res?.rewrite_suggestions) ? res.rewrite_suggestions : [],
      })
    } catch (e) {
      setError(e?.message?.includes('API') || e?.message?.includes('Proxy') || e?.message?.includes('fetch')
        ? 'Rating failed. Make sure the server is running (npm run server).'
        : 'Rating failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setResumeText(''); setResult(null); setError('')
    setTruncated(false); setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const score10    = result ? Math.max(0, Math.min(10, result.overall_score / 10)) : 0
  const categories = result ? [
    { label: 'ATS Readability', color: 'var(--accent2)',  value: result.category_scores.ats_score },
    { label: 'Content Quality', color: 'var(--accent)',   value: result.category_scores.content_score },
    { label: 'Impact & Metrics',color: 'var(--success)',  value: result.category_scores.impact_score },
    { label: 'Clarity',         color: 'var(--warning)',  value: result.category_scores.clarity_score },
    { label: 'Formatting',      color: 'var(--muted)',    value: result.category_scores.formatting_score },
  ] : []

  return (
    <AppLayout>
      <div style={{ padding: 32, maxWidth: 900 }}>
        <PageHeader
          title="Resume Rating"
          subtitle="AI-powered score, ATS analysis, and targeted rewrites for your resume."
        />

        {/* Input card */}
        <Card style={{ marginBottom: 16 }}>

          {/* Role + Level */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Target role</label>
              <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}>
                <option value="">General / Unspecified</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Experience level</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {LEVELS.map(l => (
                  <button key={l} onClick={() => setLevel(l)}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1px solid ${level === l ? 'var(--accent)' : 'var(--border)'}`, background: level === l ? 'rgba(124,92,252,0.12)' : 'var(--surface2)', color: level === l ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={15} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0 }}>
                  {fileName ? fileName : 'Resume input'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  Paste text, or upload .txt / .pdf / .docx
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface2)', padding: '7px 12px', borderRadius: 10, fontSize: 13, color: 'var(--muted)', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <Upload size={13} /> Upload file
                <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,text/plain,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
              </label>
              {resumeText && (
                <button onClick={handleClear}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', padding: '7px 12px', borderRadius: 10, fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Char counter */}
          {resumeText && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: charCount > MAX_CHARS ? 'var(--warning)' : 'var(--muted)' }}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                {charCount > MAX_CHARS && ' — will be truncated'}
              </span>
            </div>
          )}

          {/* Textarea */}
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
            placeholder="Paste your resume content here, or upload a file above…&#10;&#10;Tip: Include job titles, dates, bullet points with metrics, and skills sections for the most accurate rating."
            style={{ width: '100%', minHeight: 280, resize: 'vertical', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.65, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'} />

          {/* Error */}
          {error && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color="var(--accent3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: 'var(--accent3)', fontSize: 13 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Button size="lg" onClick={handleRate} loading={loading} disabled={!canRate} style={{ gap: 8, minWidth: 200 }}>
              <Sparkles size={15} /> {loading ? 'Analyzing resume…' : 'Rate My Resume'}
            </Button>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Scored across 5 categories · ~10 second analysis
            </p>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Hero score */}
            <Card style={{ boxShadow: '0 0 40px rgba(124,92,252,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <ScoreRing score={score10} size={100} strokeWidth={7} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{result.overall_score}/100</span>
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                      {result.overall_score}/100
                    </span>
                    <Badge color={GRADE_COLOR[result.grade] || 'muted'}>Grade {result.grade}</Badge>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {targetRole || 'General'} · {level}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 14px' }}>{result.summary}</p>

                  {/* Category bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                    {categories.map(c => (
                      <ScoreBar key={c.label} label={c.label} value={c.value} color={c.color} />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Strengths & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Section title="✓ Strengths" color="var(--success)">
                {result.strengths.length
                  ? result.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <CheckCircle size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{s}</p>
                    </div>
                  ))
                  : <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>None identified.</p>
                }
              </Section>

              <Section title="→ Top Improvements" color="var(--accent3)">
                {result.improvements.length
                  ? result.improvements.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent3)', flexShrink: 0, marginTop: 1, fontWeight: 800 }}>→</span>
                      <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{s}</p>
                    </div>
                  ))
                  : <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>None identified.</p>
                }
              </Section>
            </div>

            {/* Keyword gaps */}
            <Section title="🔍 ATS Keyword Gaps" color="var(--accent2)">
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                These keywords are commonly expected for your target role but are missing or underrepresented in your resume.
              </p>
              {result.keyword_gaps.length
                ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.keyword_gaps.map((k, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: 'var(--accent2)' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                )
                : <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No keyword gaps found — great ATS coverage!</p>
              }
            </Section>

            {/* Rewrite suggestions */}
            <Section title="✍️ Rewrite Suggestions" color="var(--warning)">
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Specific bullet points or sections to rewrite for stronger impact.
              </p>
              {result.rewrite_suggestions.length
                ? result.rewrite_suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.2)' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                    <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))
                : <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No rewrite suggestions.</p>
              }
            </Section>

            {/* Re-rate CTA */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
              <Button variant="secondary" onClick={handleClear} style={{ gap: 8 }}>
                <RotateCcw size={14} /> Rate a different resume
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}