import { useState, useCallback } from 'react'
import FileExplorer from './FileExplorer'
import ChatPanel from './ChatPanel'
import PreviewPanel from './PreviewPanel'
import TerminalPanel from './TerminalPanel'
import CodeViewer from './CodeViewer'

const MIN_SIDEBAR = 180
const MAX_SIDEBAR = 400

export default function SandboxIDE({ sandbox }) {
  const { sandboxId, previewUrl } = sandbox
  const [selectedFile, setSelectedFile] = useState(null)
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [chatWidth, setChatWidth] = useState(320)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)

  // Left resizer (file explorer)
  const handleLeftDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDraggingLeft(true)
    const startX = e.clientX
    const startW = sidebarWidth
    const onMove = (e) => setSidebarWidth(Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, startW + e.clientX - startX)))
    const onUp = () => { setIsDraggingLeft(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  // Right resizer (chat)
  const handleRightDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDraggingRight(true)
    const startX = e.clientX
    const startW = chatWidth
    const onMove = (e) => setChatWidth(Math.max(260, Math.min(500, startW - (e.clientX - startX))))
    const onUp = () => { setIsDraggingRight(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [chatWidth])

  const termComponent = () => <TerminalPanel sandboxId={sandboxId} />
  const codeComponent = () => <CodeViewer sandboxId={sandboxId} selectedFile={selectedFile} />

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 shrink-0 h-11"
        style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>✦</div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sandbox</span>
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* Sandbox ID badge */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
          <span className="text-xs font-mono truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
            {sandboxId}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: 'var(--accent-hover)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Preview
          </a>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ cursor: isDraggingLeft || isDraggingRight ? 'col-resize' : 'default' }}>
        {/* File Explorer */}
        <div className="shrink-0 overflow-hidden flex flex-col" style={{ width: sidebarWidth, borderRight: '1px solid var(--border)' }}>
          <FileExplorer
            sandboxId={sandboxId}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />
        </div>

        {/* Left drag handle */}
        <div
          onMouseDown={handleLeftDragStart}
          className="w-1 shrink-0 cursor-col-resize transition-colors group relative z-10"
          style={{ background: isDraggingLeft ? 'var(--accent)' : 'var(--border)' }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Preview / Terminal / Code */}
        <div className="flex-1 overflow-hidden min-w-0">
          <PreviewPanel
            sandboxId={sandboxId}
            selectedFile={selectedFile}
            TerminalComponent={termComponent}
            CodeComponent={codeComponent}
          />
        </div>

        {/* Right drag handle */}
        <div
          onMouseDown={handleRightDragStart}
          className="w-1 shrink-0 cursor-col-resize transition-colors"
          style={{ background: isDraggingRight ? 'var(--accent)' : 'var(--border)' }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Chat Panel */}
        <div className="shrink-0 overflow-hidden flex flex-col" style={{ width: chatWidth, borderLeft: '1px solid var(--border)' }}>
          <ChatPanel sandboxId={sandboxId} />
        </div>
      </div>
    </div>
  )
}
