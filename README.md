# InterviewIQ 
**AI-Powered Mock Interview Platform**

A full-stack React app for practicing technical interviews with voice input, AI feedback, DSA coding rounds, resume analysis, and analytics.

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env` file in the project root:

```env
# Required — powers all AI features
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional — enables real auth + cloud sync across devices
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

Get a free OpenRouter key at [openrouter.ai](https://openrouter.ai/).

For Supabase setup, create a free project at [supabase.com](https://supabase.com), run `supabase-schema.sql` in the SQL Editor, then copy your project URL and anon key into `.env`.

### 3. Run the app
```bash
npm run dev:all
```

This starts both the Vite frontend (`http://localhost:5173`) and the Express API server (`http://localhost:3001`). The Vite dev server proxies `/api` requests to the backend automatically.

**Alternatively**, run them in separate terminals:
```bash
npm run dev      # frontend only
npm run server   # backend only
```

---

## 📁 Project Structure

```
interviewiq/
├── index.js                    # Express server entry point
├── config/
│   └── env.js                  # Port, OpenRouter, Judge0 config
├── middleware/
│   ├── cors.js                 # CORS for allowed origins
│   └── rateLimit.js            # AI endpoint rate limiting
├── routes/
│   ├── ai.js                   # POST /api/gemini — OpenRouter proxy
│   ├── extract.js              # POST /api/extract-text — PDF/DOCX parsing
│   └── execute.js              # POST /api/execute — Judge0 code execution
├── supabase-schema.sql         # DB schema for cloud sync
│
└── src/
    ├── pages/
    │   ├── LandingPage.jsx         # Home / marketing page
    │   ├── AuthPages.jsx           # Login + Register
    │   ├── DashboardPage.jsx       # Stats, streaks, weak-area charts
    │   ├── InterviewSetupPage.jsx  # Role/level/type + company/resume modes
    │   ├── InterviewSessionPage.jsx# Live interview room
    │   ├── ResultsPage.jsx         # Post-session analytics
    │   ├── HistoryPage.jsx         # Past sessions
    │   ├── DSARoundPage.jsx        # DSA coding round
    │   ├── ResumeRatingPage.jsx    # AI resume scoring
    │   ├── SettingsPage.jsx        # Profile + server status
    │   └── NotFoundPage.jsx        # 404 page
    ├── components/
    │   ├── ui/
    │   │   ├── index.jsx           # Button, Card, Badge, etc.
    │   │   ├── CodeEditor.jsx      # Monaco Editor (CDN)
    │   │   ├── StreakTracker.jsx   # Practice streak widget
    │   │   ├── Skeletons.jsx       # Loading skeletons
    │   │   └── ErrorBoundary.jsx
    │   └── layout/AppLayout.jsx    # Sidebar navigation
    ├── store/index.js              # Zustand state (auth, session, history, streak)
    ├── lib/
    │   ├── api.js                  # AI API client (via Express proxy)
    │   └── supabase.js             # Auth + cloud sync
    ├── hooks/
    │   ├── useSpeech.js            # Web Speech API (speech-to-text)
    │   ├── useSpeechAnalytics.js   # WPM, filler words, clarity
    │   ├── useTTS.js               # Text-to-speech for questions
    │   └── useQuestionTimer.js     # Per-question countdown
    ├── App.jsx                     # Router
    ├── main.jsx                    # Entry point
    └── index.css                   # Global styles + CSS variables
```

---

## 🎯 Features

| Feature | Status |
|---|---|
| Auth (Supabase + local fallback) | ✅ |
| Role + level + question type selection | ✅ |
| Company-specific questions (Google, Amazon, Meta, etc.) | ✅ |
| Resume-based personalized questions | ✅ |
| AI question generation | ✅ |
| Voice input (speech-to-text) | ✅ |
| Text-to-speech for questions | ✅ |
| Speech analytics (WPM, fillers, clarity) | ✅ |
| AI answer evaluation | ✅ |
| Progressive hint system | ✅ |
| Post-session analytics | ✅ (Radar + Line charts) |
| Session history | ✅ |
| Practice streak tracker | ✅ |
| DSA coding round (Monaco + Judge0) | ✅ |
| AI code review | ✅ |
| Resume rating + PDF/DOCX upload | ✅ |
| Cloud sync (Supabase) | ✅ (optional) |
| Settings + server health check | ✅ |

---

## 🔧 Tech Stack

**Frontend**
- React 18 + Vite 6
- Tailwind CSS v4
- Zustand (with persistence)
- Recharts
- Lucide React
- Monaco Editor (CDN)

**Backend**
- Express 4
- OpenRouter API (`openrouter/auto`)
- Judge0 CE (free code execution)
- pdf-parse + mammoth (resume file extraction)

**Auth & Storage**
- Supabase (auth, sessions, streaks) — optional
- localStorage fallback when Supabase is not configured

**Voice**
- Web Speech API (browser-native STT + TTS)

**Fonts**
- Syne (display) + DM Sans (body)

---

## 🗺️ API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server status + API key check |
| `POST` | `/api/gemini` | AI completions via OpenRouter |
| `POST` | `/api/extract-text` | Extract text from PDF/DOCX/TXT |
| `POST` | `/api/execute` | Run code via Judge0 CE |

Supported languages for code execution: JavaScript, Python, Java, C++, TypeScript, C.

---


## 📝 Notes

- **Auth:** Uses Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Without them, auth falls back to localStorage (single-device only).
- **Data storage:** Sessions and streaks sync to Supabase when configured; otherwise they persist in browser localStorage.
- **AI key:** The OpenRouter API key lives server-side in `.env` — it is never exposed to the browser.
- **Speech recognition** works best in Chrome. Safari has partial support. Firefox requires a flag.
- **Code execution** uses the free Judge0 CE public instance — no API key needed, but availability may vary under heavy load.
