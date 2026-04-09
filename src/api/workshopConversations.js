import { request } from './client.js'
import { deleteAgentDoSessionMapping } from './workshop.js'

export async function fetchWorkshopConversations() {
  const { ok, data } = await request('/api/workshop-history/conversations')
  if (!ok || !data?.success) {
    throw new Error(data?.detail || data?.message || 'Failed to fetch workshop conversations')
  }
  return Array.isArray(data.list) ? data.list : []
}

export async function saveWorkshopConversation(conversation) {
  const id = encodeURIComponent(String(conversation?.id || '').trim())
  const { ok, data } = await request(`/api/workshop-history/conversations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(conversation),
  })
  if (!ok || !data?.success) {
    throw new Error(data?.detail || data?.message || 'Failed to save workshop conversation')
  }
  return data.data
}

export async function deleteWorkshopConversation(conversationId) {
  const id = encodeURIComponent(String(conversationId || '').trim())
  const { ok, data } = await request(`/api/workshop-history/conversations/${id}`, {
    method: 'DELETE',
  })
  if (!ok || !data?.success) {
    throw new Error(data?.detail || data?.message || 'Failed to delete workshop conversation')
  }
  return {
    deleted: Boolean(data?.deleted),
    conversationId: String(data?.conversationId || conversationId || ''),
  }
}

export async function deleteWorkshopConversationDeep({ username, conversationId }) {
  const normalizedUsername = String(username || '').trim()
  const normalizedConversationId = String(conversationId || '').trim()
  if (!normalizedUsername || !normalizedConversationId) {
    throw new Error('Missing required parameters for conversation delete')
  }

  const history = await deleteWorkshopConversation(normalizedConversationId)
  const mapping = await deleteAgentDoSessionMapping({
    username: normalizedUsername,
    conversationId: normalizedConversationId,
  })

  return {
    history,
    mapping,
  }
}
