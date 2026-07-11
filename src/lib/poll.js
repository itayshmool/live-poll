/** Collection IDs — match seeded Wix Data collections */
export const COLLECTIONS = {
  sessions: 'PollSessions',
  questions: 'PollQuestions',
  votes: 'PollVotes',
}

export const QUESTION_TYPES = [
  { id: 'tf', label: 'True / False' },
  { id: 'mc', label: 'Multiple choice' },
  { id: 'scale', label: 'Scale' },
]

export const STATUS = {
  draft: 'draft',
  live: 'live',
  ended: 'ended',
}

export function makeJoinCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function getVoterId() {
  const key = 'live-poll-voter-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function defaultOptionsForType(type) {
  if (type === 'tf') return ['True', 'False']
  if (type === 'mc') return ['Option A', 'Option B', 'Option C']
  if (type === 'scale') return ['1', '2', '3', '4', '5', "I don't know"]
  return []
}

export function parseOptions(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

export function serializeOptions(options) {
  return JSON.stringify(options)
}

export function tallyVotes(options, votes) {
  const counts = Object.fromEntries(options.map((o) => [o, 0]))
  for (const vote of votes) {
    if (counts[vote.choice] !== undefined) counts[vote.choice] += 1
  }
  const total = votes.length
  return options.map((label) => {
    const count = counts[label] || 0
    const pct = total === 0 ? 0 : Math.round((count / total) * 100)
    return { label, count, pct }
  })
}

export function joinUrl(code) {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/join/${code}`
}

export function presentUrl(code) {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/present/${code}`
}

export function qrImageUrl(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`
}
