const PROXY = (import.meta.env.VITE_API_URL || '') + '/api/gemini'

async function callGemini(system, prompt, maxTokens = 1500) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, prompt, maxTokens }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${res.status}`)
  }

  const data = await res.json()
  return data.text
}

function parseJSON(text) {
  // Strip markdown code fences the AI sometimes adds
  let clean = text.replace(/```json\s*|\s*```/g, '').trim()

  // First try: direct parse
  try { return JSON.parse(clean) } catch (_) { /* fall through to recovery */ }

  // ── Attempt to repair truncated JSON ──────────────────────────
  // The AI response may be cut off mid-string or mid-object when
  // it hits the token limit.  We try increasingly aggressive fixes.

  // 1. Close any unterminated string literal
  const quotes = (clean.match(/"/g) || []).length
  if (quotes % 2 !== 0) clean += '"'

  // 2. Remove a trailing partial key-value (e.g.  , "key": "val  )
  clean = clean.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '')
  clean = clean.replace(/,\s*"[^"]*"\s*:\s*$/, '')
  clean = clean.replace(/,\s*"[^"]*$/, '')
  clean = clean.replace(/,\s*$/, '')

  // 3. Balance brackets / braces
  const open  = ch => (clean.match(new RegExp('\\' + ch, 'g')) || []).length
  const close = ch => (clean.match(new RegExp('\\' + ch, 'g')) || []).length
  let braces   = open('{') - close('}')
  let brackets = open('[') - close(']')
  while (braces-- > 0) clean += '}'
  while (brackets-- > 0) clean += ']'

  try { return JSON.parse(clean) } catch (_) { /* fall through */ }

  // 4. Last resort — extract every complete JSON object from the text
  const objects = []
  const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  let m
  while ((m = regex.exec(text)) !== null) {
    try { objects.push(JSON.parse(m[0])) } catch (_) { /* skip broken */ }
  }
  if (objects.length > 0) return objects

  // Nothing worked — throw so the caller can show a user-friendly message
  throw new Error('AI returned malformed JSON. Please try again.')
}

// ── Generate questions ──────────────────────────────────────────
export async function generateQuestions({ role, level, types }) {
  const system = `You are a senior technical interviewer at a top tech company.
Generate realistic interview questions. Return ONLY a valid JSON array — no markdown, no explanation.`

  const prompt = `Generate 5 interview questions for a ${role} engineer at ${level} level.
Include these question types where possible: ${types.join(', ')}.

Return a JSON array where each object has exactly these fields:
- id: string (q1, q2, q3...)
- type: "coding" | "behavioral" | "system_design" | "domain"
- question: string (the full question text)
- expected_topics: string[] (3-5 key topics a good answer should cover)
- difficulty: "easy" | "medium" | "hard"
- time_minutes: number (suggested answer time)`

  const text = await callGemini(system, prompt, 1500)
  return parseJSON(text)
}

// ── Company-specific questions ──────────────────────────────────
export async function generateCompanyQuestions({ role, level, types, company }) {
  const system = `You are a senior interviewer who deeply knows ${company}'s interview process and culture.
Return ONLY a valid JSON array — no markdown, no explanation.`

  const prompt = `Generate 5 interview questions for a ${role} engineer at ${level} level applying to ${company}.
Include these types: ${types.join(', ')}.
Match ${company}'s known interview style (Google = algorithms+system design, Amazon = leadership principles, Meta = scale+product thinking, etc.).

Return a JSON array where each object has:
- id: string (q1, q2...)
- type: "coding" | "behavioral" | "system_design" | "domain"
- question: string
- company_context: string (1 sentence — why ${company} specifically asks this)
- expected_topics: string[]
- difficulty: "easy" | "medium" | "hard"
- time_minutes: number`

  const text = await callGemini(system, prompt, 1600)
  return parseJSON(text)
}

// ── Resume-based questions ──────────────────────────────────────
export async function generateResumeQuestions({ resumeText, role, level, types }) {
  const system = `You are a thorough interviewer who has carefully read the candidate's resume.
Generate questions that directly reference their specific experience, projects, and skills.
Return ONLY a valid JSON array — no markdown, no explanation.`

  const prompt = `Candidate is applying for: ${role} (${level} level)
Question types to include: ${types.join(', ')}

Their resume:
---
${resumeText.slice(0, 5000)}
---

Generate 5 interview questions that reference SPECIFIC things from this resume (projects, companies, tech stack, metrics).
Each question must feel personal, not generic.

Return a JSON array where each object has:
- id: string (q1, q2...)
- type: "coding" | "behavioral" | "system_design" | "domain"
- question: string (directly references their resume)
- resume_reference: string (which part of the resume this is based on)
- expected_topics: string[]
- difficulty: "easy" | "medium" | "hard"
- time_minutes: number`

  const text = await callGemini(system, prompt, 1600)
  return parseJSON(text)
}

// ── Evaluate answer ─────────────────────────────────────────────
export async function evaluateAnswer({ question, transcript, role, level }) {
  const system = `You are a strict but fair technical interviewer evaluating a candidate's answer.
Be specific and constructive. Return ONLY valid JSON — no markdown, no explanation.`

  const prompt = `Role: ${role} (${level} level)
Question: ${question}
Candidate's answer: "${transcript}"

Return a JSON object with exactly these fields:
- score: number 0-10
- grade: "A" | "B" | "C" | "D" | "F"
- summary: string (2-3 sentence overall assessment)
- strengths: string[] (2-3 specific things done well)
- improvements: string[] (2-3 specific areas to improve)
- model_answer_hint: string (1-2 sentences hinting at the ideal answer)
- communication_score: number 0-10
- technical_score: number 0-10`

  const text = await callGemini(system, prompt, 800)
  return parseJSON(text)
}

// ── Progressive hint ────────────────────────────────────────────
export async function getHint({ question, hintNumber, role }) {
  const levels = ['a gentle nudge', 'a clearer direction', 'a strong hint — almost the approach']
  const level  = levels[Math.min(hintNumber - 1, 2)]

  const system = `You are a helpful interviewer giving a hint. Be concise. Do NOT reveal the full answer.`
  const prompt = `Question: "${question}"\nGive ${level}. Maximum 2-3 sentences.`

  return callGemini(system, prompt, 200)
}

// ── Session summary ─────────────────────────────────────────────
export async function generateSummary({ role, level, questionResults }) {
  const resultsText = questionResults
    .map((r, i) => `Q${i + 1} (${r.type}): Score ${r.score}/10 — ${r.summary}`)
    .join('\n')

  const system = `You are a career coach giving post-interview feedback. Be specific and encouraging.
Return ONLY valid JSON — no markdown, no explanation.`

  const prompt = `Interview results for ${role} (${level} level):
${resultsText}

Return a JSON object with exactly these fields:
- overall_score: number 0-100
- grade: "A" | "B" | "C" | "D" | "F"
- headline: string (one punchy sentence summary)
- strengths: string[] (top 3 overall strengths)
- focus_areas: string[] (top 3 things to work on)
- next_steps: string[] (3 concrete action items)
- encouragement: string (2-3 motivating sentences)`

  const text = await callGemini(system, prompt, 800)
  return parseJSON(text)
}

// ── Rate resume ─────────────────────────────────────────────────
export async function rateResume({ resumeText, targetRole, level }) {
  const system = `You are an expert resume reviewer and career coach.
Return ONLY valid JSON — no markdown, no explanation.`

  const prompt = `Rate this resume for a ${targetRole || 'General'} role at ${level || 'Mid'} level.

Resume:
${resumeText}

Return a JSON object with exactly these fields:
- overall_score: number 0-100
- grade: "A" | "B" | "C" | "D" | "F"
- summary: string (2-3 sentences)
- category_scores: {
    "ats_score": number 0-100,
    "content_score": number 0-100,
    "impact_score": number 0-100,
    "clarity_score": number 0-100,
    "formatting_score": number 0-100
  }
- strengths: string[] (3 items)
- improvements: string[] (4 items)
- keyword_gaps: string[] (5 items)
- rewrite_suggestions: string[] (3 items)`

  const text = await callGemini(system, prompt, 1200)
  return parseJSON(text)
}

// ── DSA questions ───────────────────────────────────────────────
export async function generateDSAQuestions({ topic, difficulty, count }) {
  const system = `You are a technical interviewer specialising in Data Structures and Algorithms.
Generate real coding problems like LeetCode. Return ONLY valid JSON array — no markdown, no explanation.`

  const topicLine = topic === 'all' ? 'Cover a variety of DSA topics.' : `Focus on: ${topic}.`
  const diffLine  = difficulty === 'mixed'
    ? 'Mix easy, medium, and hard difficulties.'
    : `All problems should be ${difficulty} difficulty.`

  const prompt = `Generate ${count} DSA coding problems.
${topicLine}
${diffLine}

Return a JSON array where each object has:
- id: string (p1, p2...)
- question: string (full problem statement, clear and detailed)
- topic: string (e.g. "Arrays", "Dynamic Programming")
- difficulty: "easy" | "medium" | "hard"
- examples: array of { input: string, output: string, explanation?: string } (2 examples)
- constraints: string[] (2-4 constraints like "1 <= n <= 10^5")
- time_minutes: number (suggested time)`

  const text = await callGemini(system, prompt, 4000)
  return parseJSON(text)
}

// ── Evaluate code submission ────────────────────────────────────
export async function evaluateCode({ question, code, language, difficulty }) {
  const system = `You are a senior engineer reviewing a DSA solution.
Be specific about time/space complexity and correctness. Return ONLY valid JSON — no markdown.`

  const prompt = `Problem: ${question}

Candidate's ${language} solution:
\`\`\`${language}
${code}
\`\`\`

Evaluate this solution and return a JSON object with exactly:
- score: number 0-10
- grade: "A" | "B" | "C" | "D" | "F"
- summary: string (2-3 sentences on correctness and approach)
- time_complexity: string (e.g. "O(n log n)")
- space_complexity: string (e.g. "O(n)")
- is_correct: boolean
- strengths: string[] (2-3 specific positives)
- improvements: string[] (2-3 specific improvements)
- optimal_approach: string (1-2 sentences on the best approach)`

  const text = await callGemini(system, prompt, 800)
  return parseJSON(text)
}
