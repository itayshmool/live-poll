export function navigate(to) {
  const hash = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}
