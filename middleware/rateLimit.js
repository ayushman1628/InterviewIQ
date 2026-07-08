const rateMap = new Map()

export function rateLimit(maxReqs = 30, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    const rec = rateMap.get(ip) || { count: 0, start: now }
    if (now - rec.start > windowMs) {
      rec.count = 0
      rec.start = now
    }
    rec.count++
    rateMap.set(ip, rec)
    if (rec.count > maxReqs) {
      return res.status(429).json({ error: 'Too many requests. Slow down.' })
    }
    next()
  }
}
