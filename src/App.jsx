import { useEffect, useState } from 'react'
import Admin from './pages/Admin.jsx'
import Editor from './pages/Editor.jsx'
import Presenter from './pages/Presenter.jsx'
import Results from './pages/Results.jsx'
import Join from './pages/Join.jsx'
import Landing from './pages/Landing.jsx'
import { handleOAuthCallback, isLoggedIn, createSession } from './wixData.js'
import { makeJoinCode } from './lib/poll.js'
import { navigate } from './lib/nav.js'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const path = raw.startsWith('/') ? raw : `/${raw}`
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'admin' }
  if (parts[0] === 'session' && parts[1]) return { name: 'editor', id: parts[1] }
  if (parts[0] === 'present' && parts[1]) return { name: 'presenter', code: parts[1] }
  if (parts[0] === 'join' && parts[1]) return { name: 'join', code: parts[1] }
  if (parts[0] === 'results' && parts[1]) return { name: 'results', code: parts[1] }
  return { name: 'admin' }
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export default function App() {
  const route = useRoute()
  const [authReady, setAuthReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hasOAuth = (searchParams.has('code') && searchParams.has('state')) ||
      (hashParams.has('code') && hashParams.has('state'))
    if (hasOAuth) {
      handleOAuthCallback()
        .then(async (ok) => {
          const loggedInNow = ok || isLoggedIn()
          setLoggedIn(loggedInNow)
          setAuthReady(true)
          if (loggedInNow) {
            const pendingTitle = sessionStorage.getItem('pending_poll_title')
            if (pendingTitle) {
              sessionStorage.removeItem('pending_poll_title')
              try {
                const session = await createSession({
                  title: pendingTitle,
                  code: makeJoinCode(),
                })
                navigate(`/session/${session.id}`)
              } catch { /* fall through to admin */ }
            }
          }
        })
        .catch(() => {
          setLoggedIn(isLoggedIn())
          setAuthReady(true)
        })
    } else {
      setLoggedIn(isLoggedIn())
      setAuthReady(true)
    }
  }, [])

  if (route.name === 'presenter') return <Presenter code={route.code} />
  if (route.name === 'results') return <Results code={route.code} />
  if (route.name === 'join') return <Join code={route.code} />

  if (!authReady) return <div className="app-shell"><p className="muted">Loading…</p></div>

  if (!loggedIn) return <Landing />

  if (route.name === 'editor') return <Editor id={route.id} />
  return <Admin />
}
