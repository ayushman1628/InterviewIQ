// ── Supabase Client ─────────────────────────────────────────────
// Add these to your .env file:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbG...

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const isConfigured  = !!(SUPABASE_URL && SUPABASE_ANON)

let supabase = null

function getClient() {
  if (!isConfigured) return null
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
  return supabase
}

export function isNetworkError(err) {
  const msg = err?.message || String(err)
  return /failed to fetch|load failed|networkerror|fetch|enotfound|getaddrinfo/i.test(msg)
}

export { isConfigured }

// ── Auth ─────────────────────────────────────────────────────────
export async function signUp({ email, password, name }) {
  const sb = getClient()
  if (!sb) throw new Error('Supabase not configured')

  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name } },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signIn({ email, password }) {
  const sb = getClient()
  if (!sb) throw new Error('Supabase not configured')

  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  const sb = getClient()
  if (!sb) return
  await sb.auth.signOut()
}

export async function getSession() {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data?.session
}

export async function onAuthChange(callback) {
  const sb = getClient()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data?.subscription?.unsubscribe()
}

// ── Sessions DB ──────────────────────────────────────────────────
export async function saveSessionToDB(session, userId) {
  const sb = getClient()
  if (!sb || !userId) return null

  const { error } = await sb.from('sessions').upsert({
    id:             session.id,
    user_id:        userId,
    role:           session.role,
    level:          session.level,
    company:        session.company || null,
    overall_score:  session.overall_score,
    grade:          session.grade,
    headline:       session.headline,
    duration_secs:  session.duration_seconds,
    notes:          session.notes || null,
    questions:      session.questions,        // stored as JSON
    strengths:      session.strengths,
    focus_areas:    session.focus_areas,
    next_steps:     session.next_steps,
    encouragement:  session.encouragement,
    started_at:     session.startedAt,
  })

  if (error) console.error('[supabase] saveSession error:', error.message)
  return !error
}

export async function fetchSessionsFromDB(userId) {
  const sb = getClient()
  if (!sb || !userId) return null

  const { data, error } = await sb
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) { console.error('[supabase] fetchSessions error:', error.message); return null }
  return data.map(row => ({
    id:               row.id,
    startedAt:        row.started_at,
    role:             row.role,
    level:            row.level,
    company:          row.company,
    overall_score:    row.overall_score,
    grade:            row.grade,
    headline:         row.headline,
    duration_seconds: row.duration_secs,
    notes:            row.notes,
    questions:        row.questions,
    strengths:        row.strengths,
    focus_areas:      row.focus_areas,
    next_steps:       row.next_steps,
    encouragement:    row.encouragement,
  }))
}

export async function deleteSessionFromDB(sessionId, userId) {
  const sb = getClient()
  if (!sb || !userId) return
  await sb.from('sessions').delete().eq('id', sessionId).eq('user_id', userId)
}

// ── Streak DB ────────────────────────────────────────────────────
export async function saveStreakToDB(streakData, userId) {
  const sb = getClient()
  if (!sb || !userId) return

  await sb.from('streaks').upsert({
    user_id:            userId,
    current_streak:     streakData.currentStreak,
    longest_streak:     streakData.longestStreak,
    last_practice_date: streakData.lastPracticeDate,
    practice_dates:     streakData.practiceDates,
    updated_at:         new Date().toISOString(),
  })
}

export async function fetchStreakFromDB(userId) {
  const sb = getClient()
  if (!sb || !userId) return null

  const { data, error } = await sb
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return {
    currentStreak:    data.current_streak,
    longestStreak:    data.longest_streak,
    lastPracticeDate: data.last_practice_date,
    practiceDates:    data.practice_dates || [],
  }
}
