import { useEffect, useState, useCallback, useRef } from 'react'

const FILE_ICONS = {
  jsx: '⚛',
  tsx: '⚛',
  js: '📜',
  ts: '📘',
  css: '🎨',
  html: '🌐',
  json: '{}',
  md: '📝',
  svg: '🖼',
  png: '🖼',
  jpg: '🖼',
  lock: '🔒',
  default: '📄',
}

function getIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || FILE_ICONS.default
}

function buildTree(files) {
  const tree = {}
  files.forEach(path => {
    const parts = path.split('/')
    let node = tree
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (!node._files) node._files = []
        node._files.push(part)
      } else {
        if (!node[part]) node[part] = {}
        node = node[part]
      }
    })
  })
  return tree
}

function TreeNode({ name, node, depth = 0, onSelect, selectedFile, parentPath = '' }) {
  const [open, setOpen] = useState(depth < 2)
  const currentPath = parentPath ? `${parentPath}/${name}` : name
  const isDir = typeof node === 'object' && !Array.isArray(node) && node !== null

  const dirs = Object.entries(node).filter(([k]) => k !== '_files')
  const files = node._files || []

  return (
    <div>
      {/* Folder row */}
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer select-none text-sm transition-colors"
        style={{
          paddingLeft: `${8 + depth * 14}px`,
          color: 'var(--text-secondary)',
        }}
        onClick={() => setOpen(!open)}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="text-xs" style={{ color: 'var(--accent)' }}>
          {open ? '▾' : '▸'}
        </span>
        <span className="text-xs">📁</span>
        <span className="truncate text-xs font-medium">{name}</span>
      </div>

      {open && (
        <div>
          {dirs.map(([dirName, dirNode]) => (
            <TreeNode
              key={dirName}
              name={dirName}
              node={dirNode}
              depth={depth + 1}
              onSelect={onSelect}
              selectedFile={selectedFile}
              parentPath={currentPath}
            />
          ))}
          {files.map(file => {
            const filePath = `${currentPath}/${file}`
            const isSelected = selectedFile === filePath
            return (
              <div
                key={file}
                className="flex items-center gap-1.5 rounded cursor-pointer select-none transition-colors text-xs py-0.5"
                style={{
                  paddingLeft: `${8 + (depth + 1) * 14}px`,
                  background: isSelected ? 'var(--accent-dim)' : 'transparent',
                  color: isSelected ? 'var(--accent-hover)' : 'var(--text-secondary)',
                  borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onClick={() => onSelect(filePath)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{getIcon(file)}</span>
                <span className="truncate">{file}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FileExplorer({ sandboxId, onFileSelect, selectedFile }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const retryTimerRef = useRef(null)

  const fetchFiles = useCallback(async (isAutoRetry = false) => {
    if (!sandboxId) return
    if (!isAutoRetry) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/sandbox-agent/${sandboxId}/list-files`)
      // Guard: response might be HTML error page if sandbox isn't ready yet
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('sandbox_not_ready')
      }
      if (data.status === 'success') {
        setFiles(data.files)
        setRetryCount(0)
        setLoading(false)
      } else {
        throw new Error('Failed to list files')
      }
    } catch (err) {
      if (err.message === 'sandbox_not_ready') {
        // Sandbox pod still warming up — auto-retry up to 20 times (~60s)
        setRetryCount(prev => {
          const next = prev + 1
          if (next < 20) {
            retryTimerRef.current = setTimeout(() => fetchFiles(true), 3000)
          } else {
            setError('Sandbox took too long to start. Click ↺ to retry.')
            setLoading(false)
          }
          return next
        })
      } else {
        setError(err.message)
        setLoading(false)
      }
    }
  }, [sandboxId])

  useEffect(() => {
    fetchFiles()
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current) }
  }, [fetchFiles])

  const tree = buildTree(files)
  const topDirs = Object.entries(tree).filter(([k]) => k !== '_files')
  const topFiles = tree._files || []

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Explorer
        </span>
        <button
          onClick={fetchFiles}
          className="p-1 rounded transition-colors text-xs"
          style={{ color: 'var(--text-muted)' }}
          title="Refresh"
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          ↺
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && (
          <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="animate-spin w-4 h-4 border border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
            {retryCount > 0 ? (
              <>
                <p style={{ color: 'var(--accent-hover)' }}>Sandbox warming up...</p>
                <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Retry {retryCount}/20</p>
              </>
            ) : 'Loading files...'}
          </div>
        )}
        {error && (
          <div className="px-4 py-4 text-xs" style={{ color: '#fca5a5' }}>⚠️ {error}</div>
        )}
        {!loading && !error && (
          <>
            {topDirs.map(([name, node]) => (
              <TreeNode
                key={name}
                name={name}
                node={node}
                depth={0}
                onSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
            {topFiles.map(file => {
              const isSelected = selectedFile === file
              return (
                <div
                  key={file}
                  className="flex items-center gap-1.5 rounded cursor-pointer transition-colors text-xs py-0.5 px-2"
                  style={{
                    background: isSelected ? 'var(--accent-dim)' : 'transparent',
                    color: isSelected ? 'var(--accent-hover)' : 'var(--text-secondary)',
                    borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                  onClick={() => onFileSelect(file)}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span>{getIcon(file)}</span>
                  <span className="truncate">{file}</span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
