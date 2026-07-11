import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  castVote,
  findVote,
  getSessionByCode,
  listQuestions,
} from '../wixData.js'
import { getVoterId, parseOptions } from '../lib/poll.js'
import Logo from '../components/Logo.jsx'

const POLL_MS = 1500
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function Join({ code }) {
  const voterId = useMemo(() => getVoterId(), [])
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answeredId, setAnsweredId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const active = useMemo(() => {
    if (!session || !questions.length) return null
    if (session.status !== 'live') return null
    if (session.activeQuestionId) {
      return questions.find((q) => q.id === session.activeQuestionId) || null
    }
    return questions[session.activeIndex || 0] || null
  }, [session, questions])

  const activeIndex = useMemo(() => {
    if (!active || !questions.length) return -1
    return questions.findIndex((q) => q.id === active.id)
  }, [active, questions])

  const options = useMemo(() => (active ? parseOptions(active.options) : []), [active])
  const waiting = !active || answeredId === active?.id

  const refresh = useCallback(async () => {
    try {
      const s = await getSessionByCode(code)
      if (!s) { setError('Session not found'); return }
      setSession(s)
      const qs = await listQuestions(s.id)
      setQuestions(qs)
      const current = qs.find((q) => q.id === s.activeQuestionId) || qs[s.activeIndex || 0] || null
      if (current && s.status === 'live') {
        const existing = await findVote(s.id, current.id, voterId)
        setAnsweredId((prev) => {
          if (existing) return current.id
          if (prev === current.id) return prev
          return ''
        })
      }
      setError('')
    } catch (err) {
      setError(err?.message || 'Connection issue')
    }
  }, [code, voterId])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, POLL_MS)
    return () => clearInterval(t)
  }, [refresh])

  useEffect(() => {
    if (active && answeredId && answeredId !== active.id) {
      setAnsweredId('')
    }
  }, [active, answeredId])

  async function onChoose(choice) {
    if (!session || !active || submitting || answeredId === active.id) return
    setSubmitting(true)
    setError('')
    try {
      await castVote({
        sessionId: session.id,
        questionId: active.id,
        choice,
        voterId,
      })
      setAnsweredId(active.id)
    } catch (err) {
      setError(err?.message || 'Could not submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="join">
      <div className="join-inner">
        <div className="join-brand">
          <Logo size={22} />
          <span style={{ font: '800 16px/1 var(--font)', color: 'var(--text)', letterSpacing: '-0.01em' }}>Live Poll</span>
          {session && (
            <span className="session-label">{session.title}</span>
          )}
        </div>

        {!session && <p className="muted">{error || 'Joining…'}</p>}

        {session && session.status === 'draft' && (
          <div className="waiting">
            <div className="icon-circle yellow">
              <span className="pulse" />
            </div>
            <div className="status-label" style={{ color: 'var(--muted-dim)' }}>You're in · {session.code}</div>
            <h1>{session.title}</h1>
            <p>Hang tight — the host hasn't started the poll yet. Your first question will appear here automatically.</p>
          </div>
        )}

        {session && session.status === 'ended' && (
          <div className="waiting">
            <div className="icon-circle neutral">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></svg>
            </div>
            <div className="status-label" style={{ color: 'var(--muted-dim)' }}>Session closed</div>
            <h1>Thanks for playing</h1>
            <p>This session has ended. See you at the next one.</p>
          </div>
        )}

        {session && session.status === 'live' && waiting && (
          <div className="waiting">
            <div className="icon-circle green">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div className="status-label" style={{ color: 'var(--live)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'lpPulseY 1.8s ease-out infinite' }} />
              Answer locked in
            </div>
            <h1>Your answer is in</h1>
            <p>Waiting for the host to move to the next question.</p>
          </div>
        )}

        {session && session.status === 'live' && active && answeredId !== active.id && (
          <>
            <div style={{ font: '700 11px/1 var(--mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>
              Question {activeIndex + 1} of {questions.length}
            </div>
            <h2 style={{ font: '800 27px/1.2 var(--font)', color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 24px' }}>
              {active.prompt}
            </h2>
            <div className="stack" style={{ gap: 12 }}>
              {options.map((opt, i) => (
                <button
                  key={opt}
                  className="choice"
                  type="button"
                  disabled={submitting}
                  onClick={() => onChoose(opt)}
                >
                  <span className="choice-letter">{LETTERS[i] || i + 1}</span>
                  {opt}
                </button>
              ))}
            </div>
            <div className="join-footer">Tap an option to lock in your vote</div>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
