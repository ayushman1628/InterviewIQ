import { clsx } from 'clsx'

// ── Button ──────────────────────────────────────────────────────
const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, fontWeight: 600, borderRadius: 12, border: 'none',
  cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
  fontFamily: 'var(--font-body)', letterSpacing: '-0.01em',
}
const btnVariants = {
  primary:   { background: 'var(--accent)', color: 'white' },
  secondary: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost:     { background: 'transparent', color: 'var(--muted)' },
  danger:    { background: 'var(--accent3)', color: 'white' },
  success:   { background: 'var(--success)', color: 'var(--bg)' },
}
const btnSizes = {
  sm: { padding: '6px 14px', fontSize: 13 },
  md: { padding: '10px 20px', fontSize: 13 },
  lg: { padding: '12px 24px', fontSize: 14 },
  xl: { padding: '14px 32px', fontSize: 16 },
}

export function Button({ children, variant = 'primary', size = 'md', style, disabled, loading, className, ...props }) {
  return (
    <button
      style={{ ...btnBase, ...btnVariants[variant], ...btnSizes[size], opacity: (disabled || loading) ? 0.45 : 1, ...style }}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading && <Spinner size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  )
}

// ── Card ────────────────────────────────────────────────────────
export function Card({ children, style, hover, glow, className, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16, border: '1px solid var(--border)',
        background: 'var(--surface)', padding: 24,
        boxShadow: glow ? '0 0 30px rgba(124,92,252,0.2)' : 'none',
        cursor: hover ? 'pointer' : 'default',
        transition: hover ? 'border-color 0.15s, background 0.15s' : undefined,
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────
const badgeColors = {
  accent:  { background: 'rgba(124,92,252,0.15)', color: 'var(--accent)',   border: '1px solid rgba(124,92,252,0.3)' },
  success: { background: 'rgba(0,229,160,0.12)',  color: 'var(--success)',  border: '1px solid rgba(0,229,160,0.3)' },
  warning: { background: 'rgba(255,181,71,0.12)', color: 'var(--warning)',  border: '1px solid rgba(255,181,71,0.3)' },
  danger:  { background: 'rgba(255,107,107,0.12)',color: 'var(--accent3)',  border: '1px solid rgba(255,107,107,0.3)' },
  muted:   { background: 'var(--surface2)',        color: 'var(--muted)',   border: '1px solid var(--border)' },
  cyan:    { background: 'rgba(0,212,255,0.12)',   color: 'var(--accent2)', border: '1px solid rgba(0,212,255,0.3)' },
}

export function Badge({ children, color = 'accent', style, className }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
      ...badgeColors[color] || badgeColors.muted,
      ...style,
    }} className={className}>
      {children}
    </span>
  )
}

// ── Input ───────────────────────────────────────────────────────
export function Input({ label, error, style, className, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          width: '100%', background: 'var(--surface2)',
          border: `1px solid ${error ? 'var(--accent3)' : 'var(--border)'}`,
          borderRadius: 12, padding: '11px 16px', color: 'var(--text)', fontSize: 14,
          outline: 'none', transition: 'border-color 0.15s', fontFamily: 'var(--font-body)',
          boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--accent3)' : 'var(--border)'}
        className={className}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--accent3)' }}>{error}</span>}
    </div>
  )
}

// ── Spinner ─────────────────────────────────────────────────────
export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Progress Bar ────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--accent)', style }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ height: 6, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden', ...style }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.5s ease' }} />
    </div>
  )
}

// ── Score Ring ──────────────────────────────────────────────────
export function ScoreRing({ score, size = 80, strokeWidth = 6 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const color = score >= 8 ? 'var(--success)' : score >= 6 ? 'var(--warning)' : 'var(--accent3)'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 10)}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.22} fontWeight="700" fontFamily="Syne, sans-serif"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {score.toFixed(1)}
      </text>
    </svg>
  )
}

// ── Tab Bar ─────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', padding: 4, borderRadius: 12 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{
            flex: 1, padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
            background: active === tab.id ? 'var(--accent)' : 'transparent',
            color: active === tab.id ? 'white' : 'var(--muted)',
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div>
        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 16 }}>{title}</p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{description}</p>
      </div>
      {action}
    </div>
  )
}

// ── Divider ─────────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
    </div>
  )
}

