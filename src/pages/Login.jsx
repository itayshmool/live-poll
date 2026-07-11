import { useState } from 'react'
import { login } from '../wixData.js'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const [loading, setLoading] = useState(false)

  async function onLogin() {
    setLoading(true)
    try {
      await login()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="join">
      <div className="waiting">
        <div className="icon-circle yellow" style={{ marginBottom: 24 }}>
          <Logo size={36} />
        </div>
        <h1 style={{ fontSize: 30 }}>Live Poll</h1>
        <p style={{ marginBottom: 32 }}>Sign in to create and manage poll sessions.</p>
        <button className="btn" type="button" onClick={onLogin} disabled={loading} style={{ height: 52, padding: '0 32px', fontSize: 16 }}>
          {loading ? 'Redirecting…' : 'Sign in with Wix'}
        </button>
      </div>
    </div>
  )
}
