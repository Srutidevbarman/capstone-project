import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { io } from 'socket.io-client'

export default function TerminalPanel({ sandboxId }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!sandboxId || !containerRef.current) return

    // Initialize XTerm
    const term = new Terminal({
      theme: {
        background: '#0d0f14',
        foreground: '#e2e8f0',
        cursor: '#6366f1',
        cursorAccent: '#0d0f14',
        black: '#1a1d27',
        brightBlack: '#2a2d3e',
        red: '#ef4444',
        brightRed: '#f87171',
        green: '#10b981',
        brightGreen: '#34d399',
        yellow: '#f59e0b',
        brightYellow: '#fbbf24',
        blue: '#6366f1',
        brightBlue: '#818cf8',
        magenta: '#a855f7',
        brightMagenta: '#c084fc',
        cyan: '#06b6d4',
        brightCyan: '#22d3ee',
        white: '#e2e8f0',
        brightWhite: '#f8fafc',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowProposedApi: true,
    })

    const fit = new FitAddon()
    const webLinks = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(webLinks)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    term.writeln('\x1b[1;34m  Cloud Sandbox Terminal\x1b[0m')
    term.writeln('\x1b[90m  Connecting to sandbox...\x1b[0m')
    term.writeln('')

    // Socket.io via Vite proxy — avoids direct cross-origin WebSocket
    // Vite proxies /sandbox-ws/{id}/socket.io → {id}.agent.localhost
    const socket = io(window.location.origin, {
      path: `/sandbox-ws/${sandboxId}/socket.io`,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      term.writeln('\x1b[1;32m  ✓ Connected to sandbox\x1b[0m')
      term.writeln('')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      term.writeln('\r\n\x1b[1;31m  ✗ Disconnected from sandbox\x1b[0m')
    })

    socket.on('connect_error', (err) => {
      term.writeln(`\r\n\x1b[1;31m  ✗ Connection error: ${err.message}\x1b[0m`)
    })

    socket.on('terminal-output', (data) => {
      if (typeof data === 'string') term.write(data)
      else if (data?.output) term.write(data.output)
    })

    // Keyboard input
    term.onData((data) => {
      socket.emit('terminal-input', data)
    })

    // Resize handler
    const observer = new ResizeObserver(() => {
      try { fit.fit() } catch {}
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      socket.disconnect()
      term.dispose()
      termRef.current = null
      socketRef.current = null
    }
  }, [sandboxId])

  return (
    <div className="flex flex-col w-full h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Terminal
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      {/* XTerm container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
