import { useStreakStore } from '../../store'

export function StreakTracker({ compact = false }) {
  const { currentStreak, longestStreak, practiceDates } = useStreakStore()

  // Build last 35 days grid
  const today = new Date()
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    const iso = d.toISOString().slice(0, 10)
    return { iso, active: practiceDates.includes(iso), isToday: iso === today.toISOString().slice(0, 10) }
  })

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)' }}>
        <span style={{ fontSize: 18 }}>{currentStreak > 0 ? '🔥' : '💤'}</span>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: currentStreak > 0 ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-display)' }}>
            {currentStreak}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>day streak</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', padding: 20 }}>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: currentStreak > 0 ? 'var(--accent)' : 'var(--muted)', margin: 0, lineHeight: 1 }}>
            {currentStreak > 0 ? '🔥' : '💤'} {currentStreak}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Current streak</p>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--warning)', margin: 0, lineHeight: 1 }}>
            {longestStreak}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Best streak</p>
        </div>
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--success)', margin: 0, lineHeight: 1 }}>
            {practiceDates.length}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>Days practiced</p>
        </div>
      </div>

      {/* Calendar heatmap — last 35 days in 5 rows x 7 cols */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
        Last 5 weeks
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 14px)', gap: 4 }}>
        {days.map(({ iso, active, isToday }) => (
          <div key={iso} title={iso}
            style={{
              width: 14, height: 14, borderRadius: 3,
              background: active
                ? 'var(--accent)'
                : isToday
                  ? 'rgba(124,92,252,0.2)'
                  : 'var(--surface2)',
              border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>5 weeks ago</span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Today</span>
      </div>
    </div>
  )
}