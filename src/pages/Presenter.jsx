import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../lib/nav.js'
import {
  getSessionByCode,
  listQuestions,
  listVotes,
  updateSession,
} from '../wixData.js'
import { parseOptions, tallyVotes } from '../lib/poll.js'
import Logo from '../components/Logo.jsx'

const POLL_MS = 1500

export default function Presenter({ code }) {
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [votes, setVotes] = useState([])
  const [error, setError] = useState('')

  const activeIndex = useMemo(() => {
    if (!session || !questions.length) return -1
    if (session.activeQuestionId) {
      const idx = questions.findIndex((q) => q.id === session.activeQuestionId)
      return idx >= 0 ? idx : (session.activeIndex || 0)
    }
    return session.activeIndex || 0
  }, [session, questions])

  const active = activeIndex >= 0 ? questions[activeIndex] : null
  const options = useMemo(() => (active ? parseOptions(active.options) : []), [active])
  const tallies = useMemo(() => tallyVotes(options, votes), [options, votes])
  const maxPct = useMemo(() => Math.max(...tallies.map((t) => t.pct), 0), [tallies])

  const lastActiveRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const s = await getSessionByCode(code)
      if (!s) { setError('Session not found'); return }
      setSession(s)

      const activeId = s.activeQuestionId || ''
      if (activeId !== lastActiveRef.current) {
        lastActiveRef.current = activeId
        const qs = await listQuestions(s.id)
        setQuestions(qs)
      }

      if (s.activeQuestionId) {
        const v = await listVotes(s.id, s.activeQuestionId)
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

  const isLastQuestion = activeIndex >= 0 && activeIndex === questions.length - 1

  async function go(delta) {
    if (!session || !questions.length) return
    const currentIdx = Math.max(0, questions.findIndex((q) => q.id === (session.activeQuestionId || questions[0]?.id)))
    const nextIndex = Math.min(questions.length - 1, Math.max(0, currentIdx + delta))
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

  async function done() {
    if (!session) return
    await updateSession({ ...session, status: 'ended', activeQuestionId: '' })
    navigate(`/results/${code}`)
  }

  if (!session) {
    return (
      <div className="presenter" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="meta" style={{ color: 'var(--muted)' }}>{error || 'Loading…'}</p>
      </div>
    )
  }

  return (
    <div className="presenter">
      <div className="presenter-bar">
        <div className="row" style={{ gap: 14 }}>
          <Logo />
          <span style={{ font: '800 20px/1 var(--font)', color: 'var(--text)', letterSpacing: '-0.02em' }}>Live Poll</span>
          <span className="separator" />
          <span style={{ font: '600 17px/1 var(--font)', color: 'rgba(255,255,255,.7)' }}>{session.title}</span>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ font: '600 9px/1 var(--mono)', color: 'var(--muted-dim)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Join at poll-it.live
            </span>
            <span style={{ font: '700 22px/1 var(--mono)', color: 'var(--accent)', letterSpacing: '0.16em' }}>{session.code}</span>
          </div>
          <span className="separator" style={{ height: 34 }} />
          <span className={`badge ${session.status}`}>
            {session.status === 'live' && <span className="pulse-dot" />}
            {session.status}
          </span>
          <span className="badge" style={{ background: 'rgba(255,255,255,.06)', font: '700 14px/1 var(--mono)', color: 'var(--text)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></svg>
            {votes.length}
          </span>
          <button className="btn secondary" type="button" onClick={() => navigate(`/session/${session.id}`)} style={{ height: 40, padding: '0 15px', fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7" /><path d="m14.5 3.5 6 6L11 19l-4 1 1-4z" /></svg>
            Editor
          </button>
        </div>
      </div>

      <main>
        {!active && <p className="meta" style={{ color: 'var(--muted)' }}>Add questions and go live from the editor.</p>}
        {active && (
          <>
            <div className="row" style={{ marginBottom: 22 }}>
              <span className="meta">Question {activeIndex + 1} of {questions.length}</span>
              <div className="progress-dots">
                {questions.map((_, i) => (
                  <span key={i} className={`progress-dot ${i <= activeIndex ? 'active' : ''}`} />
                ))}
              </div>
            </div>
            <h1>{active.prompt}</h1>
            <div className="bars">
              {tallies.map((row) => (
                <div className="bar-row" key={row.label}>
                  <div className="bar-label">
                    <span className="label-text">{row.label}</span>
                    <span className="label-stats">
                      <span className={`pct ${row.pct === maxPct && maxPct > 0 ? 'leading' : ''}`}>{row.pct}%</span>
                      <span className="count">{row.count}</span>
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${row.pct === maxPct && maxPct > 0 ? 'leading' : 'secondary'}`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </main>

      <div className="presenter-footer">
        <button className="btn secondary" type="button" onClick={() => go(-1)} disabled={!active}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
          Previous
        </button>
        <span className="status-text">{votes.length} responses · updating live</span>
        {isLastQuestion ? (
          <button className="btn" type="button" onClick={done}>
            Done
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>
          </button>
        ) : (
          <button className="btn" type="button" onClick={() => go(1)} disabled={!active}>
            Next
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
