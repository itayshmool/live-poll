import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getSessionByCode,
  listQuestions,
  listVotes,
} from '../wixData.js'
import { parseOptions, tallyVotes } from '../lib/poll.js'
import Logo from '../components/Logo.jsx'

export default function Results({ code }) {
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [allVotes, setAllVotes] = useState({})
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const s = await getSessionByCode(code)
      if (!s) { setError('Session not found'); return }
      setSession(s)
      const qs = await listQuestions(s.id)
      setQuestions(qs)
      const votesMap = {}
      await Promise.all(qs.map(async (q) => {
        votesMap[q.id] = await listVotes(s.id, q.id)
      }))
      setAllVotes(votesMap)
    } catch (err) {
      setError(err?.message || 'Failed to load results')
    }
  }, [code])

  useEffect(() => { load() }, [load])

  const totalResponses = useMemo(() => {
    const voterIds = new Set()
    for (const votes of Object.values(allVotes)) {
      for (const v of votes) voterIds.add(v.voterId)
    }
    return voterIds.size
  }, [allVotes])

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
          <span className="badge ended">ended</span>
          <span className="badge" style={{ background: 'rgba(255,255,255,.06)', font: '700 14px/1 var(--mono)', color: 'var(--text)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></svg>
            {totalResponses}
          </span>
        </div>
      </div>

      <main style={{ maxWidth: 900, gap: 40, paddingBottom: 60 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Results</h1>
        <p className="meta" style={{ textAlign: 'center', marginBottom: 32 }}>
          {questions.length} questions · {totalResponses} participants
        </p>

        {questions.map((q, qi) => {
          const options = parseOptions(q.options)
          const votes = allVotes[q.id] || []
          const tallies = tallyVotes(options, votes)
          const maxPct = Math.max(...tallies.map((t) => t.pct), 0)

          return (
            <div key={q.id} style={{ marginBottom: 40 }}>
              <div className="row" style={{ marginBottom: 14 }}>
                <span className="meta">Question {qi + 1}</span>
                <span className="meta" style={{ marginLeft: 'auto' }}>{votes.length} responses</span>
              </div>
              <h2 style={{ font: '800 24px/1.2 var(--font)', color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 18px' }}>
                {q.prompt}
              </h2>
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
            </div>
          )
        })}

        {error && <p className="error">{error}</p>}
      </main>
    </div>
  )
}
