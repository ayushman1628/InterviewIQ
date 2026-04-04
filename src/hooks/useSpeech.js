import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: 56, margin: '0 0 16px' }}>⚠️</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 10px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            An unexpected error occurred. Your session data is safe.
          </p>
          {this.state.error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent3)', margin: 0, wordBreak: 'break-all' }}>
                {this.state.error.message}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              Try again
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard' }}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}