import { useState } from 'react'
import LandingScreen from './components/LandingScreen'
import SandboxIDE from './components/SandboxIDE'
import './index.css'

export default function App() {
  const [sandbox, setSandbox] = useState(null)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {!sandbox
        ? <LandingScreen onSandboxCreated={setSandbox} />
        : <SandboxIDE sandbox={sandbox} />
      }
    </div>
  )
}
