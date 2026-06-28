import cors from 'cors'

export function createCorsMiddleware(allowedOrigins) {
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
}