const STORAGE_KEY = 'workshop_conversations_v1'
const TRANSIENT_STORAGE_KEY = 'workshop_conversations_transient_v1'

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function readStore(storageKey = STORAGE_KEY, storage = localStorage) {
  if (typeof window === 'undefined') return {}
  return safeJsonParse(storage.getItem(storageKey), {})
}

function writeStore(store, storageKey = STORAGE_KEY, storage = localStorage) {
  if (typeof window === 'undefined') return
  storage.setItem(storageKey, JSON.stringify(store))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createConversationId() {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyConversation(title = '新对话', mode = 'workshop') {
  const conversationMode = String(mode || '').trim() === 'skill_assistant' ? 'skill_assistant' : 'workshop'
  const now = new Date().toISOString()
  return {
    id: createConversationId(),
    title,
    conversationMode,
    orderIndex: null,
    createdAt: now,
    updatedAt: now,
    messages: [],
    selectedSkills: [],
    preview: {
      mode: 'empty',
      html: '',
      url: '',
      code: { lang: '', content: '' },
    },
  }
}

export function getWorkshopState(username) {
  if (!username) return { conversations: [], currentConversationId: '' }
  const store = readStore()
  const userState = store[username]
  if (!userState) return { conversations: [], currentConversationId: '' }
  return {
    conversations: Array.isArray(userState.conversations) ? clone(userState.conversations) : [],
    currentConversationId: String(userState.currentConversationId || ''),
  }
}

export function saveWorkshopState(username, state) {
  if (!username) return
  const store = readStore()
  store[username] = {
    conversations: clone(Array.isArray(state?.conversations) ? state.conversations : []),
    currentConversationId: String(state?.currentConversationId || ''),
  }
  writeStore(store)
}

export function getTransientWorkshopState(username) {
  if (!username || typeof window === 'undefined') return { conversations: [], currentConversationId: '' }
  const store = readStore(TRANSIENT_STORAGE_KEY, sessionStorage)
  const userState = store[username]
  if (!userState) return { conversations: [], currentConversationId: '' }
  return {
    conversations: Array.isArray(userState.conversations) ? clone(userState.conversations) : [],
    currentConversationId: String(userState.currentConversationId || ''),
  }
}

export function saveTransientWorkshopState(username, state) {
  if (!username || typeof window === 'undefined') return
  const store = readStore(TRANSIENT_STORAGE_KEY, sessionStorage)
  store[username] = {
    conversations: clone(Array.isArray(state?.conversations) ? state.conversations : []),
    currentConversationId: String(state?.currentConversationId || ''),
  }
  writeStore(store, TRANSIENT_STORAGE_KEY, sessionStorage)
}

export function removeWorkshopConversationState(username, conversationId, nextConversationId = '') {
  const normalizedUsername = String(username || '').trim()
  const normalizedConversationId = String(conversationId || '').trim()
  if (!normalizedUsername || !normalizedConversationId) return

  const store = readStore()
  const userState = store[normalizedUsername]
  if (!userState) return

  const conversations = Array.isArray(userState.conversations)
    ? userState.conversations.filter((item) => String(item?.id || '').trim() !== normalizedConversationId)
    : []
  const currentConversationId = String(userState.currentConversationId || '').trim()

  store[normalizedUsername] = {
    conversations,
    currentConversationId:
      currentConversationId === normalizedConversationId
        ? String(nextConversationId || conversations[0]?.id || '')
        : currentConversationId,
  }
  writeStore(store)
}

export function removeTransientWorkshopConversationState(username, conversationId, nextConversationId = '') {
  const normalizedUsername = String(username || '').trim()
  const normalizedConversationId = String(conversationId || '').trim()
  if (!normalizedUsername || !normalizedConversationId || typeof window === 'undefined') return

  const store = readStore(TRANSIENT_STORAGE_KEY, sessionStorage)
  const userState = store[normalizedUsername]
  if (!userState) return

  const conversations = Array.isArray(userState.conversations)
    ? userState.conversations.filter((item) => String(item?.id || '').trim() !== normalizedConversationId)
    : []
  const currentConversationId = String(userState.currentConversationId || '').trim()

  store[normalizedUsername] = {
    conversations,
    currentConversationId:
      currentConversationId === normalizedConversationId
        ? String(nextConversationId || conversations[0]?.id || '')
        : currentConversationId,
  }
  writeStore(store, TRANSIENT_STORAGE_KEY, sessionStorage)
}

export function clearTransientWorkshopState(username) {
  const normalizedUsername = String(username || '').trim()
  if (!normalizedUsername || typeof window === 'undefined') return
  const store = readStore(TRANSIENT_STORAGE_KEY, sessionStorage)
  if (!(normalizedUsername in store)) return
  delete store[normalizedUsername]
  writeStore(store, TRANSIENT_STORAGE_KEY, sessionStorage)
}
