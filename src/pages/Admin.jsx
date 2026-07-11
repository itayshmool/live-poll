import { useEffect, useState } from 'react'
import { navigate } from '../lib/nav.js'
import { createSession, deleteSessionWithData, isConfigured, listSessions, logout } from '../wixData.js'
import { makeJoinCode, STATUS } from '../lib/poll.js'
import Logo from '../components/Logo.jsx'

export default function Admin() {
  const [sessions, setSessions] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setError('')
    try {
      const rows = await listSessions()
      setSessions(rows)
    } catch (err) {
      setError(err?.message || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onDelete(session) {
    if (!confirm(`Delete "${session.title}" and all its data? This cannot be undone.`)) return
    setError('')
    try {
      await deleteSessionWithData(session.id)
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not delete session')
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError('')
    try {
      const session = await createSession({
        title: title.trim(),
        code: makeJoinCode(),
      })
      setTitle('')
      navigate(`/session/${session.id}`)
    } catch (err) {
      setError(err?.message || 'Could not create session')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="top-bar">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-text">Live Poll</div>
            <div className="brand-sub">Real-time audience polling</div>
          </div>
        </div>
        <div className="row">
          <button className="btn secondary" type="button" onClick={logout}>Sign out</button>
          <div className="avatar">HP</div>
        </div>
      </div>

      <div className="app-shell stack" style={{ gap: '28px' }}>
        {!isConfigured() && (
          <div className="card error">Wix client ID not configured yet.</div>
        )}

        <div className="card">
          <div className="card-header">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
            <span className="card-title">New session</span>
          </div>
          <form style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }} onSubmit={onCreate}>
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor="title">Session title</label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 All-Hands 2026"
                required
              />
            </div>
            <button className="btn" type="submit" disabled={creating}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
              {creating ? 'Creating…' : 'Create session'}
            </button>
          </form>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        </div>

        <div>
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 style={{ font: '800 22px/1 var(--font)', letterSpacing: '-0.02em', margin: 0 }}>Your sessions</h2>
            {!loading && <span className="count-badge">{sessions.length}</span>}
          </div>

          {loading && <p className="muted">Loading…</p>}

          {!loading && sessions.length === 0 && (
            <div className="card empty">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
              </div>
              <h3>No sessions yet</h3>
              <p>Create your first poll session above. Give it a title, add questions, and share the join code with your audience.</p>
            </div>
          )}

          <div className="stack" style={{ gap: 12 }}>
            {sessions.map((s) => (
              <div className={`session-card ${s.status === 'ended' ? 'ended' : ''}`} key={s.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ marginBottom: 8 }}>
                    <span className="session-title">{s.title}</span>
                    <span className={`badge ${s.status || STATUS.draft}`}>
                      {s.status === 'live' && <span className="pulse-dot" />}
                      {s.status || 'draft'}
                    </span>
                  </div>
                  <div className="session-meta">
                    {s.status === 'live' ? 'In progress' : s.status === 'ended' ? 'Session ended' : 'Not started'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                  <span className="join-code-label">Join code</span>
                  <span className="join-code-value">{s.code}</span>
                </div>
                <div className="row">
                  <button className="btn secondary" type="button" onClick={() => navigate(`/session/${s.id}`)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7" /><path d="m14.5 3.5 6 6L11 19l-4 1 1-4z" /></svg>
                    Edit
                  </button>
                  <button className="btn" type="button" onClick={() => navigate(`/present/${s.code}`)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" /></svg>
                    Present
                  </button>
                  <button className="btn-icon danger" type="button" onClick={() => onDelete(s)} title="Delete session">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
