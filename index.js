import express from 'express'
import { PORT, ALLOWED_ORIGINS, MODEL, getOpenRouterKey } from './config/env.js'
import { createCorsMiddleware } from './middleware/core.js'
import aiRouter from './routes/ai.js'
import extractRouter from './routes/extract.js'
import executeRouter from './routes/execute.js'

const app = express()

app.use(createCorsMiddleware(ALLOWED_ORIGINS))
app.use(express.json({ limit: '10mb' }))

app.get('/', (_, res) => res.send('InterviewIQ server running ✅'))

app.use('/api', aiRouter)
app.use('/api', extractRouter)
app.use('/api', executeRouter)

app.listen(PORT, () => {
  const key = getOpenRouterKey()
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ✅  InterviewIQ server started')
  console.log(`  🌐  http://localhost:${PORT}`)
  console.log(`  🤖  ${MODEL}`)
  console.log(`  🔑  API key: ${key ? '✓ loaded' : '✗ MISSING'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (!key) {
    console.log('')
    console.log('  ⚠️  Add to your .env file:')
    console.log('  OPENROUTER_API_KEY=sk-or-...')
    console.log('')
  }
})
