import { useCallback, useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/nav.js'
import {
  getSessionByCode,
  listQuestions,
  listVotes,
  updateSession,
} from '../wixData.js'
import { parseOptions, tallyVotes } from '../lib/poll.js'

const POLL_MS = 1500

export default function Presenter({ code }) {
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [votes, setVotes] = useState([])
  const [error, setError] = useState('')

  const active = useMemo(() => {
    if (!session || !questions.length) return null
    if (session.activeQuestionId) {
      return questions.find((q) => q.id === session.activeQuestionId) || questions[session.activeIndex || 0]
    }
    return questions[session.activeIndex || 0] || null
  }, [session, questions])

  const options = useMemo(() => (active ? parseOptions(active.options) : []), [active])
  const tallies = useMemo(() => tallyVotes(options, votes), [options, votes])

  const refresh = useCallback(async () => {
    try {
      const s = await getSessionByCode(code)
      if (!s) {
        setError('Session not found')
        return
      }
      setSession(s)
      const qs = await listQuestions(s.id)
      setQuestions(qs)
      const current =
        qs.find((q) => q.id === s.activeQuestionId) || qs[s.activeIndex || 0] || null
      if (current) {
        const v = await listVotes(s.id, current.id)
        setVotes(v)
      } else {
        setVotes([])
      }
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to refresh')
    }
  }, [code])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  async function go(delta) {
    if (!session || !questions.length) return
    const currentIndex = Math.max(
      0,
      questions.findIndex((q) => q.id === (session.activeQuestionId || questions[0]?.id)),
    )
    const nextIndex = Math.min(questions.length - 1, Math.max(0, currentIndex + delta))
    const next = questions[nextIndex]
    const updated = await updateSession({
      ...session,
      activeIndex: nextIndex,
      activeQuestionId: next.id,
      status: session.status === 'draft' ? 'live' : session.status,
    })
    setSession(updated)
    const v = await listVotes(session.id, next.id)
    setVotes(v)
  }

  if (!session) {
    return (
      <div className="presenter">
        <p className="meta">{error || 'Loading…'}</p>
      </div>
    )
  }

  return (
    <div className="presenter">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="brand">
            Live <span>Poll</span>
          </div>
          <div className="meta">
            {session.title} · code <strong style={{ color: 'var(--text)' }}>{session.code}</strong>
          </div>
        </div>
        <div className="row">
          <span className={`badge ${session.status}`}>{session.status}</span>
          <span className="badge">{votes.length} responses</span>
          <button className="btn secondary" type="button" onClick={() => navigate(`/session/${session.id}`)}>
            Editor
          </button>
        </div>
      </header>

      <main className="stack" style={{ alignContent: 'center' }}>
        {!active && <p className="meta">Add questions and go live from the editor.</p>}
        {active && (
          <>
            <div className="meta">
              Question {(session.activeIndex || 0) + 1} of {questions.length}
            </div>
            <h1>{active.prompt}</h1>
            <div className="bars">
              {tallies.map((row) => (
                <div className="bar-row" key={row.label}>
                  <div className="bar-label">
                    <span>{row.label}</span>
                    <span>
                      {row.pct}% · {row.count}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </main>

      <footer className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn secondary" type="button" onClick={() => go(-1)} disabled={!active}>
          ← Previous
        </button>
        <button className="btn" type="button" onClick={() => go(1)} disabled={!active}>
          Next →
        </button>
      </footer>
    </div>
  )
}
