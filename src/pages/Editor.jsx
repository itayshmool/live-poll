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
import Logo from '../components/Logo.jsx'

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

  useEffect(() => { refresh() }, [id])
  useEffect(() => { setOptionsText(defaultOptionsForType(type).join('\n')) }, [type])

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
    const options = optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="top-bar">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn-icon" type="button" onClick={() => navigate('/')} style={{ width: 40, height: 40 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 style={{ font: '800 22px/1 var(--font)', letterSpacing: '-0.02em', margin: 0 }}>{session.title}</h1>
          <span className={`badge ${session.status}`}>
            {session.status === 'live' && <span className="pulse-dot" />}
            {session.status}
          </span>
        </div>
      </div>

      <div className="app-shell stack" style={{ gap: 22 }}>
        <div className="grid-2">
          {/* Controls card */}
          <div className="card stack" style={{ gap: 22 }}>
            <div className="card-header" style={{ margin: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /></svg>
              <span className="card-title">Session controls</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn live-btn"
                style={{ flex: 1 }}
                disabled={saving || session.status === STATUS.live || questions.length === 0}
                onClick={() => setStatus(STATUS.live)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4" /></svg>
                Go live
              </button>
              <button
                className="btn danger"
                style={{ flex: 1 }}
                disabled={saving || session.status !== STATUS.live}
                onClick={() => setStatus(STATUS.ended)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                End session
              </button>
              <button
                className="btn secondary"
                style={{ flex: 1 }}
                disabled={saving}
                onClick={() => setStatus(STATUS.draft)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                Reset to draft
              </button>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div className="join-code-label" style={{ marginBottom: 8 }}>Join code</div>
                <div className="join-code-value large">{session.code}</div>
              </div>
              <div className="row" style={{ marginLeft: 'auto' }}>
                <a className="btn secondary" href={present} target="_blank" rel="noreferrer">Open presenter</a>
                <a className="btn secondary" href={join} target="_blank" rel="noreferrer">Open join page</a>
                <button className="btn ghost" type="button" onClick={() => navigator.clipboard.writeText(join)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Copy join link
                </button>
              </div>
            </div>
          </div>

          {/* QR card */}
          <div className="card stack" style={{ alignItems: 'center', gap: 16 }}>
            <div className="card-header" style={{ alignSelf: 'stretch', margin: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" /></svg>
              <span className="card-title">Scan to join</span>
            </div>
            <img className="qr" src={qrImageUrl(join)} alt={`QR for ${session.code}`} />
            <div style={{ font: '500 12px/1.4 var(--mono)', color: 'rgba(255,255,255,.5)', textAlign: 'center', wordBreak: 'break-all' }}>
              {join}
            </div>
          </div>
        </div>

        {/* Add question form */}
        <div className="card">
          <div className="card-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
            <span className="card-title">Add question</span>
          </div>
          <form onSubmit={onAddQuestion}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'start' }}>
              <div className="field">
                <label htmlFor="prompt">Prompt</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Which feature should we ship first?"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="type">Type</label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="options">Options <span style={{ color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>— one per line</span></label>
                <textarea
                  id="options"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  style={{ minHeight: 104 }}
                />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button className="btn" type="submit" disabled={saving} style={{ width: '100%' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                  Add question
                </button>
              </div>
            </div>
          </form>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        </div>

        {/* Questions list */}
        <div>
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 style={{ font: '800 18px/1 var(--font)', letterSpacing: '-0.01em', margin: 0 }}>Questions</h2>
            <span className="count-badge">{questions.length}</span>
          </div>

          {questions.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Add questions before going live.</p>}

          <div className="stack" style={{ gap: 12 }}>
            {questions.map((q, index) => (
              <div className="q-item" key={q.id}>
                <span className="q-number">{String(index + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="q-type">{QUESTION_TYPES.find((t) => t.id === q.type)?.label || q.type}</div>
                  <div className="q-prompt">{q.prompt}</div>
                  <div className="q-options">{parseOptions(q.options).join(' · ')}</div>
                </div>
                <div className="q-actions">
                  <button className="btn-icon" type="button" onClick={() => move(q.id, -1)} disabled={index === 0}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m18 15-6-6-6 6" /></svg>
                  </button>
                  <button className="btn-icon" type="button" onClick={() => move(q.id, 1)} disabled={index === questions.length - 1}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  <button className="btn-icon danger" type="button" onClick={() => onDeleteQuestion(q.id)}>
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
