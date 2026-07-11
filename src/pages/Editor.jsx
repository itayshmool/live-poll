import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/nav.js'
import {
  createQuestion,
  deleteQuestion,
  getSessionById,
  listQuestions,
  updateQuestion,
  updateSession,
} from '../wixData.js'
import {
  QUESTION_TYPES,
  STATUS,
  defaultOptionsForType,
  joinUrl,
  parseOptions,
  presentUrl,
  qrImageUrl,
  serializeOptions,
} from '../lib/poll.js'

export default function Editor({ id }) {
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState('tf')
  const [optionsText, setOptionsText] = useState(defaultOptionsForType('tf').join('\n'))

  const join = useMemo(() => (session ? joinUrl(session.code) : ''), [session])
  const present = useMemo(() => (session ? presentUrl(session.code) : ''), [session])

  async function refresh() {
    setError('')
    try {
      const [s, q] = await Promise.all([getSessionById(id), listQuestions(id)])
      setSession(s)
      setQuestions(q)
    } catch (err) {
      setError(err?.message || 'Failed to load session')
    }
  }

  useEffect(() => {
    refresh()
  }, [id])

  useEffect(() => {
    setOptionsText(defaultOptionsForType(type).join('\n'))
  }, [type])

  async function setStatus(status) {
    if (!session) return
    setSaving(true)
    try {
      const patch = { ...session, status }
      if (status === STATUS.live && questions[0]) {
        patch.activeIndex = 0
        patch.activeQuestionId = questions[0].id
      }
      if (status === STATUS.ended) {
        patch.activeQuestionId = ''
      }
      const updated = await updateSession(patch)
      setSession(updated)
    } catch (err) {
      setError(err?.message || 'Could not update status')
    } finally {
      setSaving(false)
    }
  }

  async function onAddQuestion(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    const options = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (options.length < 2) {
      setError('Add at least two options')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createQuestion({
        sessionId: id,
        type,
        prompt: prompt.trim(),
        options: serializeOptions(options),
        order: questions.length,
      })
      setPrompt('')
      setType('tf')
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not add question')
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteQuestion(qid) {
    setSaving(true)
    try {
      await deleteQuestion(qid)
      const remaining = questions.filter((q) => q.id !== qid)
      await Promise.all(remaining.map((q, index) => updateQuestion({ ...q, order: index })))
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not delete question')
    } finally {
      setSaving(false)
    }
  }

  async function move(qid, dir) {
    const index = questions.findIndex((q) => q.id === qid)
    const swap = index + dir
    if (index < 0 || swap < 0 || swap >= questions.length) return
    const next = [...questions]
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setSaving(true)
    try {
      await Promise.all(next.map((q, order) => updateQuestion({ ...q, order })))
      await refresh()
    } catch (err) {
      setError(err?.message || 'Could not reorder')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="app-shell">
        <p className="muted">{error || 'Loading session…'}</p>
        <button className="btn secondary" type="button" onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="app-shell stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <button className="btn secondary" type="button" onClick={() => navigate('/')}>
            ← Sessions
          </button>
          <h1 style={{ margin: '0.4rem 0 0', fontFamily: 'var(--display)' }}>{session.title}</h1>
        </div>
        <span className={`badge ${session.status}`}>{session.status}</span>
      </div>

      <div className="grid-2">
        <section className="card stack">
          <h2 style={{ margin: 0, fontFamily: 'var(--display)' }}>Controls</h2>
          <div className="row">
            <button
              className="btn"
              disabled={saving || session.status === STATUS.live || questions.length === 0}
              onClick={() => setStatus(STATUS.live)}
            >
              Go live
            </button>
            <button
              className="btn secondary"
              disabled={saving || session.status !== STATUS.live}
              onClick={() => setStatus(STATUS.ended)}
            >
              End session
            </button>
            <button className="btn ghost" disabled={saving} onClick={() => setStatus(STATUS.draft)}>
              Reset to draft
            </button>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Join code <strong style={{ color: 'var(--text)' }}>{session.code}</strong>
          </p>
          <div className="row">
            <a className="btn secondary" href={present} target="_blank" rel="noreferrer">
              Open presenter
            </a>
            <a className="btn ghost" href={join} target="_blank" rel="noreferrer">
              Open join page
            </a>
            <button
              className="btn secondary"
              type="button"
              onClick={() => navigator.clipboard.writeText(join)}
            >
              Copy join link
            </button>
          </div>
        </section>

        <section className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <img className="qr" src={qrImageUrl(join)} alt={`QR for ${session.code}`} />
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem', wordBreak: 'break-all' }}>
            {join}
          </p>
        </section>
      </div>

      <section className="card stack">
        <h2 style={{ margin: 0, fontFamily: 'var(--display)' }}>Add question</h2>
        <form className="stack" onSubmit={onAddQuestion}>
          <div className="field">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="I've used an AI tool to do my own work this week"
              required
            />
          </div>
          <div className="row">
            <div className="field" style={{ minWidth: 200 }}>
              <label htmlFor="type">Type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor="options">Options (one per line)</label>
              <textarea
                id="options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={saving}>
            Add question
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0, fontFamily: 'var(--display)' }}>
          Questions ({questions.length})
        </h2>
        {questions.length === 0 && <p className="empty">Add questions before going live.</p>}
        {questions.map((q, index) => (
          <div className="list-item" key={q.id}>
            <div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                Q{index + 1} · {QUESTION_TYPES.find((t) => t.id === q.type)?.label || q.type}
              </div>
              <div style={{ fontWeight: 600 }}>{q.prompt}</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {parseOptions(q.options).join(' · ')}
              </div>
            </div>
            <div className="row">
              <button className="btn secondary" type="button" onClick={() => move(q.id, -1)}>
                ↑
              </button>
              <button className="btn secondary" type="button" onClick={() => move(q.id, 1)}>
                ↓
              </button>
              <button className="btn danger" type="button" onClick={() => onDeleteQuestion(q.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
