import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  castVote,
  findVote,
  getSessionByCode,
  listQuestions,
} from '../wixData.js'
import { getVoterId, parseOptions } from '../lib/poll.js'

const POLL_MS = 1500

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

  const options = useMemo(() => (active ? parseOptions(active.options) : []), [active])
  const waiting = !active || answeredId === active?.id

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
      <div className="join-card stack">
        <div className="brand">
          Live <span>Poll</span>
        </div>

        {!session && <p className="muted">{error || 'Joining…'}</p>}

        {session && session.status === 'draft' && (
          <div className="waiting">
            <div className="pulse" />
            <h1>Not live yet</h1>
            <p className="muted">{session.title}</p>
            <p className="muted">Hang tight — the host will start soon.</p>
          </div>
        )}

        {session && session.status === 'ended' && (
          <div className="waiting">
            <h1>Session ended</h1>
            <p className="muted">Thanks for playing.</p>
          </div>
        )}

        {session && session.status === 'live' && waiting && (
          <div className="waiting">
            <div className="pulse" />
            <h1>Waiting for next question</h1>
            <p className="muted">Your answer is in. Results are on the big screen.</p>
          </div>
        )}

        {session && session.status === 'live' && active && answeredId !== active.id && (
          <>
            <p className="muted" style={{ margin: 0 }}>
              {session.title}
            </p>
            <h1>{active.prompt}</h1>
            <div className="stack">
              {options.map((opt) => (
                <button
                  key={opt}
                  className="choice"
                  type="button"
                  disabled={submitting}
                  onClick={() => onChoose(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
