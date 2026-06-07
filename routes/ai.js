import { Router } from 'express'
import { MODEL, OPENROUTER_URL, getOpenRouterKey } from '../config/env.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

router.get('/health', (_, res) => {
  const hasKey = !!getOpenRouterKey()
  res.json({ ok: true, model: MODEL, key: hasKey })
})

/** Kept path `/gemini` so frontend needs no change */
router.post('/gemini', rateLimit(30, 60000), async (req, res) => {
  const apiKey = getOpenRouterKey()
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY not set in .env — get a free key at openrouter.ai',
    })
  }

  const { system, prompt, maxTokens = 1500 } = req.body
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: prompt })

  console.log(`[AI] calling ${MODEL} — prompt: ${prompt.length} chars`)

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'InterviewIQ',
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.error?.message || `OpenRouter error ${response.status}`
      console.error('[AI] error:', msg)
      return res.status(response.status).json({ error: msg })
    }

    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      console.error('[AI] empty response:', JSON.stringify(data).slice(0, 300))
      return res.status(500).json({ error: 'AI returned an empty response. Try again.' })
    }

    console.log(`[AI] success — response: ${text.length} chars`)
    res.json({ text })
  } catch (err) {
    console.error('[AI] fetch failed:', err.message)
    res.status(500).json({ error: 'Could not reach AI: ' + err.message })
  }
})

export default router
