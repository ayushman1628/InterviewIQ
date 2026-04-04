import { useMemo } from 'react'

const FILLERS = ['um', 'uh', 'like', 'basically', 'literally', 'you know', 'kind of', 'sort of', 'right', 'so', 'actually', 'honestly', 'i mean']

export function useSpeechAnalytics(transcript = '', durationSeconds = 0) {
  return useMemo(() => {
    if (!transcript.trim()) return { wpm: 0, fillerCount: 0, fillerWords: {}, wordCount: 0, clarity: 100 }

    const lower = transcript.toLowerCase()
    const words  = transcript.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length

    // Words per minute
    const minutes = durationSeconds / 60
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0

    // Count each filler
    const fillerWords = {}
    let fillerCount = 0
    for (const filler of FILLERS) {
      const re = new RegExp(`\\b${filler}\\b`, 'gi')
      const matches = lower.match(re)
      if (matches?.length) {
        fillerWords[filler] = matches.length
        fillerCount += matches.length
      }
    }

    // Clarity score: penalise filler words (max penalty 40pts)
    const fillerRatio  = wordCount > 0 ? fillerCount / wordCount : 0
    const clarityPenalty = Math.min(40, Math.round(fillerRatio * 200))
    const clarity = Math.max(60, 100 - clarityPenalty)

    // WPM rating
    const wpmRating = wpm < 100 ? 'Too slow' : wpm > 180 ? 'Too fast' : 'Good pace'
    const wpmColor  = wpm < 100 || wpm > 180 ? 'var(--warning)' : 'var(--success)'

    return { wpm, wpmRating, wpmColor, fillerCount, fillerWords, wordCount, clarity }
  }, [transcript, durationSeconds])
}
