import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore, useHistoryStore, useStreakStore } from '../store'
import { Button, Badge, ProgressBar, Spinner } from '../components/ui'
import { CodeEditor } from '../components/ui/CodeEditor'
import { useSpeech } from '../hooks/useSpeech'
import { useSpeechAnalytics } from '../hooks/useSpeechAnalytics'
import { useTTS } from '../hooks/useTTS'
import { useQuestionTimer } from '../hooks/useQuestionTimer'
import { evaluateAnswer, getHint, generateSummary } from '../lib/api'
import {
  Mic, MicOff, ChevronRight, Lightbulb, Zap, Code2,
  BarChart2, Volume2, VolumeX, StickyNote, Building2,
  FileText, Clock, XCircle, Send,
} from 'lucide-react'

const TYPE_COLORS = { coding: 'cyan', behavioral: 'accent', system_design: 'warning', domain: 'success' }
const LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript']

export default function InterviewSessionPage() {
  const navigate = useNavigate()
  const store    = useSessionStore()
  const { addSession }     = useHistoryStore()
  const { recordPractice } = useStreakStore()

  const { isSupported, startListening, stopListening } = useSpeech()
  const { speak, stop: stopTTS, speaking, supported: ttsSupported } = useTTS()
  const [ttsEnabled, setTtsEnabled] = useState(true)

  const q         = store.questions[store.currentQuestionIndex]
  const timerSecs = (q?.time_minutes || 3) * 60
  const timer     = useQuestionTimer(timerSecs, { autoStart: true, onExpire: () => {} })
  const isLast    = store.currentQuestionIndex >= store.questions.length - 1

  const [elapsed,         setElapsed]         = useState(0)
  const [hint,            setHint]            = useState('')
  const [loadingHint,     setLoadingHint]     = useState(false)
  const [evaluating,      setEvaluating]      = useState(false)
  const [questionResults, setQuestionResults] = useState([])
  const [currentResult,   setCurrentResult]   = useState(null)
  const [codeValue,       setCodeValue]       = useState('')
  const [language,        setLanguage]        = useState('javascript')
  const [inputMode,       setInputMode]       = useState('voice')
  const [showAnalytics,   setShowAnalytics]   = useState(false)
  const [showNotes,       setShowNotes]       = useState(false)
  const [showEndConfirm,  setShowEndConfirm]  = useState(false)

  const analytics = useSpeechAnalytics(store.transcript, elapsed)

  useEffect(() => {
    if (!store.currentSession || store.questions.length === 0) navigate('/interview/setup')
  }, [])

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!q) return
    setHint(''); setCurrentResult(null); setCodeValue('')
    setShowAnalytics(false)
    setInputMode(q.type === 'coding' ? 'code' : 'voice')
    if (ttsEnabled && ttsSupported) speak(q.question)
  }, [store.currentQuestionIndex, ttsEnabled])

  const fmt       = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const handleMic = () => store.isListening ? stopListening() : startListening()
  const handleTTS = () => speaking ? stopTTS() : q && speak(q.question)
  const getAnswer = () => inputMode === 'code' ? codeValue : store.transcript

  const handleHint = async () => {
    if (store.hintsUsed >= 3) return
    setLoadingHint(true); store.addHint()
    try {
      const h = await getHint({ question: q.question, hintNumber: store.hintsUsed, role: store.selectedRole })
      setHint(h)
      if (ttsEnabled && ttsSupported) speak(h)
    } catch { setHint('Hint unavailable. Check your server.') }
    setLoadingHint(false)
  }

  const handleSubmit = async () => {
    const answer = getAnswer()
    if (!answer?.trim()) return
    if (store.isListening) stopListening()
    stopTTS(); timer.pause()
    setEvaluating(true)
    try {
      const result = await evaluateAnswer({
        question:   q.question,
        transcript: inputMode === 'code' ? `[${language} code]:\n\n${answer}` : answer,
        role:  store.selectedRole,
        level: store.selectedLevel,
      })
      const full = {
        ...result,
        questionId: q.id, type: q.type, questionText: q.question,
        speechAnalytics: inputMode === 'voice' ? analytics : null,
        timeUsed: timerSecs - timer.remaining,
        resumeReference: q.resume_reference || null,
        companyContext:  q.company_context  || null,
      }
      setCurrentResult(full)
      setQuestionResults(prev => [...prev, full])
    } catch {
      setCurrentResult({ score: 0, grade: 'F', summary: 'Evaluation failed — check your server is running.', strengths: [], improvements: [] })
    }
    setEvaluating(false)
  }

  const buildSession = (summary, results) => ({
    id: store.currentSession.id, startedAt: store.currentSession.startedAt,
    role: store.selectedRole, level: store.selectedLevel, company: store.selectedCompany,
    duration_seconds: elapsed, questions: results,
    overall_score: summary.overall_score, grade: summary.grade,
    headline: summary.headline, strengths: summary.strengths,
    focus_areas: summary.focus_areas, next_steps: summary.next_steps,
    encouragement: summary.encouragement, notes: store.sessionNotes,
  })

  const handleNext = async () => {
    if (isLast) {
      setEvaluating(true)
      try {
        const summary = await generateSummary({ role: store.selectedRole, level: store.selectedLevel, questionResults })
        const session = buildSession(summary, questionResults)
        addSession(session); store.setResults(session); recordPractice()
        navigate('/interview/results')
      } catch { navigate('/dashboard') }
    } else {
      store.nextQuestion()
    }
  }

  const handleEndSession = async () => {
    if (store.isListening) stopListening()
    stopTTS(); timer.pause(); setEvaluating(true)
    try {
      const results = questionResults
      const summary = results.length > 0
        ? await generateSummary({ role: store.selectedRole, level: store.selectedLevel, questionResults: results })
        : { overall_score: 0, grade: 'F', headline: 'Session ended early', strengths: [], focus_areas: [], next_steps: [], encouragement: 'Keep practicing!' }
      const session = buildSession(summary, results)
      addSession(session); store.setResults(session); recordPractice()
      navigate('/interview/results')
    } catch { store.reset(); navigate('/dashboard') }
    setEvaluating(false)
  }

  if (!q) return null
  const progress = (store.currentQuestionIndex / store.questions.length) * 100
  const answer   = getAnswer()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={15} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'white' }}>InterviewIQ</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>
            {store.selectedCompany ? <><Building2 size={11} style={{ display:'inline', marginRight:4 }} />{store.selectedCompany}</> : store.selectedRole}
            {' · '}{store.selectedLevel}
          </span>
          {store.resumeContext && <Badge color="cyan" style={{ fontSize: 10 }}><FileText size={10} /> Resume-based</Badge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ttsSupported && (
            <button onClick={() => { setTtsEnabled(v => !v); stopTTS() }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: ttsEnabled ? 'var(--accent2)' : 'var(--muted)' }}>
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          )}
          <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'monospace' }}>{fmt(elapsed)}</span>
          <Badge color={TYPE_COLORS[q.type] || 'muted'} style={{ textTransform: 'capitalize' }}>{q.type?.replace('_',' ')}</Badge>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{store.currentQuestionIndex + 1}/{store.questions.length}</span>
          <button onClick={() => setShowEndConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.08)', color: 'var(--accent3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            <XCircle size={13} /> End
          </button>
        </div>
      </header>

      {/* End modal */}
      {showEndConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>⚠️</p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'white', margin: '0 0 8px' }}>End interview early?</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
              You've answered {questionResults.length} of {store.questions.length} questions.<br />Progress so far will be saved.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Keep going</button>
              <button onClick={() => { setShowEndConfirm(false); handleEndSession() }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'var(--accent3)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>End & Save</button>
            </div>
          </div>
        </div>
      )}

      <ProgressBar value={progress} style={{ height: 2, borderRadius: 0 }} />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', gap: 14, padding: 14, maxWidth: 1300, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* Question */}
          <div style={{ borderRadius: 14, border: `1px solid ${timer.expired ? 'rgba(255,107,107,0.4)' : 'var(--border)'}`, background: 'var(--surface)', padding: 18, transition: 'border-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <Badge color={TYPE_COLORS[q.type] || 'muted'} style={{ textTransform: 'capitalize' }}>{q.type?.replace('_',' ')}</Badge>
              <Badge color="muted" style={{ textTransform: 'capitalize' }}>{q.difficulty}</Badge>
              {q.time_minutes && <span style={{ fontSize: 11, color: 'var(--muted)' }}>~{q.time_minutes} min</span>}
              {q.company_context && <span style={{ fontSize: 11, color: 'var(--accent2)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', padding: '1px 7px', borderRadius: 999 }}>{store.selectedCompany}</span>}
              {q.resume_reference && <span style={{ fontSize: 11, color: 'var(--success)', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', padding: '1px 7px', borderRadius: 999 }}>From your resume</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'white', lineHeight: 1.65, margin: 0, flex: 1 }}>{q.question}</p>
              {ttsSupported && (
                <button onClick={handleTTS} style={{ flexShrink: 0, background: speaking ? 'rgba(0,212,255,0.15)' : 'var(--surface2)', border: `1px solid ${speaking ? 'var(--accent2)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: speaking ? 'var(--accent2)' : 'var(--muted)' }}>
                  {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              )}
            </div>
            {q.company_context && <p style={{ fontSize: 12, color: 'var(--accent2)', margin: '10px 0 0', padding: '7px 10px', borderRadius: 8, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>💡 {q.company_context}</p>}
            {q.resume_reference && <p style={{ fontSize: 12, color: 'var(--success)', margin: '8px 0 0', padding: '7px 10px', borderRadius: 8, background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)' }}>📄 {q.resume_reference}</p>}
            {q.expected_topics?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {q.expected_topics.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t}</span>)}
              </div>
            )}
          </div>

          {/* Mode tabs */}
          {q.type === 'coding' && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 3, borderRadius: 10, width: 'fit-content' }}>
              {[{ id:'code', label:'💻 Code' }, { id:'voice', label:'🎙️ Voice' }].map(m => (
                <button key={m.id} onClick={() => setInputMode(m.id)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: inputMode === m.id ? 'var(--accent)' : 'transparent', color: inputMode === m.id ? 'white' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>{m.label}</button>
              ))}
            </div>
          )}

          {/* Code editor */}
          {inputMode === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Code2 size={12} color="var(--muted)" />
                {LANGS.map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)} style={{ padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${language===lang ? 'var(--accent)' : 'var(--border)'}`, background: language===lang ? 'rgba(124,92,252,0.15)' : 'transparent', color: language===lang ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>{lang}</button>
                ))}
              </div>
              <CodeEditor value={codeValue} onChange={setCodeValue} language={language} height={280} />
            </div>
          )}

          {/* Voice */}
          {inputMode === 'voice' && (
            <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {store.transcript && <button onClick={() => setShowAnalytics(s => !s)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><BarChart2 size={11} /> Analytics</button>}
                  {store.isListening && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--accent3)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent3)', animation: 'blink 1s infinite', display: 'inline-block' }} /> Recording</span>}
                </div>
              </div>
              {showAnalytics && store.transcript && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {[
                    { label:'WPM',    value:analytics.wpm,          color:analytics.wpmColor },
                    { label:'Words',  value:analytics.wordCount,     color:'var(--accent2)' },
                    { label:'Fillers',value:analytics.fillerCount,   color:analytics.fillerCount > 5 ? 'var(--accent3)' : 'var(--success)' },
                    { label:'Clarity',value:`${analytics.clarity}%`, color:analytics.clarity >= 85 ? 'var(--success)' : 'var(--warning)' },
                  ].map(s => (
                    <div key={s.label} style={{ flex:1, minWidth:60, padding:'6px 8px', borderRadius:8, background:'var(--surface2)', textAlign:'center' }}>
                      <p style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
                      <p style={{ fontSize:10, color:'var(--muted)', margin:0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ minHeight:90, borderRadius:10, padding:12, fontSize:13, lineHeight:1.7, background:'var(--surface2)', color:store.transcript ? 'var(--text)' : 'var(--muted)', marginBottom:10 }}>
                {store.transcript || 'Click "Start Speaking" and speak your answer…'}
                {store.isListening && <span style={{ animation:'blink 1s infinite', display:'inline-block', marginLeft:1 }}>|</span>}
              </div>
              <button onClick={handleMic} disabled={!isSupported} style={{ width:'100%', padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:store.isListening ? 'var(--accent3)' : 'var(--accent)', color:'white', fontFamily:'var(--font-body)', opacity:isSupported ? 1 : 0.5 }}>
                {store.isListening ? <><MicOff size={14} /> Stop Recording</> : <><Mic size={14} /> {store.transcript ? 'Re-record' : 'Start Speaking'}</>}
              </button>
            </div>
          )}

          {/* Hint */}
          {hint && (
            <div style={{ borderRadius:12, border:'1px solid rgba(255,181,71,0.3)', background:'rgba(255,181,71,0.06)', padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <Lightbulb size={12} color="var(--warning)" />
                <span style={{ fontSize:11, fontWeight:600, color:'var(--warning)' }}>Hint {store.hintsUsed}/3</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, margin:0 }}>{hint}</p>
            </div>
          )}

          {/* Notes */}
          {showNotes && (
            <div style={{ borderRadius:14, border:'1px solid rgba(124,92,252,0.3)', background:'rgba(124,92,252,0.04)', padding:14 }}>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px', display:'flex', alignItems:'center', gap:6 }}>
                <StickyNote size={12} /> Session Notes
              </p>
              <textarea value={store.sessionNotes} onChange={e => store.setSessionNotes(e.target.value)}
                placeholder="Jot down thoughts, things to remember, follow-up questions…"
                style={{ width:'100%', minHeight:100, resize:'vertical', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font-body)', lineHeight:1.6, boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
            </div>
          )}

          {/* Result */}
          {currentResult && (
            <div style={{ borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'white' }}>{currentResult.score}/10</span>
                <Badge color={currentResult.grade <= 'B' ? 'success' : currentResult.grade <= 'C' ? 'warning' : 'danger'}>Grade {currentResult.grade}</Badge>
                {currentResult.timeUsed > 0 && <span style={{ fontSize:11, color:'var(--muted)', display:'flex', alignItems:'center', gap:3 }}><Clock size={10} /> {fmt(currentResult.timeUsed)} used</span>}
              </div>
              <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14, lineHeight:1.6 }}>{currentResult.summary}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                {currentResult.strengths?.length > 0 && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:'var(--success)', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px' }}>✓ Strengths</p>
                    {currentResult.strengths.map((s,i) => <p key={i} style={{ fontSize:12, color:'var(--text)', margin:'0 0 4px', display:'flex', gap:5 }}><span style={{ color:'var(--success)' }}>•</span>{s}</p>)}
                  </div>
                )}
                {currentResult.improvements?.length > 0 && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:'var(--accent3)', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px' }}>→ Improve</p>
                    {currentResult.improvements.map((s,i) => <p key={i} style={{ fontSize:12, color:'var(--text)', margin:'0 0 4px', display:'flex', gap:5 }}><span style={{ color:'var(--accent3)' }}>→</span>{s}</p>)}
                  </div>
                )}
              </div>
              <Button size="lg" onClick={handleNext} loading={evaluating} style={{ width:'100%' }}>
                {isLast ? '🏁 Finish & See Results' : <>Next Question <ChevronRight size={15} /></>}
              </Button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ width:220, display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>

          {/* Timer */}
          <div style={{ borderRadius:14, border:`1px solid ${timer.expired ? 'rgba(255,107,107,0.4)' : 'var(--border)'}`, background:'var(--surface)', padding:14, transition:'border-color 0.3s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Clock size={12} color={timer.color} />
                <span style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Time</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={timer.running ? timer.pause : timer.start} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontFamily:'var(--font-body)' }}>{timer.running ? 'Pause' : 'Resume'}</button>
                <button onClick={timer.reset} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontFamily:'var(--font-body)' }}>Reset</button>
              </div>
            </div>
            <p style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, color:timer.color, margin:'0 0 6px', transition:'color 0.3s' }}>{timer.label}</p>
            <ProgressBar value={timer.pct} color={timer.color} style={{ height:4 }} />
            {timer.expired && <p style={{ fontSize:11, color:'var(--accent3)', margin:'6px 0 0', fontWeight:600 }}>⏰ Time's up — wrap up!</p>}
          </div>

          {/* Progress */}
          <div style={{ borderRadius:14, border:'1px solid var(--border)', background:'var(--surface)', padding:14 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 10px' }}>Progress</p>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {store.questions.map((_,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: i < store.currentQuestionIndex ? 'var(--success)' : i === store.currentQuestionIndex ? 'var(--accent)' : 'var(--border)' }} />
                  <span style={{ fontSize:11, color: i === store.currentQuestionIndex ? 'var(--text)' : 'var(--muted)', fontWeight: i === store.currentQuestionIndex ? 600 : 400 }}>
                    Q{i+1} · {store.questions[i].type?.replace('_',' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!currentResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button onClick={() => setShowNotes(s => !s)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:10, border:`1px solid ${showNotes ? 'var(--accent)' : 'var(--border)'}`, background: showNotes ? 'rgba(124,92,252,0.1)' : 'transparent', color: showNotes ? 'var(--accent)' : 'var(--muted)', cursor:'pointer', fontSize:12, fontFamily:'var(--font-body)', fontWeight:500 }}>
                <StickyNote size={12} /> {showNotes ? 'Hide Notes' : 'Add Notes'}
                {store.sessionNotes && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'var(--accent)' }} />}
              </button>
              <Button variant="ghost" size="sm" onClick={handleHint} disabled={store.hintsUsed >= 3 || loadingHint} style={{ width:'100%', gap:6 }}>
                {loadingHint ? <Spinner size={12} /> : <Lightbulb size={12} />}
                {store.hintsUsed >= 3 ? 'No more hints' : `Hint (${store.hintsUsed}/3)`}
              </Button>
              <Button size="md" onClick={handleSubmit} disabled={!answer?.trim() || evaluating} loading={evaluating} style={{ width:'100%', gap:6 }}>
                <Send size={13} /> {evaluating ? 'Evaluating…' : 'Submit Answer'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
