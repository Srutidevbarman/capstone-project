import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      // Main API → Kubernetes ingress (port 80)
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },

      // Dynamic agent REST proxy: /sandbox-agent/{sandboxId}/path
      // → Host: {sandboxId}.agent.localhost → K8s ingress routes to agent pod
      '/sandbox-agent': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const match = path.match(/^\/sandbox-agent\/[^/?]+(\/.*)?$/)
          return match ? (match[1] || '/') : '/'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const match = req.url?.match(/^\/sandbox-agent\/([^/?]+)/)
            if (match) proxyReq.setHeader('Host', `${match[1]}.agent.localhost`)
          })
          proxy.on('error', (err, _req, res) => {
            console.warn('[agent-proxy] error:', err.message)
            if (!res.headersSent) {
              res.writeHead(502)
              res.end(JSON.stringify({ status: 'error', message: 'Sandbox agent not ready' }))
            }
          })
        },
      },

      // Dynamic WebSocket proxy for Socket.io terminal: /sandbox-ws/{sandboxId}/socket.io/...
      // → Host: {sandboxId}.agent.localhost → K8s ingress routes WS upgrade to agent pod
      '/sandbox-ws': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => {
          const match = path.match(/^\/sandbox-ws\/[^/?]+(\/.*)?$/)
          return match ? (match[1] || '/') : '/'
        },
        configure: (proxy) => {
          // Handle WebSocket upgrade handshake
          proxy.on('proxyReqWs', (proxyReq, req) => {
            const match = req.url?.match(/^\/sandbox-ws\/([^/?]+)/)
            if (match) proxyReq.setHeader('Host', `${match[1]}.agent.localhost`)
          })
          // Handle Socket.io HTTP polling fallback
          proxy.on('proxyReq', (proxyReq, req) => {
            const match = req.url?.match(/^\/sandbox-ws\/([^/?]+)/)
            if (match) proxyReq.setHeader('Host', `${match[1]}.agent.localhost`)
          })
          proxy.on('error', (err) => {
            console.warn('[ws-proxy] error:', err.message)
          })
        },
      },
    },
  },
})
