import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import { COLLECTIONS } from './lib/poll.js'

/**
 * OAuth client ID is injected after `npm create @wix/new@latest init`
 * from wix.config.json → appId. Placeholder until init completes.
 */
export const APP_ID =
  import.meta.env.VITE_WIX_CLIENT_ID || 'c1bb4d65-9259-4436-a536-ee37c6c0f9c0'

const wix = createClient({
  modules: { items },
  auth: OAuthStrategy({ clientId: APP_ID }),
})

function mapItem(item) {
  if (!item) return null
  return { ...item, id: item._id }
}

export async function listSessions() {
  const { items: rows } = await wix.items
    .query(COLLECTIONS.sessions)
    .descending('_createdDate')
    .limit(100)
    .find()
  return rows.map(mapItem)
}

export async function getSessionById(id) {
  const item = await wix.items.get(COLLECTIONS.sessions, id)
  return mapItem(item)
}

export async function getSessionByCode(code) {
  const { items: rows } = await wix.items
    .query(COLLECTIONS.sessions)
    .eq('code', String(code).toUpperCase())
    .limit(1)
    .find()
  return mapItem(rows[0])
}

export async function createSession({ title, code }) {
  const created = await wix.items.insert(COLLECTIONS.sessions, {
    title,
    code: code.toUpperCase(),
    status: 'draft',
    activeQuestionId: '',
    activeIndex: 0,
  })
  return mapItem(created)
}

export async function updateSession(session) {
  const { id, ...rest } = session
  const updated = await wix.items.update(COLLECTIONS.sessions, {
    _id: id,
    ...rest,
  })
  return mapItem(updated)
}

export async function deleteSession(id) {
  await wix.items.remove(COLLECTIONS.sessions, id)
}

export async function listQuestions(sessionId) {
  const { items: rows } = await wix.items
    .query(COLLECTIONS.questions)
    .eq('sessionId', sessionId)
    .ascending('order')
    .limit(100)
    .find()
  return rows.map(mapItem)
}

export async function createQuestion(data) {
  const created = await wix.items.insert(COLLECTIONS.questions, data)
  return mapItem(created)
}

export async function updateQuestion(question) {
  const { id, ...rest } = question
  const updated = await wix.items.update(COLLECTIONS.questions, {
    _id: id,
    ...rest,
  })
  return mapItem(updated)
}

export async function deleteQuestion(id) {
  await wix.items.remove(COLLECTIONS.questions, id)
}

export async function listVotes(sessionId, questionId) {
  let q = wix.items.query(COLLECTIONS.votes).eq('sessionId', sessionId).limit(1000)
  if (questionId) q = q.eq('questionId', questionId)
  const { items: rows } = await q.find()
  return rows.map(mapItem)
}

export async function findVote(sessionId, questionId, voterId) {
  const { items: rows } = await wix.items
    .query(COLLECTIONS.votes)
    .eq('sessionId', sessionId)
    .eq('questionId', questionId)
    .eq('voterId', voterId)
    .limit(1)
    .find()
  return mapItem(rows[0])
}

export async function castVote({ sessionId, questionId, choice, voterId }) {
  const existing = await findVote(sessionId, questionId, voterId)
  if (existing) return existing
  const created = await wix.items.insert(COLLECTIONS.votes, {
    sessionId,
    questionId,
    choice,
    voterId,
  })
  return mapItem(created)
}

export function isConfigured() {
  return APP_ID && APP_ID !== 'REPLACE_WITH_APP_ID'
}
