import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useHistoryStore, useStreakStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Button, Card, Badge } from '../components/ui'
import { StreakTracker } from '../components/ui/StreakTracker'
import { StatsSkeleton, SessionListSkeleton } from '../components/ui/Skeletons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { ArrowRight, Plus, Target, TrendingUp, Zap, Clock, AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'

const ROLES = [
  { id: 'frontend',  label: 'Frontend',   emoji: '🎨', desc: 'React, CSS, JS, DOM, Performance' },
  { id: 'backend',   label: 'Backend',    emoji: '⚙️',  desc: 'APIs, DBs, Caching, Architecture' },
  { id: 'fullstack', label: 'Full Stack', emoji: '🔥', desc: 'Frontend + Backend + System Design' },
  { id: 'ml',        label: 'ML Eng',     emoji: '🤖', desc: 'ML Concepts, Python, Stats, LLMs' },
  { id: 'devops',    label: 'DevOps',     emoji: '🚀', desc: 'CI/CD, Kubernetes, Cloud, IaC' },
  { id: 'mobile',    label: 'Mobile',     emoji: '📱', desc: 'React Native, iOS, Android' },
]
const GRADE_COLOR = { A: 'success', B: 'cyan', C: 'warning', D: 'warning', F: 'danger' }
const TYPE_LABELS = { coding: 'Coding', behavioral: 'Behavioral', system_design: 'System Design', domain: 'Domain' }

export default function DashboardPage() {
  const { user }     = useAuthStore()
  const { sessions } = useHistoryStore()
  const navigate     = useNavigate()

  const totalQ   = sessions.reduce((s, x) => s + (x.questions?.length || 0), 0)
  const avgScore = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.overall_score || 0), 0) / sessions.length) : null
  const totalMin = Math.round(sessions.reduce((s, x) => s + (x.duration_seconds || 0), 0) / 60)

  const stats = [
    { icon: Target,     label: 'Sessions',  value: sessions.length || '—' },
    { icon: TrendingUp, label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—' },
    { icon: Zap,        label: 'Questions', value: totalQ || '—' },
    { icon: Clock,      label: 'Practice',  value: totalMin > 0 ? `${totalMin}m` : '—' },
  ]

  // Progress over time — last 10 sessions reversed
  const progressData = useMemo(() => (
    [...sessions].reverse().slice(-10).map((s, i) => ({
      name: `#${i + 1}`,
      score: s.overall_score || 0,
      date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  ), [sessions])

  // Weak area detection — avg score per question type across all sessions
  const weakAreas = useMemo(() => {
    const typeMap = {}
    sessions.forEach(s => {
      (s.questions || []).forEach(q => {
        if (!q.type || !q.score) return
        if (!typeMap[q.type]) typeMap[q.type] = { total: 0, count: 0 }
        typeMap[q.type].total += q.score
        typeMap[q.type].count += 1
      })
    })
    return Object.entries(typeMap)
      .map(([type, { total, count }]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        avg: Math.round((total / count) * 10),  // convert 0-10 → 0-100
        count,
      }))
      .sort((a, b) => a.avg - b.avg)  // weakest first
  }, [sessions])

  const hasWeakArea = weakAreas.length > 0 && weakAreas[0].avg < 60

  const recent    = sessions.slice(0, 4)
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <AppLayout>
      <div style={{ padding: 24 }}>

        <PageHeader
          title={`Hey, ${firstName} 👋`}
          subtitle="Your interview practice hub."
          action={
            <Link to="/interview/setup" style={{ textDecoration: 'none' }}>
              <Button style={{ gap: 8 }}><Plus size={15} /> New Session</Button>
            </Link>
          }
        />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Progress over time + weak areas — only if data exists */}
        {sessions.length >= 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: weakAreas.length > 0 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 28 }}>

            {/* Score over time */}
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
                Score progress
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={progressData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text)' }}
                    formatter={(v, _, props) => [`${v}%`, props.payload.date]}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5}
                    dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Weak areas bar chart */}
            {weakAreas.length > 0 && (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    By question type
                  </p>
                  {hasWeakArea && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
                      <AlertTriangle size={11} /> Needs work
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weakAreas} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} width={90} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`${v}%`, 'Avg score']}
                    />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {weakAreas.map((entry, i) => (
                        <Cell key={i} fill={entry.avg >= 70 ? 'var(--success)' : entry.avg >= 50 ? 'var(--warning)' : 'var(--accent3)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Weak area alert banner */}
        {hasWeakArea && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,181,71,0.08)', border: '1px solid rgba(255,181,71,0.25)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>
              Your <strong style={{ color: 'var(--warning)' }}>{weakAreas[0].label}</strong> score is {weakAreas[0].avg}% — below average.
              {' '}<span style={{ color: 'var(--muted)' }}>Try a focused session to improve it.</span>
            </p>
            <button onClick={() => navigate('/interview/setup')}
              style={{ marginLeft: 'auto', flexShrink: 0, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,181,71,0.4)', background: 'transparent', color: 'var(--warning)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              Practice now →
            </button>
          </div>
        )}

        {/* Streak */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 12 }}>Practice Streak</p>
          <StreakTracker />
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { emoji: '🎯', label: 'Mock Interview', desc: 'AI questions + voice + live feedback', to: '/interview/setup', border: 'rgba(124,92,252,0.3)', bg: 'rgba(124,92,252,0.06)', hoverBg: 'rgba(124,92,252,0.12)' },
            { emoji: '⚡', label: 'DSA Round',      desc: 'Pure coding · algorithms & DS',       to: '/dsa/round',       border: 'rgba(0,212,255,0.3)',  bg: 'rgba(0,212,255,0.05)',  hoverBg: 'rgba(0,212,255,0.1)'  },
            { emoji: '📄', label: 'Resume Rating',  desc: 'ATS score, keyword gaps & rewrites',  to: '/resume/rating',   border: 'rgba(0,229,160,0.3)',  bg: 'rgba(0,229,160,0.05)',  hoverBg: 'rgba(0,229,160,0.1)'  },
          ].map(item => (
            <div key={item.to}
              style={{ borderRadius: 14, border: `1px solid ${item.border}`, background: item.bg, padding: 18, cursor: 'pointer', transition: 'background 0.15s' }}
              onClick={() => navigate(item.to)}
              onMouseEnter={e => e.currentTarget.style.background = item.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = item.bg}>
              <p style={{ fontSize: 22, margin: '0 0 8px' }}>{item.emoji}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 14, margin: '0 0 4px' }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Role picker */}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 12 }}>Practice by role</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
          {ROLES.map((role, i) => (
            <div key={role.id} className="fade-up"
              style={{ animationDelay: `${i * 0.04}s`, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
              onClick={() => navigate(`/interview/setup?role=${role.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.background = 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{role.emoji}</span>
                <ArrowRight size={13} color="var(--muted)" style={{ marginTop: 2 }} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 13, margin: '0 0 3px' }}>{role.label}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>{role.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent sessions */}
        {recent.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Recent sessions</p>
              <Link to="/history" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map((s, i) => (
                <Card key={s.id} className="fade-up" style={{ padding: 14, animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {s.role === 'dsa' ? '⚡' : ROLES.find(r => r.id === s.role)?.emoji || '🎯'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: '0 0 2px', textTransform: 'capitalize' }}>
                        {s.role === 'dsa' ? 'DSA Round' : (ROLES.find(r => r.id === s.role)?.label || s.role) + ' Interview'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                        {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {s.questions?.length ? ` · ${s.questions.length} questions` : ''}
                        {s.duration_seconds ? ` · ${Math.round(s.duration_seconds / 60)}m` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'white' }}>
                        {s.overall_score || 0}%
                      </span>
                      <Badge color={GRADE_COLOR[s.grade] || 'muted'}>Grade {s.grade || '—'}</Badge>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, height: 3, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${s.overall_score || 0}%`, background: s.overall_score >= 70 ? 'var(--success)' : s.overall_score >= 50 ? 'var(--warning)' : 'var(--accent3)', transition: 'width 0.8s ease' }} />
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: 36, margin: '0 0 10px' }}>🎯</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 16, margin: '0 0 6px' }}>No sessions yet</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>Pick a role above to start your first mock interview.</p>
            <Link to="/interview/setup" style={{ textDecoration: 'none' }}><Button>Start my first session</Button></Link>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
