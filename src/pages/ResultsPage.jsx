import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSessionStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Button, Card, Badge, ScoreRing } from '../components/ui'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { RotateCcw, AlertTriangle } from 'lucide-react'

const GRADE_COLOR = { A: 'success', B: 'cyan', C: 'warning', D: 'warning', F: 'danger' }

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + (b || 0), 0) / arr.length
}

function gradeColor(g) {
  return { A: '#00e5a0', B: '#00d4ff', C: '#ffb547', D: '#ffb547', F: '#ff6b6b' }[g] || '#7c5cfc'
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { sessionResults, reset, selectedRole } = useSessionStore()

  useEffect(() => { if (!sessionResults) navigate('/dashboard') }, [])
  if (!sessionResults) return null

  const r  = sessionResults
  const qs = r.questions || []

  const voiceQs    = qs.filter(q => q.speechAnalytics)
  const avgWpm     = voiceQs.length ? Math.round(avg(voiceQs.map(q => q.speechAnalytics.wpm || 0))) : 0
  const avgFill    = voiceQs.length ? avg(voiceQs.map(q => q.speechAnalytics.fillerCount || 0)).toFixed(1) : '0'
  const avgClarity = voiceQs.length ? Math.round(avg(voiceQs.map(q => q.speechAnalytics.clarity || 90))) : 90

  const radarData = [
    { subject: 'Technical',     value: avg(qs.map(q => q.technical_score     || q.score)) * 10 },
    { subject: 'Communication', value: avg(qs.map(q => q.communication_score || q.score)) * 10 },
    { subject: 'Completeness',  value: avg(qs.map(q => q.score)) * 10 },
    { subject: 'Clarity',       value: avgClarity },
  ]

  const lineData = qs.map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score * 10,
  }))

  const Section = ({ title, children, delay = 0 }) => (
    <div className="fade-up" style={{ animationDelay: `${delay}s`, marginBottom: 16 }}>
      <Card>
        {title && <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>{title}</p>}
        {children}
      </Card>
    </div>
  )

  return (
    <AppLayout>
      <div style={{ padding: 32, maxWidth: 900 }}>
        <PageHeader
          title="Session Results"
          subtitle={`${selectedRole || 'Interview'} · ${qs.length} questions`}
          action={
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="sm" onClick={() => { reset(); navigate('/interview/setup') }} style={{ gap: 6 }}>
                <RotateCcw size={13} /> Practice Again
              </Button>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <Button size="sm">Dashboard</Button>
              </Link>
            </div>
          }
        />

        {/* Hero score */}
        <div className="fade-up" style={{ marginBottom: 16 }}>
          <Card style={{ boxShadow: '0 0 40px rgba(124,92,252,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Grade circle */}
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${gradeColor(r.grade)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: gradeColor(r.grade) }}>{r.grade}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                    {r.overall_score}%
                  </span>
                  <Badge color={GRADE_COLOR[r.grade] || 'muted'}>Grade {r.grade}</Badge>
                </div>
                {r.headline && <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 6px' }}>{r.headline}</p>}
                {r.encouragement && <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>{r.encouragement}</p>}
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title="Skills Breakdown" delay={0.1}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Score Per Question" delay={0.15}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--text)' }} />
                <Line type="monotone" dataKey="score" stroke="var(--accent2)" strokeWidth={2} dot={{ fill: 'var(--accent2)', r: 4 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Speech analytics */}
        {voiceQs.length > 0 && (
          <Section title="🎙️ Speech Analytics" delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Avg WPM',       value: avgWpm,         sub: avgWpm >= 100 && avgWpm <= 180 ? 'Good pace ✓' : avgWpm < 100 ? 'Too slow' : 'Too fast', color: avgWpm >= 100 && avgWpm <= 180 ? 'var(--success)' : 'var(--warning)' },
                { label: 'Avg Fillers',   value: avgFill,        sub: avgFill <= 2 ? 'Very clean ✓' : 'Reduce fillers', color: avgFill <= 2 ? 'var(--success)' : 'var(--accent3)' },
                { label: 'Avg Clarity',   value: `${avgClarity}%`, sub: avgClarity >= 85 ? 'Excellent ✓' : 'Keep practicing', color: avgClarity >= 85 ? 'var(--success)' : 'var(--warning)' }
              ].map(s => (
                <div key={s.label} style={{ padding: '14px 12px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: '3px 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: s.color, margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Strengths & Focus */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title="✓ Top Strengths" delay={0.25}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.strengths?.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}>•</span>{s}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="→ Focus Areas" delay={0.3}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.focus_areas?.map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}>→</span>{s}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Action plan */}
        {r.next_steps?.length > 0 && (
          <Section title="🎯 Action Plan" delay={0.35}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {r.next_steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(124,92,252,0.15)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{step}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Session Notes */}
        {r.notes && (
          <Section title="📝 Your Session Notes" delay={0.45}>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{r.notes}</p>
          </Section>
        )}

        {/* Weak type detection for this session */}
        {(() => {
          const typeScores = {}
          qs.forEach(q => {
            if (!typeScores[q.type]) typeScores[q.type] = []
            typeScores[q.type].push(q.score || 0)
          })
          const weak = Object.entries(typeScores)
            .map(([type, scores]) => ({ type, avg: scores.reduce((a,b)=>a+b,0)/scores.length }))
            .filter(t => t.avg < 6)
          if (weak.length === 0) return null
          const TYPE_LABELS = { coding: 'Coding', behavioral: 'Behavioral', system_design: 'System Design', domain: 'Domain' }
          return (
            <div className="fade-up" style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,181,71,0.06)', border: '1px solid rgba(255,181,71,0.25)', display: 'flex', alignItems: 'flex-start', gap: 12, animationDelay: '0.4s' }}>
              <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', margin: '0 0 4px' }}>
                  Weak area detected this session
                </p>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
                  Your {weak.map(w => <strong key={w.type}>{TYPE_LABELS[w.type] || w.type}</strong>).reduce((a, b) => [a, ' and ', b])} score{weak.length > 1 ? 's are' : ' is'} below 60% — focus on this in your next session.
                </p>
              </div>
            </div>
          )
        })()}

        {/* Per-question breakdown */}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 12px' }}>
          Question Breakdown
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {qs.map((q, i) => (
            <Card key={i} className="fade-up" style={{ padding: 16, animationDelay: `${0.4 + i * 0.05}s` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <ScoreRing score={q.score} size={52} strokeWidth={5} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Badge color="muted" style={{ textTransform: 'capitalize' }}>{q.type?.replace('_', ' ')}</Badge>
                    <Badge color={GRADE_COLOR[q.grade] || 'muted'}>Grade {q.grade}</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q.questionText}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{q.summary}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}