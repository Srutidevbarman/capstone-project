import { useState, useEffect, useRef } from 'react'

const TABS = ['preview', 'terminal', 'code']

export default function PreviewPanel({ sandboxId, selectedFile, TerminalComponent, CodeComponent }) {
  const [activeTab, setActiveTab] = useState('preview')
  const [previewKey, setPreviewKey] = useState(0)
  const previewUrl = sandboxId ? `http://${sandboxId}.preview.localhost` : null

  const tabIcons = {
    preview: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    terminal: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    code: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 shrink-0"
        style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={{
              background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-hover)' : 'var(--text-muted)',
              border: activeTab === tab ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}

        {/* Preview controls */}
        {activeTab === 'preview' && previewUrl && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPreviewKey(k => k + 1)}
              className="px-2 py-1 rounded text-xs transition-colors"
              title="Refresh preview"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
            >
              ↺
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open
            </a>
          </div>
        )}

        {activeTab === 'code' && selectedFile && (
          <div className="ml-auto text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)', fontFamily: 'monospace' }}>
            {selectedFile}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Preview Tab */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          {previewUrl ? (
            <iframe
              key={previewKey}
              src={previewUrl}
              title="Sandbox Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No preview available</p>
            </div>
          )}
        </div>

        {/* Terminal Tab */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'terminal' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <TerminalComponent />
        </div>

        {/* Code Tab */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <CodeComponent />
        </div>
      </div>
    </div>
  )
}
