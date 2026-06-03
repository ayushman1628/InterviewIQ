import { useCallback, useEffect, useRef, useState } from 'react'

export function useTTS() {
  const [speaking, setSpeaking]   = useState(false)
  const [supported, setSupported] = useState(false)
  const utterRef = useRef(null)

  useEffect(() => {
    setSupported('speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const speak = useCallback((text, { rate = 0.92, pitch = 1, volume = 1 } = {}) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate   = rate
    utter.pitch  = pitch
    utter.volume = volume

    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utter.voice = preferred

    utter.onstart = () => setSpeaking(true)
    utter.onend   = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, supported }
}
