import { request } from './client.js'

export async function sendNewsChatMessage({
  message,
  sessionId = '',
  history = [],
  limit = 6,
  days = null,
  sourceKeys = [],
} = {}) {
  const payload = {
    message: String(message || '').trim(),
    session_id: String(sessionId || '').trim(),
    history: Array.isArray(history) ? history : [],
    limit,
    source_keys: Array.isArray(sourceKeys) ? sourceKeys : [],
  }
  if (days) payload.days = Number(days)

  const { ok, data } = await request('/api/news/chat/message', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!ok || !data?.success) {
    throw new Error(data?.message || '新闻问答失败')
  }
  return data.data
}

export async function searchNewsChat({ query, limit = 8, days = null, sourceKeys = [] } = {}) {
  const payload = {
    query: String(query || '').trim(),
    limit,
    source_keys: Array.isArray(sourceKeys) ? sourceKeys : [],
  }
  if (days) payload.days = Number(days)

  const { ok, data } = await request('/api/news/chat/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!ok || !data?.success) {
    throw new Error(data?.message || '新闻检索失败')
  }
  return data.data
}

export async function getNewsChatSession(sessionId) {
  const id = encodeURIComponent(String(sessionId || '').trim())
  const { ok, data } = await request(`/api/news/chat/session/${id}`)
  if (!ok || !data?.success) {
    throw new Error(data?.message || '读取新闻问答会话失败')
  }
  return data.data
}

export async function listNewsChatSessions(limit = 20) {
  const { ok, data } = await request(`/api/news/chat/sessions?limit=${encodeURIComponent(String(limit))}`)
  if (!ok || !data?.success) {
    throw new Error(data?.message || '读取新闻问答会话列表失败')
  }
  return data.data
}
