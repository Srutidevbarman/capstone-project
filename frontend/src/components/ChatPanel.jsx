import { useState, useRef, useEffect, useCallback } from 'react'

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 px-2 py-1">
        <div className="w-full px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--text-muted)' }}>
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 px-3 py-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isUser
          ? 'text-white'
          : 'text-indigo-300'
      }`}
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #818cf8)'
            : 'var(--bg-hover)',
          border: '1px solid var(--border)',
        }}>
        {isUser ? 'U' : '✦'}
      </div>
      {/* Bubble */}
      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
        isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
      }`}
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
            : 'var(--bg-panel)',
          border: isUser ? 'none' : '1px solid var(--border)',
          color: isUser ? '#fff' : 'var(--text-primary)',
        }}>
        {msg.content}
      </div>
    </div>
  )
}

function ActivityLine({ line }) {
  if (!line) return null
  const isError = line.toLowerCase().includes('error')
  const isSuccess = line.toLowerCase().includes('success') || line.toLowerCase().includes('connected')
  const isUpdating = line.toLowerCase().includes('updating')
  const isListing = line.toLowerCase().includes('listing')

  let icon = '◦'
  let color = 'var(--text-muted)'
  if (isError) { icon = '✗'; color = '#f87171' }
  else if (isSuccess) { icon = '✓'; color = '#34d399' }
  else if (isUpdating) { icon = '↑'; color = '#fbbf24' }
  else if (isListing) { icon = '≡'; color = '#60a5fa' }

  return (
    <div className="flex items-start gap-2 px-3 py-1 text-xs font-mono"
      style={{ color }}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span style={{ color: 'var(--text-muted)' }}>{line}</span>
    </div>
  )
}

export default function ChatPanel({ sandboxId }) {
  const [messages, setMessages] = useState([
    { role: 'system', content: '🤖 AI assistant ready. Describe what you want to build!' }
  ])
  const [activity, setActivity] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activity])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !sandboxId) return

    setInput('')
    setLoading(true)
    setActivity([])
    setMessages(prev => [...prev, { role: 'user', content: text }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, projectId: sandboxId }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const activityLines = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          activityLines.push(trimmed)
          setActivity([...activityLines])
        }
      }

      if (buffer.trim()) {
        activityLines.push(buffer.trim())
        setActivity([...activityLines])
      }

      const lastMeaningful = activityLines.filter(l => l && l !== '(empty)').slice(-3).join(' | ')
      if (lastMeaningful) {
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ Done! ${lastMeaningful}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '✅ Task completed successfully!' }])
      }

    } catch (err) {
      if (err.name === 'AbortError') return
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, sandboxId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Assistant</span>
        {loading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent-hover)' }}>
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {/* Live activity stream */}
        {loading && activity.length > 0 && (
          <div className="mx-3 mt-1 mb-2 rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              Live Activity
            </div>
            <div className="max-h-32 overflow-y-auto py-1">
              {activity.map((line, i) => <ActivityLine key={i} line={line} />)}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--accent-hover)' }}>✦</div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--accent)',
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-end gap-2 rounded-xl p-2"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <textarea
            ref={textareaRef}
            id="ai-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build... (Enter to send)"
            rows={2}
            disabled={loading}
            className="flex-1 bg-transparent resize-none text-sm outline-none disabled:opacity-50"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.5',
              maxHeight: '120px',
            }}
          />
          <button
            id="ai-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-hover)',
              color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
          Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
