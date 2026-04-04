import { useCallback, useEffect, useRef, useState } from 'react'

export function useQuestionTimer(initialSeconds, { onExpire, autoStart = false } = {}) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning]     = useState(autoStart)
  const [expired, setExpired]     = useState(false)
  const intervalRef = useRef(null)

  const clear = () => { clearInterval(intervalRef.current); intervalRef.current = null }

  useEffect(() => {
    if (!running) { clear(); return }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clear()
          setRunning(false)
          setExpired(true)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clear
  }, [running])

  // Reset when initialSeconds changes (new question)
  useEffect(() => {
    clear()
    setRemaining(initialSeconds)
    setRunning(autoStart)
    setExpired(false)
  }, [initialSeconds])

  const start  = useCallback(() => { setExpired(false); setRunning(true)  }, [])
  const pause  = useCallback(() => setRunning(false), [])
  const reset  = useCallback(() => { clear(); setRemaining(initialSeconds); setRunning(false); setExpired(false) }, [initialSeconds])

  const pct    = initialSeconds > 0 ? (remaining / initialSeconds) * 100 : 100
  const color  = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--accent3)'
  const mm     = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss     = String(remaining % 60).padStart(2, '0')
  const label  = `${mm}:${ss}`

  return { remaining, running, expired, pct, color, label, start, pause, reset }
}
