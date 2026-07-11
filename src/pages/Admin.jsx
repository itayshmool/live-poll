import { useEffect, useState } from 'react'
import { navigate } from '../lib/nav.js'
import { createSession, isConfigured, listSessions } from '../wixData.js'
import { makeJoinCode, STATUS } from '../lib/poll.js'

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
    <div className="app-shell stack">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div className="brand">
          Live <span>Poll</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Host sessions · share a join link · present live
        </p>
      </header>

      {!isConfigured() && (
        <div className="card error">
          Wix client ID not configured yet.
        </div>
      )}

      <section className="card stack">
        <h2 style={{ margin: 0, fontFamily: 'var(--display)' }}>New session</h2>
        <form className="row" onSubmit={onCreate}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="title">Session title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HUNTER Human Premium Zone"
              required
            />
          </div>
          <button className="btn" type="submit" disabled={creating} style={{ alignSelf: 'end' }}>
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontFamily: 'var(--display)' }}>Your sessions</h2>
        {loading && <p className="muted">Loading…</p>}
        {!loading && sessions.length === 0 && (
          <p className="empty">No sessions yet. Create one above.</p>
        )}
        <div>
          {sessions.map((s) => (
            <div className="list-item" key={s.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div className="muted" style={{ fontSize: '0.9rem' }}>
                  Code <strong>{s.code}</strong>
                </div>
              </div>
              <div className="row">
                <span className={`badge ${s.status || STATUS.draft}`}>{s.status || 'draft'}</span>
                <button className="btn secondary" type="button" onClick={() => navigate(`/session/${s.id}`)}>
                  Edit
                </button>
                <button className="btn ghost" type="button" onClick={() => navigate(`/present/${s.code}`)}>
                  Present
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
