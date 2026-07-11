import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// Mock navigate
vi.mock('../lib/nav.js', () => ({
  navigate: vi.fn(),
}))

// Mock wixData — all functions are vi.fn() so tests can configure returns
const mockUpdateSession = vi.fn()
const mockGetSessionByCode = vi.fn()
const mockGetSessionById = vi.fn()
const mockListQuestions = vi.fn()
const mockListVotes = vi.fn()
const mockCreateQuestion = vi.fn()
const mockDeleteQuestion = vi.fn()
const mockUpdateQuestion = vi.fn()
const mockCastVote = vi.fn()
const mockFindVote = vi.fn()

vi.mock('../wixData.js', () => ({
  updateSession: (...args) => mockUpdateSession(...args),
  getSessionByCode: (...args) => mockGetSessionByCode(...args),
  getSessionById: (...args) => mockGetSessionById(...args),
  listQuestions: (...args) => mockListQuestions(...args),
  listVotes: (...args) => mockListVotes(...args),
  createQuestion: (...args) => mockCreateQuestion(...args),
  deleteQuestion: (...args) => mockDeleteQuestion(...args),
  updateQuestion: (...args) => mockUpdateQuestion(...args),
  castVote: (...args) => mockCastVote(...args),
  findVote: (...args) => mockFindVote(...args),
  isLoggedIn: () => true,
  isConfigured: () => true,
  handleOAuthCallback: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  APP_ID: 'test',
  createSession: vi.fn(),
  listSessions: vi.fn().mockResolvedValue([]),
  deleteSession: vi.fn(),
}))

import { navigate } from '../lib/nav.js'
import Presenter from '../pages/Presenter.jsx'
import Editor from '../pages/Editor.jsx'
import Join from '../pages/Join.jsx'

// --- Test fixtures ---

function makeSession(overrides = {}) {
  return {
    id: 'sess-1',
    title: 'Test Session',
    code: 'ABC123',
    status: 'draft',
    activeIndex: 0,
    activeQuestionId: '',
    ...overrides,
  }
}

function makeQuestions(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    sessionId: 'sess-1',
    type: 'mc',
    prompt: `Question ${i + 1}?`,
    options: JSON.stringify([`Option A`, `Option B`, `Option C`]),
    order: i,
  }))
}

// --- Helpers ---

function setupPresenter(session, questions, votes = []) {
  mockGetSessionByCode.mockResolvedValue(session)
  mockListQuestions.mockResolvedValue(questions)
  mockListVotes.mockResolvedValue(votes)
  mockUpdateSession.mockImplementation(async (s) => s)
}

function setupEditor(session, questions) {
  mockGetSessionById.mockResolvedValue(session)
  mockListQuestions.mockResolvedValue(questions)
  mockUpdateSession.mockImplementation(async (s) => s)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

// ============================================================
// TRANSITION 1: Draft → Live (Editor "Go Live")
// ============================================================
describe('Draft → Live (Editor)', () => {
  it('Go Live sets status to live, activeIndex=0, activeQuestionId=first question', async () => {
    const session = makeSession({ status: 'draft' })
    const questions = makeQuestions(3)
    setupEditor(session, questions)

    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Go live')).toBeInTheDocument())

    const goLiveBtn = screen.getByText('Go live').closest('button')
    expect(goLiveBtn).not.toBeDisabled()

    await act(async () => { fireEvent.click(goLiveBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'live',
        activeIndex: 0,
        activeQuestionId: 'q-0',
      })
    )
  })

  it('Go Live is disabled when no questions exist', async () => {
    const session = makeSession({ status: 'draft' })
    setupEditor(session, [])

    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Go live')).toBeInTheDocument())

    const goLiveBtn = screen.getByText('Go live').closest('button')
    expect(goLiveBtn).toBeDisabled()
  })
})

// ============================================================
// TRANSITION 2: Draft → Live (Presenter first Next)
// ============================================================
describe('Draft → Live (Presenter first Next)', () => {
  it('pressing Next on a draft session transitions to live', async () => {
    const session = makeSession({ status: 'draft', activeQuestionId: 'q-0' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())

    const nextBtn = screen.getByText('Next').closest('button')
    await act(async () => { fireEvent.click(nextBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'live',
        activeQuestionId: 'q-1',
        activeIndex: 1,
      })
    )
  })
})

// ============================================================
// TRANSITION 3: Live → Live (Next question)
// ============================================================
describe('Live → Live (Next question)', () => {
  it('Next advances activeIndex and activeQuestionId', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())

    const nextBtn = screen.getByText('Next').closest('button')
    await act(async () => { fireEvent.click(nextBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'live',
        activeIndex: 1,
        activeQuestionId: 'q-1',
      })
    )
  })
})

// ============================================================
// TRANSITION 4: Live → Live (Previous question)
// ============================================================
describe('Live → Live (Previous question)', () => {
  it('Previous decrements activeIndex and activeQuestionId', async () => {
    const session = makeSession({ status: 'live', activeIndex: 1, activeQuestionId: 'q-1' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 2?')).toBeInTheDocument())

    const prevBtn = screen.getByText('Previous').closest('button')
    await act(async () => { fireEvent.click(prevBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'live',
        activeIndex: 0,
        activeQuestionId: 'q-0',
      })
    )
  })

  it('Previous on first question stays at index 0', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())

    const prevBtn = screen.getByText('Previous').closest('button')
    await act(async () => { fireEvent.click(prevBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        activeIndex: 0,
        activeQuestionId: 'q-0',
      })
    )
  })
})

// ============================================================
// TRANSITION 5: Live → Ended (Editor "End Session")
// ============================================================
describe('Live → Ended (Editor)', () => {
  it('End Session sets status to ended and clears activeQuestionId', async () => {
    const session = makeSession({ status: 'live', activeQuestionId: 'q-1' })
    const questions = makeQuestions(3)
    setupEditor(session, questions)

    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('End session')).toBeInTheDocument())

    const endBtn = screen.getByText('End session').closest('button')
    expect(endBtn).not.toBeDisabled()

    await act(async () => { fireEvent.click(endBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ended',
        activeQuestionId: '',
      })
    )
  })

  it('End Session is disabled when status is draft', async () => {
    const session = makeSession({ status: 'draft' })
    const questions = makeQuestions(3)
    setupEditor(session, questions)

    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('End session')).toBeInTheDocument())

    const endBtn = screen.getByText('End session').closest('button')
    expect(endBtn).toBeDisabled()
  })
})

// ============================================================
// TRANSITION 6: Live → Ended (Presenter "Done" on last question)
// ============================================================
describe('Live → Ended (Presenter Done)', () => {
  it('shows Done button on last question instead of Next', async () => {
    const session = makeSession({ status: 'live', activeIndex: 2, activeQuestionId: 'q-2' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 3?')).toBeInTheDocument())

    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('Done ends session and navigates to results', async () => {
    const session = makeSession({ status: 'live', activeIndex: 2, activeQuestionId: 'q-2' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument())

    const doneBtn = screen.getByText('Done').closest('button')
    await act(async () => { fireEvent.click(doneBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ended',
        activeQuestionId: '',
      })
    )
    expect(navigate).toHaveBeenCalledWith('/results/ABC123')
  })

  it('shows Next (not Done) when not on last question', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    const questions = makeQuestions(3)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())

    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })
})

// ============================================================
// TRANSITION 7: Ended → Draft (Editor "Reset to Draft")
// ============================================================
describe('Ended → Draft (Editor Reset)', () => {
  it('Reset to Draft sets status back to draft', async () => {
    const session = makeSession({ status: 'ended' })
    const questions = makeQuestions(3)
    setupEditor(session, questions)

    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Reset to draft')).toBeInTheDocument())

    const resetBtn = screen.getByText('Reset to draft').closest('button')
    await act(async () => { fireEvent.click(resetBtn) })

    expect(mockUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'draft',
      })
    )
  })
})

// ============================================================
// VOTER (Join) — state-dependent rendering
// ============================================================
describe('Join page per state', () => {
  beforeEach(() => {
    mockFindVote.mockResolvedValue(null)
  })

  it('shows waiting message when session is draft', async () => {
    const session = makeSession({ status: 'draft' })
    mockGetSessionByCode.mockResolvedValue(session)
    mockListQuestions.mockResolvedValue(makeQuestions(2))

    render(<Join code="ABC123" />)

    await waitFor(() => expect(screen.getByText(/hasn't started/)).toBeInTheDocument())
  })

  it('shows question choices when session is live', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    mockGetSessionByCode.mockResolvedValue(session)
    mockListQuestions.mockResolvedValue(makeQuestions(2))

    render(<Join code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
    expect(screen.getByText('Option C')).toBeInTheDocument()
  })

  it('shows ended message when session is ended', async () => {
    const session = makeSession({ status: 'ended' })
    mockGetSessionByCode.mockResolvedValue(session)
    mockListQuestions.mockResolvedValue(makeQuestions(2))

    render(<Join code="ABC123" />)

    await waitFor(() => expect(screen.getByText(/Thanks for playing/)).toBeInTheDocument())
  })

  it('shows "answer is in" after voting', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    mockGetSessionByCode.mockResolvedValue(session)
    mockListQuestions.mockResolvedValue(makeQuestions(2))
    mockCastVote.mockResolvedValue({ id: 'vote-1' })

    render(<Join code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Option A')).toBeInTheDocument())

    const choiceBtn = screen.getByText('Option A').closest('button')
    await act(async () => { fireEvent.click(choiceBtn) })

    await waitFor(() => expect(screen.getByText(/Your answer is in/)).toBeInTheDocument())
  })
})

// ============================================================
// PRESENTER — state-dependent rendering
// ============================================================
describe('Presenter per state', () => {
  it('shows placeholder when no questions exist', async () => {
    const session = makeSession({ status: 'draft', activeQuestionId: '' })
    setupPresenter(session, [])

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText(/Add questions and go live/)).toBeInTheDocument())
  })

  it('shows first question when draft with questions but no activeQuestionId', async () => {
    const session = makeSession({ status: 'draft', activeQuestionId: '' })
    setupPresenter(session, makeQuestions(2))

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())
  })

  it('shows vote bars and question when live', async () => {
    const session = makeSession({ status: 'live', activeIndex: 0, activeQuestionId: 'q-0' })
    const questions = makeQuestions(2)
    setupPresenter(session, questions, [
      { id: 'v1', choice: 'Option A', voterId: 'voter-1' },
      { id: 'v2', choice: 'Option A', voterId: 'voter-2' },
      { id: 'v3', choice: 'Option B', voterId: 'voter-3' },
    ])

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 1?')).toBeInTheDocument())
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('displays progress dots matching question count', async () => {
    const session = makeSession({ status: 'live', activeIndex: 1, activeQuestionId: 'q-1' })
    const questions = makeQuestions(4)
    setupPresenter(session, questions)

    render(<Presenter code="ABC123" />)

    await waitFor(() => expect(screen.getByText('Question 2 of 4')).toBeInTheDocument())
    const dots = document.querySelectorAll('.progress-dot')
    expect(dots).toHaveLength(4)
    expect(dots[0].classList.contains('active')).toBe(true)
    expect(dots[1].classList.contains('active')).toBe(true)
    expect(dots[2].classList.contains('active')).toBe(false)
  })
})

// ============================================================
// EDITOR — button states per session status
// ============================================================
describe('Editor button states', () => {
  it('draft: Go Live enabled, End disabled', async () => {
    setupEditor(makeSession({ status: 'draft' }), makeQuestions(2))
    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Go live')).toBeInTheDocument())

    expect(screen.getByText('Go live').closest('button')).not.toBeDisabled()
    expect(screen.getByText('End session').closest('button')).toBeDisabled()
  })

  it('live: Go Live disabled, End enabled', async () => {
    setupEditor(makeSession({ status: 'live', activeQuestionId: 'q-0' }), makeQuestions(2))
    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Go live')).toBeInTheDocument())

    expect(screen.getByText('Go live').closest('button')).toBeDisabled()
    expect(screen.getByText('End session').closest('button')).not.toBeDisabled()
  })

  it('ended: Go Live enabled (can re-start), End disabled, Reset enabled', async () => {
    setupEditor(makeSession({ status: 'ended' }), makeQuestions(2))
    render(<Editor id="sess-1" />)

    await waitFor(() => expect(screen.getByText('Go live')).toBeInTheDocument())

    expect(screen.getByText('Go live').closest('button')).not.toBeDisabled()
    expect(screen.getByText('End session').closest('button')).toBeDisabled()
    expect(screen.getByText('Reset to draft').closest('button')).not.toBeDisabled()
  })
})
