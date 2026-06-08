import { Router } from 'express'
import { createRequire } from 'module'

const router = Router()

router.post('/extract-text', async (req, res) => {
  let multer
  try {
    const r = createRequire(import.meta.url)
    multer = r('multer')
  } catch {
    return res.status(500).json({ error: 'Run: npm install multer' })
  }

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const { originalname, buffer } = req.file
    const ext = originalname.toLowerCase().split('.').pop()

    try {
      let text = ''
      if (ext === 'txt') {
        text = buffer.toString('utf-8')
      } else if (ext === 'pdf') {
        const r = createRequire(import.meta.url)
        const pdfParse = r('pdf-parse')
        text = (await pdfParse(buffer)).text
      } else if (ext === 'docx') {
        const r = createRequire(import.meta.url)
        const mammoth = r('mammoth')
        text = (await mammoth.extractRawText({ buffer })).value
      } else {
        return res.status(400).json({ error: 'Use .txt, .pdf, or .docx' })
      }
      if (!text.trim()) return res.status(422).json({ error: 'Could not extract text.' })
      res.json({ text: text.trim() })
    } catch (e) {
      console.error('[extract]', e.message)
      res.status(500).json({ error: e.message })
    }
  })
})

export default router
