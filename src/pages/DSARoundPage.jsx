import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore, useHistoryStore, useStreakStore } from '../store'
import { Button, Badge, ProgressBar, Spinner } from '../components/ui'
import { CodeEditor } from '../components/ui/CodeEditor'
import { useQuestionTimer } from '../hooks/useQuestionTimer'
import { useTTS } from '../hooks/useTTS'
import { generateDSAQuestions, evaluateCode } from '../lib/api'
import { Zap, ChevronRight, Lightbulb, Code2, XCircle, Send, Volume2, VolumeX, Play, Terminal } from 'lucide-react'

const TOPICS = [
  { id: 'all',         label: 'All Topics',       emoji: '🎯' },
  { id: 'arrays',      label: 'Arrays & Strings',  emoji: '📊' },
  { id: 'linkedlist',  label: 'Linked Lists',       emoji: '🔗' },
  { id: 'trees',       label: 'Trees & Graphs',     emoji: '🌳' },
  { id: 'dp',          label: 'Dynamic Programming',emoji: '⚡' },
  { id: 'sorting',     label: 'Sorting & Searching',emoji: '🔍' },
  { id: 'recursion',   label: 'Recursion & Backtracking', emoji: '🔄' },
  { id: 'stack_queue', label: 'Stack & Queue',      emoji: '📚' },
  { id: 'hashing',     label: 'Hashing',            emoji: '#️⃣' },
]

const DIFFICULTY = [
  { id: 'easy',   label: 'Easy',   color: 'var(--success)' },
  { id: 'medium', label: 'Medium', color: 'var(--warning)' },
  { id: 'hard',   label: 'Hard',   color: 'var(--accent3)' },
  { id: 'mixed',  label: 'Mixed',  color: 'var(--accent)' },
]

const LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript']

// ── Setup Screen ────────────────────────────────────────────────
function DSASetup({ onStart }) {
  const [topic,      setTopic]      = useState('all')
  const [difficulty, setDifficulty] = useState('mixed')
  const [count,      setCount]      = useState(5)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleStart = async () => {
    setError(''); setLoading(true)
    try {
      const questions = await generateDSAQuestions({ topic, difficulty, count })
      onStart(questions, { topic, difficulty })
    } catch (e) {
      setError(e.message?.includes('fetch') ? 'Server not running. Run "npm run server".' : 'Failed to generate questions. ' + e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>DSA Round</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Pure coding problems — no HR, no system design</p>
        </div>

        {/* Topic */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Topic</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setTopic(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${topic === t.id ? 'var(--accent)' : 'var(--border)'}`,
                background: topic === t.id ? 'rgba(124,92,252,0.12)' : 'var(--surface)',
                color: topic === t.id ? 'white' : 'var(--muted)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: topic === t.id ? 600 : 400,
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Difficulty</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {DIFFICULTY.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                padding: '10px 0', borderRadius: 10, textAlign: 'center',
                border: `1px solid ${difficulty === d.id ? d.color : 'var(--border)'}`,
                background: difficulty === d.id ? `${d.color}18` : 'var(--surface)',
                color: difficulty === d.id ? d.color : 'var(--muted)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
              }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of questions */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
            Number of Problems
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 5, 7, 10].map(n => (
              <button key={n} onClick={() => setCount(n)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, textAlign: 'center',
                border: `1px solid ${count === n ? 'var(--accent)' : 'var(--border)'}`,
                background: count === n ? 'rgba(124,92,252,0.12)' : 'var(--surface)',
                color: count === n ? 'white' : 'var(--muted)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                transition: 'all 0.15s',
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--accent3)', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        <Button size="lg" onClick={handleStart} loading={loading} style={{ width: '100%', gap: 8 }}>
          {loading ? 'Generating problems…' : <><Play size={16} /> Start DSA Round</>}
        </Button>

        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
          {count} coding problems · Monaco editor · AI evaluation
        </p>
      </div>
    </div>
  )
}

// ── Session Screen ───────────────────────────────────────────────
function DSASession({ questions, config, onFinish }) {
  const navigate = useNavigate()
  const { addSession } = useHistoryStore()
  const { recordPractice } = useStreakStore()

  const [qIndex,   setQIndex]   = useState(0)
  const [code,     setCode]     = useState('')
  const [language, setLanguage] = useState('python')
  const [hint,     setHint]     = useState('')
  const [loadingHint, setLoadingHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [evaluating, setEvaluating] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const [allResults, setAllResults] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [execResult, setExecResult]   = useState(null)
  const [executing, setExecuting]     = useState(false)

  const { speak, stop: stopTTS, speaking, supported: ttsSupported } = useTTS()

  const q      = questions[qIndex]
  const isLast = qIndex >= questions.length - 1

  const diffColor = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--accent3)' }

  const timerSecs = q?.time_minutes ? q.time_minutes * 60 : (q?.difficulty === 'hard' ? 40 * 60 : q?.difficulty === 'medium' ? 25 * 60 : 15 * 60)
  const timer = useQuestionTimer(timerSecs, { autoStart: true, onExpire: () => {} })

  // Session elapsed
  useState(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  })

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleHint = async () => {
    if (hintsUsed >= 3) return
    setLoadingHint(true); setHintsUsed(h => h + 1)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are helping a student with a DSA problem. Give a hint without revealing the full solution. Be concise — max 3 sentences.',
          prompt: `Problem: "${q.question}"\nGive hint #${hintsUsed + 1} of 3 (${hintsUsed === 0 ? 'gentle nudge' : hintsUsed === 1 ? 'clearer direction' : 'strong hint'}).`,
          maxTokens: 200,
        }),
      })
      const data = await res.json()
      setHint(data.text || 'Hint unavailable.')
      if (ttsEnabled && ttsSupported) speak(data.text || '')
    } catch { setHint('Hint unavailable. Check server.') }
    setLoadingHint(false)
  }

  const handleRunCode = async () => {
    if (!code.trim()) return
    setExecuting(true); setExecResult(null)
    try {
      const res = await fetch('/api/execute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin: '' }),
      })
      const data = await res.json()
      setExecResult(data)
    } catch (e) {
      setExecResult({ error: 'Could not reach server. Make sure npm run server is running.' })
    }
    setExecuting(false)
  }

  const handleSubmit = async () => {
    if (!code.trim()) return
    timer.pause()
    setEvaluating(true)
    try {
      const result = await evaluateCode({ question: q.question, code, language, difficulty: q.difficulty })
      const full = { ...result, questionText: q.question, type: 'coding', timeUsed: timerSecs - timer.remaining, language }
      setCurrentResult(full)
      setAllResults(prev => [...prev, full])
    } catch {
      setCurrentResult({ score: 0, grade: 'F', summary: 'Evaluation failed. Check your server.', strengths: [], improvements: [] })
    }
    setEvaluating(false)
  }

  const handleNext = async () => {
    if (isLast) {
      await finishSession(allResults)
    } else {
      setQIndex(i => i + 1)
      setCode(''); setHint(''); setCurrentResult(null); setHintsUsed(0)
    }
  }

  const finishSession = async (results) => {
    setEvaluating(true)
    try {
      const avgScore = results.length ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length * 10) : 0
      const grade = avgScore >= 85 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 55 ? 'C' : avgScore >= 40 ? 'D' : 'F'
      const session = {
        id: crypto.randomUUID(), startedAt: new Date(),
        role: 'dsa', level: config.difficulty,
        duration_seconds: elapsed, questions: results,
        overall_score: avgScore, grade,
        headline: `DSA Round — ${config.topic} · ${config.difficulty}`,
        strengths: [], focus_areas: [], next_steps: [],
        encouragement: `Completed ${results.length} DSA problems!`,
      }
      addSession(session)
      recordPractice()
      onFinish(session)
    } catch { navigate('/dashboard') }
    setEvaluating(false)
  }

  const progress = (qIndex / questions.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white' }}>DSA Round</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <Badge color="cyan" style={{ textTransform: 'capitalize' }}>{config.topic}</Badge>
          <Badge color={config.difficulty === 'easy' ? 'success' : config.difficulty === 'hard' ? 'danger' : 'warning'} style={{ textTransform: 'capitalize' }}>{config.difficulty}</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ttsSupported && (
            <button onClick={() => setTtsEnabled(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: ttsEnabled ? 'var(--accent2)' : 'var(--muted)' }}>
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          )}
          <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'monospace' }}>{fmt(elapsed)}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{qIndex + 1}/{questions.length}</span>
          <button onClick={() => setShowEndConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.08)', color: 'var(--accent3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            <XCircle size={13} /> End
          </button>
        </div>
      </header>
      <ProgressBar value={progress} style={{ height: 2, borderRadius: 0 }} />

      {/* End confirm modal */}
      {showEndConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>⚠️</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'white', margin: '0 0 8px' }}>End DSA Round?</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {allResults.length} of {questions.length} problems solved.<br/>Your progress will be saved.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEndConfirm(false)}
                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                Keep going
              </button>
              <button onClick={() => { setShowEndConfirm(false); finishSession(allResults) }}
                style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'var(--accent3)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                End & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', gap: 14, padding: 14, maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Left — problem + editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* Problem statement */}
          <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <Badge color="cyan">Coding</Badge>
              <span style={{ fontSize: 12, fontWeight: 700, color: diffColor[q?.difficulty] || 'var(--muted)', textTransform: 'capitalize' }}>
                {q?.difficulty}
              </span>
              {q?.topic && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{q.topic}</span>}
              {q?.time_minutes && <span style={{ fontSize: 11, color: 'var(--muted)' }}>~{q.time_minutes} min</span>}
              {ttsSupported && (
                <button onClick={() => speaking ? stopTTS() : speak(q?.question || '')}
                  style={{ background: speaking ? 'rgba(0,212,255,0.1)' : 'var(--surface2)', border: `1px solid ${speaking ? 'var(--accent2)' : 'var(--border)'}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: speaking ? 'var(--accent2)' : 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />} Read
                </button>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'white', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>
              {q?.question}
            </p>
            {q?.examples?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {q.examples.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 4px', fontWeight: 600 }}>Example {i + 1}</p>
                    <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text)', margin: 0, lineHeight: 1.7 }}>
                      <span style={{ color: 'var(--accent2)' }}>Input:</span> {ex.input}<br />
                      <span style={{ color: 'var(--success)' }}>Output:</span> {ex.output}
                      {ex.explanation && <><br /><span style={{ color: 'var(--muted)' }}>Explanation:</span> {ex.explanation}</>}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {q?.constraints?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Constraints</p>
                {q.constraints.map((c, i) => (
                  <p key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--muted)', margin: '0 0 2px' }}>• {c}</p>
                ))}
              </div>
            )}
          </div>

          {/* Language picker */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Code2 size={12} color="var(--muted)" />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Language:</span>
            {LANGS.map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)} style={{
                padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${language === lang ? 'var(--accent)' : 'var(--border)'}`,
                background: language === lang ? 'rgba(124,92,252,0.15)' : 'transparent',
                color: language === lang ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)',
              }}>{lang}</button>
            ))}
          </div>

          {/* Monaco editor */}
          <CodeEditor value={code} onChange={setCode} language={language} height={300} />

          {/* Run button + output */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleRunCode} disabled={!code.trim() || executing || evaluating}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(0,229,160,0.4)', background: 'rgba(0,229,160,0.08)', color: 'var(--success)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', opacity: (!code.trim() || executing) ? 0.5 : 1 }}>
              <Play size={12} /> {executing ? 'Running…' : 'Run Code'}
            </button>
            {execResult && (
              <span style={{ fontSize: 11, color: execResult.accepted ? 'var(--success)' : execResult.error ? 'var(--accent3)' : 'var(--warning)', fontWeight: 600 }}>
                {execResult.accepted ? '✓ Accepted' : execResult.error ? '✗ Error' : `✗ ${execResult.status}`}
                {execResult.time && ` · ${execResult.time}`}
                {execResult.memory && ` · ${execResult.memory}`}
              </span>
            )}
          </div>

          {/* Output panel */}
          {execResult && (execResult.stdout || execResult.stderr || execResult.error) && (
            <div style={{ borderRadius: 12, border: `1px solid ${execResult.accepted ? 'rgba(0,229,160,0.3)' : 'rgba(255,107,107,0.3)'}`, background: 'var(--bg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <Terminal size={12} color="var(--muted)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</span>
              </div>
              <pre style={{ margin: 0, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: execResult.stderr || execResult.error ? 'var(--accent3)' : 'var(--success)', lineHeight: 1.6, overflowX: 'auto', maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {execResult.error || execResult.stderr || execResult.stdout || '(no output)'}
              </pre>
            </div>
          )}

          {/* Hint */}
          {hint && (
            <div style={{ borderRadius: 12, border: '1px solid rgba(255,181,71,0.3)', background: 'rgba(255,181,71,0.06)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Lightbulb size={12} color="var(--warning)" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>Hint {hintsUsed}/3</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{hint}</p>
            </div>
          )}

          {/* Result */}
          {currentResult && (
            <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'white' }}>{currentResult.score}/10</span>
                <Badge color={currentResult.grade <= 'B' ? 'success' : currentResult.grade <= 'C' ? 'warning' : 'danger'}>Grade {currentResult.grade}</Badge>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{language}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.6 }}>{currentResult.summary}</p>
              {currentResult.time_complexity && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--accent2)', fontFamily: 'monospace' }}>
                    Time: {currentResult.time_complexity}
                  </span>
                  {currentResult.space_complexity && (
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', color: 'var(--accent)', fontFamily: 'monospace' }}>
                      Space: {currentResult.space_complexity}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                {currentResult.strengths?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', margin: '0 0 6px' }}>✓ Strengths</p>
                    {currentResult.strengths.map((s, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text)', margin: '0 0 4px', display: 'flex', gap: 5 }}><span style={{ color: 'var(--success)' }}>•</span>{s}</p>)}
                  </div>
                )}
                {currentResult.improvements?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent3)', textTransform: 'uppercase', margin: '0 0 6px' }}>→ Improve</p>
                    {currentResult.improvements.map((s, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text)', margin: '0 0 4px', display: 'flex', gap: 5 }}><span style={{ color: 'var(--accent3)' }}>→</span>{s}</p>)}
                  </div>
                )}
              </div>
              <Button size="lg" onClick={handleNext} loading={evaluating} style={{ width: '100%' }}>
                {isLast ? '🏁 Finish Round' : <>Next Problem <ChevronRight size={15} /></>}
              </Button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ width: 210, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>

          {/* Timer */}
          <div style={{ borderRadius: 14, border: `1px solid ${timer.expired ? 'rgba(255,107,107,0.4)' : 'var(--border)'}`, background: 'var(--surface)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={timer.running ? timer.pause : timer.start}
                  style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {timer.running ? 'Pause' : 'Resume'}
                </button>
                <button onClick={timer.reset}
                  style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Reset
                </button>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: timer.color, margin: '0 0 6px' }}>{timer.label}</p>
            <ProgressBar value={timer.pct} color={timer.color} style={{ height: 4 }} />
            {timer.expired && <p style={{ fontSize: 11, color: 'var(--accent3)', margin: '6px 0 0', fontWeight: 600 }}>⏰ Time's up!</p>}
          </div>

          {/* Problem progress */}
          <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Problems</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {questions.map((problem, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: i < qIndex ? 'var(--success)' : i === qIndex ? 'var(--accent)' : 'var(--border)',
                  }} />
                  <span style={{ fontSize: 11, color: i === qIndex ? 'var(--text)' : 'var(--muted)', fontWeight: i === qIndex ? 600 : 400 }}>
                    P{i + 1} · <span style={{ color: diffColor[problem.difficulty] || 'var(--muted)', textTransform: 'capitalize' }}>{problem.difficulty}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!currentResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={handleHint}
                disabled={hintsUsed >= 3 || loadingHint} style={{ width: '100%', gap: 6 }}>
                {loadingHint ? <Spinner size={12} /> : <Lightbulb size={12} />}
                {hintsUsed >= 3 ? 'No more hints' : `Hint (${hintsUsed}/3)`}
              </Button>
              <Button size="md" onClick={handleSubmit}
                disabled={!code.trim() || evaluating} loading={evaluating} style={{ width: '100%', gap: 6 }}>
                <Send size={13} /> {evaluating ? 'Evaluating…' : 'Submit Code'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Results Screen ───────────────────────────────────────────────
function DSAResults({ session, onRetry }) {
  const navigate = useNavigate()
  const avgScore = session.overall_score

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>{avgScore >= 70 ? '🏆' : avgScore >= 50 ? '💪' : '📚'}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>Round Complete!</h1>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'white', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>{avgScore}%</p>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>{session.headline}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {session.questions.map((q, i) => (
            <div key={i} style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Problem {i + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{q.language}</span>
                  <Badge color={q.grade <= 'B' ? 'success' : q.grade <= 'C' ? 'warning' : 'danger'}>
                    {q.score}/10
                  </Badge>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {q.questionText}
              </p>
              {q.time_complexity && (
                <p style={{ fontSize: 11, color: 'var(--accent2)', margin: 0, fontFamily: 'monospace' }}>
                  {q.time_complexity} · {q.space_complexity}
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={onRetry} style={{ flex: 1 }}>Try Again</Button>
          <Button onClick={() => navigate('/dashboard')} style={{ flex: 1 }}>Dashboard</Button>
        </div>
      </div>
    </div>
  )
}

// ── Main DSA Page ────────────────────────────────────────────────
export default function DSARoundPage() {
  const [phase,     setPhase]     = useState('setup')   // setup | session | results
  const [questions, setQuestions] = useState([])
  const [config,    setConfig]    = useState({})
  const [session,   setSession]   = useState(null)

  if (phase === 'setup') {
    return <DSASetup onStart={(qs, cfg) => { setQuestions(qs); setConfig(cfg); setPhase('session') }} />
  }
  if (phase === 'session') {
    return <DSASession questions={questions} config={config} onFinish={s => { setSession(s); setPhase('results') }} />
  }
  return <DSAResults session={session} onRetry={() => setPhase('setup')} />
}
