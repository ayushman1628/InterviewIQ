import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../store'

export function useSpeech() {
  const recognitionRef = useRef(null)
  const { setTranscript, setListening, transcript } = useSessionStore()

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    let finalTranscript = ''

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalTranscript += t + ' '
        else interim += t
      }
      setTranscript(finalTranscript + interim)
    }

    rec.onend = () => setListening(false)
    rec.onerror = (e) => {
      console.error('Speech error:', e.error)
      setListening(false)
    }

    recognitionRef.current = rec
    return () => { try { rec.stop() } catch {} }
  }, [isSupported])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {}
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setListening(false)
    } catch {}
  }, [])

  const resetTranscript = useCallback(() => setTranscript(''), [])

  return { isSupported, startListening, stopListening, resetTranscript, transcript }
}