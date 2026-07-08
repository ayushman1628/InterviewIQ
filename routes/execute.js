import { Router } from 'express'
import { JUDGE0_CE, LANG_IDS } from '../config/env.js'

const router = Router()

router.post('/execute', async (req, res) => {
  const { code, language, stdin = '' } = req.body
  if (!code) return res.status(400).json({ error: 'No code provided' })

  const langId = LANG_IDS[language]
  if (!langId) return res.status(400).json({ error: `Unsupported language: ${language}` })

  console.log(`[judge0-ce] executing ${language} (lang_id=${langId})...`)

  try {
    const submitRes = await fetch(`${JUDGE0_CE}?wait=true&base64_encoded=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: code,
        language_id: langId,
        stdin,
        cpu_time_limit: 10,
        wall_time_limit: 15,
        memory_limit: 262144,
      }),
    })

    if (!submitRes.ok) {
      const err = await submitRes.text()
      console.error('[judge0-ce] submit error:', submitRes.status, err.slice(0, 200))
      return res
        .status(submitRes.status)
        .json({ error: `Submission failed (${submitRes.status}). Try again in a moment.` })
    }

    const result = await submitRes.json()

    const statusId = result.status?.id
    const statusDesc = result.status?.description || 'Unknown'
    const stdout = result.stdout || ''
    const stderr = result.stderr || result.compile_output || ''
    const accepted = statusId === 3

    console.log(`[judge0-ce] done — status: ${statusDesc}`)

    res.json({
      status: statusDesc,
      accepted,
      stdout: stdout.slice(0, 5000),
      stderr: stderr.slice(0, 2000),
      time: result.time ? `${result.time}s` : null,
      memory: result.memory ? `${Math.round(result.memory / 1024)}KB` : null,
      exitCode: result.exit_code,
    })
  } catch (err) {
    console.error('[judge0-ce] error:', err.message)
    res.status(503).json({ error: 'Code execution temporarily unavailable. Try again in a moment.' })
  }
})

export default router
