import { useEffect, useState } from 'react'
import Admin from './pages/Admin.jsx'
import Editor from './pages/Editor.jsx'
import Presenter from './pages/Presenter.jsx'
import Join from './pages/Join.jsx'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const path = raw.startsWith('/') ? raw : `/${raw}`
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'admin' }
  if (parts[0] === 'session' && parts[1]) return { name: 'editor', id: parts[1] }
  if (parts[0] === 'present' && parts[1]) return { name: 'presenter', code: parts[1] }
  if (parts[0] === 'join' && parts[1]) return { name: 'join', code: parts[1] }
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

  if (route.name === 'editor') return <Editor id={route.id} />
  if (route.name === 'presenter') return <Presenter code={route.code} />
  if (route.name === 'join') return <Join code={route.code} />
  return <Admin />
}
