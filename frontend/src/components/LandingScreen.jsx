import { useState } from 'react'

export default function LandingScreen({ onSandboxCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/start', { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      onSandboxCreated(data)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Animated grid background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.12)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(16,185,129,0.08)' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full px-6">
        {/* Logo / Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent-hover)' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
          Cloud Sandbox IDE
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-6xl font-bold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            Build with AI
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Spin up an isolated sandbox, chat with AI to generate code,<br />
            and preview your app — all in the browser.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {['AI Code Generation', 'Live Preview', 'Integrated Terminal', 'File Explorer'].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {f}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button
          id="start-sandbox-btn"
          onClick={handleStart}
          disabled={loading}
          className="group relative px-10 py-4 rounded-xl text-base font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: loading ? 'var(--accent)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: '#fff',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}
        >
          <span className="flex items-center gap-3">
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Launching Sandbox...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Launch Sandbox
              </>
            )}
          </span>
        </button>

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
}
