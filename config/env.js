import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve .env next to package root — not process.cwd() (IDE / other cwd breaks dotenv otherwise)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

export const PORT = process.env.PORT || 3001

/** Trim — Windows CRLF or stray spaces in .env can invalidate the key */
export function getOpenRouterKey() {
  return (process.env.OPENROUTER_API_KEY || '').trim()
}

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
    ]

/** Best free model on OpenRouter */
export const MODEL = 'openrouter/auto'
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Judge0 CE public instance — free, no API key */
export const JUDGE0_CE = 'https://ce.judge0.com/submissions'

export const LANG_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  typescript: 74,
  c: 50,
}