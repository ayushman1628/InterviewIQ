import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { saveSessionToDB, fetchSessionsFromDB, saveStreakToDB, fetchStreakFromDB, signOut as sbSignOut, isConfigured } from '../lib/supabase'

// ── Auth Store ──────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: async () => {
        if (get().user?.supabase) await sbSignOut().catch(() => {})
        set({ user: null, isAuthenticated: false })
      },
      updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),
    }),
    { name: 'interviewiq-auth' }
  )
)

// ── Session Store ───────────────────────────────────────────────
export const useSessionStore = create((set, get) => ({
  selectedRole: null, selectedLevel: null, selectedTypes: [],
  selectedCompany: null, resumeContext: null,
  currentSession: null, questions: [], currentQuestionIndex: 0,
  transcript: '', isListening: false, hintsUsed: 0, sessionStartTime: null,
  sessionNotes: '', sessionResults: null,

  setRole:          (r) => set({ selectedRole: r }),
  setLevel:         (l) => set({ selectedLevel: l }),
  setTypes:         (t) => set({ selectedTypes: t }),
  setCompany:       (c) => set({ selectedCompany: c }),
  setResumeContext: (t) => set({ resumeContext: t }),
  setSessionNotes:  (n) => set({ sessionNotes: n }),

  startSession: (questions) => set({
    questions, currentQuestionIndex: 0, transcript: '', hintsUsed: 0,
    sessionStartTime: Date.now(), sessionNotes: '',
    currentSession: { id: crypto.randomUUID(), startedAt: new Date() },
  }),

  setTranscript: (t) => set({ transcript: t }),
  setListening:  (v) => set({ isListening: v }),
  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1, transcript: '', hintsUsed: 0 })),
  addHint:  () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),
  setResults: (r) => set({ sessionResults: r }),
  reset: () => set({
    selectedRole: null, selectedLevel: null, selectedTypes: [],
    selectedCompany: null, resumeContext: null, currentSession: null,
    questions: [], currentQuestionIndex: 0, transcript: '', isListening: false,
    hintsUsed: 0,
    sessionStartTime: null, sessionNotes: '', sessionResults: null,
  }),
}))

// ── History Store — syncs to Supabase when configured ───────────
export const useHistoryStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      synced: false,

      // Called after login to load sessions from Supabase
      syncFromCloud: async (userId) => {
        if (!isConfigured || !userId) return
        const remote = await fetchSessionsFromDB(userId)
        if (remote) {
          set({ sessions: remote, synced: true })
        }
      },

      addSession: async (session) => {
        // Always save locally first
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, 50) }))
        // Then sync to Supabase if configured
        const { user } = useAuthStore.getState()
        if (isConfigured && user?.id && user?.supabase) {
          await saveSessionToDB(session, user.id)
        }
      },

      clearHistory: () => set({ sessions: [] }),
    }),
    { name: 'interviewiq-history' }
  )
)

// ── Streak Store — syncs to Supabase when configured ────────────
export const useStreakStore = create(
  persist(
    (set, get) => ({
      currentStreak: 0, longestStreak: 0,
      lastPracticeDate: null, practiceDates: [],

      syncFromCloud: async (userId) => {
        if (!isConfigured || !userId) return
        const remote = await fetchStreakFromDB(userId)
        if (remote) set(remote)
      },

      recordPractice: () => {
        const today = new Date().toISOString().slice(0, 10)
        const { lastPracticeDate, currentStreak, longestStreak, practiceDates } = get()
        if (lastPracticeDate === today) return
        const yesterday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const newStreak  = lastPracticeDate === yesterday ? currentStreak + 1 : 1
        const newLongest = Math.max(longestStreak, newStreak)
        const newDates   = [...new Set([...practiceDates, today])].slice(-90)
        const newState   = { currentStreak: newStreak, longestStreak: newLongest, lastPracticeDate: today, practiceDates: newDates }
        set(newState)
        // Sync to Supabase
        const { user } = useAuthStore.getState()
        if (isConfigured && user?.id && user?.supabase) {
          saveStreakToDB(newState, user.id)
        }
      },
    }),
    { name: 'interviewiq-streak' }
  )
)
