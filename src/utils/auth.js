const AUTH_SESSION_KEY = 'auth_session_v1'
const DEFAULT_BOOTSTRAP_KEY = 'auth_default_bootstrap_v1'
const GUEST_SESSION_KEY = 'guest_session_v1'
const GUEST_TRIAL_USAGE_KEY = 'guest_trial_usage_v1'
const AUTH_CHANGED_EVENT = 'auth-session-changed'

export const DEFAULT_USER = {
  username: 'workshop_guest',
  displayName: '默认用户',
  password: '123456',
}

function emitAuthChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))
}

function safeJsonParse(raw, fallback = null) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const session = safeJsonParse(localStorage.getItem(AUTH_SESSION_KEY), null)
  if (!session?.username || !session?.token) return null
  return session
}

export function saveCurrentUser(user) {
  if (typeof window === 'undefined') return null
  const session = {
    username: String(user?.username || '').trim(),
    displayName: String(user?.displayName || user?.username || '').trim(),
    token: String(user?.token || '').trim(),
    loggedInAt: user?.loggedInAt || new Date().toISOString(),
  }
  if (!session.username || !session.token) return null
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('token', session.token)
  localStorage.setItem('username', session.username)
  clearGuestSessionState()
  emitAuthChanged()
  return session
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_SESSION_KEY)
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  clearGuestSessionState()
  emitAuthChanged()
}

export function bootstrapDefaultUser() {
  if (typeof window === 'undefined') return null
  const current = getCurrentUser()
  if (current) return current

  const bootstrapped = localStorage.getItem(DEFAULT_BOOTSTRAP_KEY) === 'true'
  if (bootstrapped) return null

  localStorage.setItem(DEFAULT_BOOTSTRAP_KEY, 'true')
  return saveCurrentUser({
    username: DEFAULT_USER.username,
    displayName: DEFAULT_USER.displayName,
    token: `default_${Date.now()}`,
  })
}

export function getUserDisplayName(user) {
  if (!user) return ''
  return user.displayName || user.username || ''
}

export function getAuthChangedEventName() {
  return AUTH_CHANGED_EVENT
}

export function getGuestSessionUser() {
  if (typeof window === 'undefined') return 'guest_preview'
  const existing = String(sessionStorage.getItem(GUEST_SESSION_KEY) || '').trim()
  if (existing) return existing
  const next = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  sessionStorage.setItem(GUEST_SESSION_KEY, next)
  return next
}

function readGuestTrialUsage() {
  if (typeof window === 'undefined') return {}
  return safeJsonParse(sessionStorage.getItem(GUEST_TRIAL_USAGE_KEY), {})
}

function writeGuestTrialUsage(usage) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(GUEST_TRIAL_USAGE_KEY, JSON.stringify(usage))
}

export function getGuestTrialUsage(mode = 'workshop') {
  const normalizedMode = String(mode || '').trim() === 'skill_assistant' ? 'skill_assistant' : 'workshop'
  const usage = readGuestTrialUsage()
  return Number(usage?.[normalizedMode] || 0)
}

export function hasGuestTrialRemaining(mode = 'workshop') {
  return getGuestTrialUsage(mode) < 1
}

export function consumeGuestTrial(mode = 'workshop') {
  const normalizedMode = String(mode || '').trim() === 'skill_assistant' ? 'skill_assistant' : 'workshop'
  const usage = readGuestTrialUsage()
  usage[normalizedMode] = getGuestTrialUsage(normalizedMode) + 1
  writeGuestTrialUsage(usage)
  return usage[normalizedMode]
}

export function clearGuestSessionState() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(GUEST_SESSION_KEY)
  sessionStorage.removeItem(GUEST_TRIAL_USAGE_KEY)
}
