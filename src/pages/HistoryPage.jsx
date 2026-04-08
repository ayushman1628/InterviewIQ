import { Link } from 'react-router-dom'
import { useHistoryStore } from '../store'
import { AppLayout, PageHeader } from '../components/layout/AppLayout'
import { Button, Card, Badge } from '../components/ui'
import { Plus, Trash2, Clock, MessageSquare, TrendingUp } from 'lucide-react'

const ROLES = {
  frontend: '🎨', backend: '⚙️', fullstack: '🔥',
  ml: '🤖', devops: '🚀', mobile: '📱',
  dsa: '⚡',
}
const ROLE_LABELS = {
  frontend: 'Frontend', backend: 'Backend', fullstack: 'Full Stack',
  ml: 'ML Engineer', devops: 'DevOps', mobile: 'Mobile',
  dsa: 'DSA Round',
}
const GRADE_COLOR = { A: 'success', B: 'cyan', C: 'warning', D: 'warning', F: 'danger' }

export default function HistoryPage() {
  const { sessions, clearHistory } = useHistoryStore()

  return (
    <AppLayout>
      <div style={{ padding: 32 }}>
        <PageHeader
          title="Session History"
          subtitle={sessions.length ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} completed` : 'No sessions yet'}
          action={
            <div style={{ display: 'flex', gap: 10 }}>
              {sessions.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory}
                  style={{ gap: 6, color: 'var(--accent3)' }}>
                  <Trash2 size={13} /> Clear all
                </Button>
              )}
              <Link to="/interview/setup" style={{ textDecoration: 'none' }}>
                <Button size="sm" style={{ gap: 6 }}><Plus size={13} /> New Session</Button>
              </Link>
            </div>
          }
        />

        {sessions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 44, margin: '0 0 16px' }}>📭</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: 16, margin: '0 0 6px' }}>No sessions yet</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px' }}>Complete your first interview to see your history here.</p>
            <Link to="/interview/setup" style={{ textDecoration: 'none' }}>
              <Button>Start a session</Button>
            </Link>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map((s, i) => (
              <Card key={s.id} className="fade-up" style={{ padding: 18, animationDelay: `${i * 0.04}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                  {/* Role icon */}
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {ROLES[s.role] || '🎯'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>
                        {ROLE_LABELS[s.role] || s.role} Interview
                      </p>
                      <Badge color="muted" style={{ textTransform: 'capitalize' }}>{s.level}</Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {s.duration_seconds ? ` · ${Math.round(s.duration_seconds / 60)}m` : ''}
                      </span>
                      {s.questions?.length > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MessageSquare size={11} /> {s.questions.length} questions
                        </span>
                      )}
                    </div>
                    {s.headline && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{s.headline}"
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                      {s.overall_score || 0}%
                    </span>
                    <Badge color={GRADE_COLOR[s.grade] || 'muted'}>Grade {s.grade || '—'}</Badge>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ marginTop: 12, height: 3, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999, transition: 'width 0.8s ease',
                    width: `${s.overall_score || 0}%`,
                    background: s.overall_score >= 70 ? 'var(--success)' : s.overall_score >= 50 ? 'var(--warning)' : 'var(--accent3)',
                  }} />
                </div>

                {/* Per-question mini scores */}
                {s.questions?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {s.questions.map((q, qi) => (
                      <div key={qi} style={{
                        padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        color: q.score >= 8 ? 'var(--success)' : q.score >= 6 ? 'var(--warning)' : 'var(--accent3)',
                      }}>
                        Q{qi + 1} · {q.score}/10
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}