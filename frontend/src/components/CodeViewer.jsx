import { useState, useEffect, useCallback } from 'react'

export default function CodeViewer({ sandboxId, selectedFile }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFile = useCallback(async () => {
    if (!sandboxId || !selectedFile) return
    setLoading(true)
    setError(null)
    setContent(null)
    try {
      const res = await fetch(
        `/sandbox-agent/${sandboxId}/read-files?files=${encodeURIComponent(selectedFile)}`
      )
      const data = await res.json()
      if (data.status === 'success' && data.files?.length > 0) {
        const fileObj = data.files[0]
        const key = Object.keys(fileObj)[0]
        setContent(fileObj[key])
      } else {
        throw new Error('Failed to read file')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sandboxId, selectedFile])

  useEffect(() => { fetchFile() }, [fetchFile])

  const getLanguage = (path) => {
    const ext = path?.split('.').pop()?.toLowerCase()
    const map = { jsx: 'jsx', tsx: 'tsx', js: 'javascript', ts: 'typescript', css: 'css', html: 'html', json: 'json', md: 'markdown' }
    return map[ext] || 'text'
  }

  const lines = content ? content.split('\n') : []

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d0f14' }}>
      {!selectedFile && (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a file to view its contents</p>
        </div>
      )}

      {selectedFile && loading && (
        <div className="flex items-center justify-center h-full gap-2" style={{ color: 'var(--text-muted)' }}>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Loading file...</span>
        </div>
      )}

      {error && (
        <div className="p-4 text-sm" style={{ color: '#fca5a5' }}>⚠️ {error}</div>
      )}

      {content !== null && (
        <div className="flex-1 overflow-auto font-mono text-xs leading-6"
          style={{ color: '#abb2bf' }}>
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="group"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="pl-4 pr-3 text-right select-none w-12"
                    style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                    {i + 1}
                  </td>
                  <td className="pl-4 pr-4 whitespace-pre" style={{ color: '#e2e8f0' }}>
                    {line}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
