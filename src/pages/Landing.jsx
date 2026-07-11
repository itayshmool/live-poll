import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import { login, createSession } from '../wixData.js'
import { navigate } from '../lib/nav.js'
import { makeJoinCode } from '../lib/poll.js'

function HeroPollPreview() {
  const bars = [
    { label: 'Live captions', pct: 42, leading: true },
    { label: 'Team spaces', pct: 31 },
    { label: 'Offline mode', pct: 18 },
    { label: 'Dark theme', pct: 9 },
  ]
  return (
    <div className="hero-preview">
      <div className="hero-preview-header">
        <span className="badge live" style={{ padding: '6px 12px' }}>
          <span className="pulse-dot" />Live
        </span>
        <span className="hero-preview-code">BQCYUH</span>
      </div>
      <h3 className="hero-preview-question">Which feature should we ship first?</h3>
      <div className="hero-preview-bars">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="hero-preview-bar-label">
              <span style={{ font: '700 15px/1 var(--font)', color: b.leading ? 'var(--text)' : 'rgba(255,255,255,.9)' }}>{b.label}</span>
              <span style={{ font: '800 16px/1 var(--mono)', color: b.leading ? 'var(--accent)' : 'rgba(255,255,255,.8)', fontVariantNumeric: 'tabular-nums' }}>{b.pct}%</span>
            </div>
            <div className="hero-preview-track">
              <div
                className={`hero-preview-fill ${b.leading ? 'leading' : ''}`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="hero-preview-footer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
        400 votes &middot; updating live
      </div>
    </div>
  )
}

export default function Landing() {
  const [joinCode, setJoinCode] = useState('')
  const [pollTitle, setPollTitle] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  function handleJoin(e) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (code) navigate(`/join/${code}`)
  }

  async function handleSignIn() {
    setSigningIn(true)
    try { await login() } catch { setSigningIn(false) }
  }

  async function handleCreate(e) {
    if (e) e.preventDefault()
    const title = pollTitle.trim()
    if (title) {
      sessionStorage.setItem('pending_poll_title', title)
    }
    setSigningIn(true)
    try { await login() } catch { setSigningIn(false) }
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <div className="brand">
            <Logo />
            <span className="brand-text">poll-it<span style={{ color: 'var(--accent)' }}>.live</span></span>
          </div>
        </div>
        <div className="landing-nav-right">
          <button className="btn secondary" type="button" onClick={handleSignIn} disabled={signingIn}>Sign in</button>
          <button className="btn" type="button" onClick={handleCreate} disabled={signingIn}>Create a poll</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="landing-pill">
            <span className="landing-pill-dot" />
            Live audience polling
          </div>
          <h1 className="landing-h1">Ask the room.<br />See it <span style={{ color: 'var(--accent)' }}>live.</span></h1>
          <p className="landing-hero-desc">Spin up a poll in seconds, put a join code on the big screen, and watch votes land in real time. No installs — the room votes from their phones.</p>
          <form className="landing-create-form" onSubmit={handleCreate}>
            <div className="landing-create-row">
              <input
                className="landing-title-input"
                placeholder="e.g. Q3 All-Hands 2026"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
              />
              <button className="btn landing-btn-create" type="submit" disabled={signingIn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                {signingIn ? 'Redirecting...' : 'Create a poll — free'}
              </button>
            </div>
          </form>
          <div className="landing-hero-ctas">
            <form className="landing-join-input" onSubmit={handleJoin}>
              <span className="landing-join-label">Join</span>
              <input
                placeholder="CODE"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="landing-join-field"
              />
              <button className="landing-join-go" type="submit">Go</button>
            </form>
          </div>
          <div className="landing-stats">
            <div>
              <div className="landing-stat-value">&lt;1s</div>
              <div className="landing-stat-label">Vote latency</div>
            </div>
            <div>
              <div className="landing-stat-value">0</div>
              <div className="landing-stat-label">Installs</div>
            </div>
            <div>
              <div className="landing-stat-value">Free</div>
              <div className="landing-stat-label">To start</div>
            </div>
          </div>
        </div>
        <HeroPollPreview />
      </section>

      {/* How it works */}
      <section className="landing-section">
        <div className="landing-section-label">How it works</div>
        <div className="landing-steps">
          {[
            { n: '1', title: 'Build your poll', desc: 'Add questions — multiple choice, true/false, or a 1-5 scale. Reorder them any time before you go live.' },
            { n: '2', title: 'Share the code', desc: 'Put the presenter view on the big screen. A six-letter join code gets the whole room voting in seconds.' },
            { n: '3', title: 'Watch it land', desc: 'Bars fill live as votes come in. Step through questions and let the results drive the conversation.' },
          ].map((s) => (
            <div className="landing-step" key={s.n}>
              <div className="landing-step-num">{s.n}</div>
              <div className="landing-step-title">{s.title}</div>
              <div className="landing-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="landing-features">
          {[
            { icon: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />, title: 'Sub-second results', desc: 'Votes stream in and bars animate the moment a phone taps.' },
            { icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7" /></>, title: 'QR + join code', desc: 'No app, no login. Scan or type six letters and you\'re in.' },
            { icon: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M17 2v5M7 2v5" /></>, title: 'Big-screen ready', desc: 'Presenter view is built for projectors — huge type, high contrast.' },
            { icon: <path d="M18 20V10M12 20V4M6 20v-6" />, title: 'Three question types', desc: 'Multiple choice, true/false, and 1-5 scale out of the box.' },
          ].map((f) => (
            <div className="landing-feature" key={f.title}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="landing-feature-icon">{f.icon}</svg>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="landing-section">
        <div className="landing-cta-band">
          <div>
            <h2 className="landing-cta-title">Get the room talking.</h2>
            <p className="landing-cta-desc">Your first poll takes about a minute. Free to use, no credit card required.</p>
          </div>
          <button className="btn landing-btn-cta" type="button" onClick={handleCreate} disabled={signingIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            Create a poll
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-left">
          <Logo size={22} />
          <span className="brand-text" style={{ fontSize: 16 }}>poll-it<span style={{ color: 'var(--accent)' }}>.live</span></span>
        </div>
        <div className="landing-footer-right">
          <span className="landing-powered">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2"><path d="M13 2 3 14h9l-1 8 10-12h-9z" /></svg>
            Powered by <span style={{ color: 'var(--text)', fontWeight: 700 }}>Wix Headless</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
