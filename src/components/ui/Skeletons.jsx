// Reusable skeleton loading components

function Pulse({ style }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: 8,
      animation: 'shimmer 1.5s ease-in-out infinite',
      backgroundImage: 'linear-gradient(90deg, var(--surface2) 0%, var(--surface) 50%, var(--surface2) 100%)',
      backgroundSize: '200% 100%',
      ...style,
    }} />
  )
}

export function CardSkeleton({ height = 80 }) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 18 }}>
      <Pulse style={{ height, borderRadius: 8 }} />
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Pulse style={{ width: 36, height: 36, borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <Pulse style={{ height: 20, width: '60%', marginBottom: 6 }} />
              <Pulse style={{ height: 12, width: '80%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SessionListSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Pulse style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Pulse style={{ height: 14, width: '40%', marginBottom: 8 }} />
              <Pulse style={{ height: 11, width: '60%' }} />
            </div>
            <Pulse style={{ width: 48, height: 24, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function QuestionSkeleton() {
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Pulse style={{ width: 60, height: 20, borderRadius: 999 }} />
        <Pulse style={{ width: 50, height: 20, borderRadius: 999 }} />
      </div>
      <Pulse style={{ height: 16, width: '100%', marginBottom: 8 }} />
      <Pulse style={{ height: 16, width: '90%', marginBottom: 8 }} />
      <Pulse style={{ height: 16, width: '70%' }} />
    </div>
  )
}
