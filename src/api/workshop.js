/**
 * Workshop API
 */

import { getAuthToken } from './client.js'

const API_BASE = import.meta.env.VITE_WORKSHOP_API_URL || '/api/workshop'

function buildWorkshopHeaders(headersInit = {}) {
  const headers = new Headers(headersInit || {})
  const token = getAuthToken()
  if (token) headers.set('Authorization', 'Bearer ' + token)
  return headers
}

const nativeFetch = globalThis.fetch.bind(globalThis)

function fetch(input, options = {}) {
  return nativeFetch(input, {
    ...options,
    headers: buildWorkshopHeaders(options.headers),
  })
}

function getApiOrigin() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function toAbsoluteApiUrl(pathname) {
  return `${getApiOrigin()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

function getApiTargetOrigin() {
  if (API_BASE.startsWith('http')) {
    try {
      return new URL(API_BASE).origin
    } catch {
      return getApiOrigin()
    }
  }
  return getApiOrigin()
}

function buildPreviewUrl(pathname, search = '', hash = '') {
  return `${getApiTargetOrigin()}${pathname}${search}${hash}`
}

async function workshopJsonRequest(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: buildWorkshopHeaders({
      Accept: 'application/json',
      ...options.headers,
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return data
}


export function normalizeWorkshopPreviewUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const apiBasePath = API_BASE.startsWith('http')
    ? new URL(API_BASE).pathname.replace(/\/$/, '')
    : API_BASE.replace(/\/$/, '')
  const previewPrefix = `${apiBasePath}/agent-do/preview/`

  try {
    const parsed = new URL(url, getApiOrigin() || 'http://localhost')
    if (parsed.pathname.startsWith('/agent-do/preview/')) {
      parsed.pathname = `${apiBasePath}${parsed.pathname}`
      return buildPreviewUrl(parsed.pathname, parsed.search, parsed.hash)
    }
    if (parsed.pathname.startsWith(previewPrefix)) {
      return buildPreviewUrl(parsed.pathname, parsed.search, parsed.hash)
    }
    if (!/^https?:/i.test(url) && url.startsWith(previewPrefix)) {
      return toAbsoluteApiUrl(url)
    }
    return parsed.toString()
  } catch {
    if (url.startsWith('/agent-do/preview/')) {
      return toAbsoluteApiUrl(`${apiBasePath}${url}`)
    }
    if (url.startsWith(previewPrefix)) {
      return toAbsoluteApiUrl(url)
    }
    return url
  }
}

/**
 * @typedef {{ kind: 'friendly' | 'html', content: string } | { kind: 'event', event: Record<string, any> }} WorkshopStreamPart
 */

async function* parseSseWorkshopStream(response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('响应体不可读')

  const decoder = new TextDecoder()
  let buffer = ''

  function* yieldFromDataLine(trimmed) {
    if (!trimmed.startsWith('data')) return
    const colon = trimmed.indexOf(':')
    if (colon < 0) return
    const raw = trimmed.slice(colon + 1).trimStart()
    if (!raw || raw === '[DONE]') return
    let msg
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }
    const content = msg.content
    if (msg.type === 'error') {
      throw new Error(
        (typeof content === 'string' && content)
        || (typeof msg.message === 'string' && msg.message)
        || '请求失败',
      )
    }
    if (['meta', 'status', 'tool', 'ping', 'done'].includes(msg.type)) {
      yield { kind: 'event', event: msg }
      return
    }
    if (typeof content !== 'string' || !content) return
    if (msg.type === 'friendly') {
      yield { kind: 'friendly', content }
    }
    if (msg.type === 'text') {
      yield { kind: 'html', content }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })

    if (done) {
      const lines = buffer.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trimEnd()
        if (!trimmed) continue
        yield* yieldFromDataLine(trimmed)
      }
      break
    }

    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trimEnd()
      if (!trimmed) continue
      yield* yieldFromDataLine(trimmed)
    }
  }
}

async function* parseJsonSseStream(response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('响应体不可读')

  const decoder = new TextDecoder()
  let buffer = ''

  function* yieldFromDataLine(trimmed) {
    if (!trimmed.startsWith('data')) return
    const colon = trimmed.indexOf(':')
    if (colon < 0) return
    const raw = trimmed.slice(colon + 1).trimStart()
    if (!raw || raw === '[DONE]') return
    try {
      yield JSON.parse(raw)
    } catch {
      /* ignore malformed chunks */
    }
  }

  while (true) {
    let chunk
    try {
      chunk = await reader.read()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        message && !/network error/i.test(message)
          ? `流式连接中断：${message}`
          : '流式连接中断，后端可能在处理中途异常退出',
      )
    }
    const { done, value } = chunk
    if (value) buffer += decoder.decode(value, { stream: true })

    if (done) {
      const lines = buffer.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trimEnd()
        if (!trimmed) continue
        yield* yieldFromDataLine(trimmed)
      }
      break
    }

    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trimEnd()
      if (!trimmed) continue
      yield* yieldFromDataLine(trimmed)
    }
  }
}

export async function* streamGenerate(context, systemPrompt, payload = {}) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      context,
      system_prompt: systemPrompt,
      conversation_id: payload.conversationId || '',
      username: payload.username || 'workshop_guest',
      title: payload.title || '',
      manual_skill_ids: Array.isArray(payload.manualSkillIds) ? payload.manualSkillIds : [],
      auto_resolve_skills: payload.autoResolveSkills !== false,
      skill_mode: payload.skillMode || 'skill_assistant',
      max_skill_count: Number(payload.maxSkillCount || 3),
    }),
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const err = await response.json()
      if (typeof err.detail === 'string') detail = err.detail
      else if (err.detail != null) detail = JSON.stringify(err.detail)
      else if (err.error) detail = err.error
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  yield* parseSseWorkshopStream(response)
}

export async function* streamGenerateText(context, systemPrompt, payload = {}) {
  const response = await fetch(`${API_BASE}/generate-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      context,
      system_prompt: systemPrompt,
      conversation_id: payload.conversationId || '',
      username: payload.username || 'workshop_guest',
      title: payload.title || '',
      manual_skill_ids: Array.isArray(payload.manualSkillIds) ? payload.manualSkillIds : [],
      auto_resolve_skills: payload.autoResolveSkills !== false,
      skill_mode: payload.skillMode || 'skill_assistant',
      max_skill_count: Number(payload.maxSkillCount || 3),
    }),
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const err = await response.json()
      if (typeof err.detail === 'string') detail = err.detail
      else if (err.detail != null) detail = JSON.stringify(err.detail)
      else if (err.error) detail = err.error
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  yield* parseSseWorkshopStream(response)
}

export async function generatePreviewWithAgentDo(payload) {
  const response = await fetch(`${API_BASE}/agent-do/generate-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      context: payload.context,
      system_prompt: payload.systemPrompt,
      conversation_id: payload.conversationId,
      username: payload.username,
      title: payload.title,
      generation_mode: payload.generationMode,
      manual_skill_ids: Array.isArray(payload.manualSkillIds) ? payload.manualSkillIds : [],
      auto_resolve_skills: payload.autoResolveSkills !== false,
      skill_mode: payload.skillMode || 'workshop',
      max_skill_count: Number(payload.maxSkillCount || 3),
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }
  if (!data?.url) {
    throw new Error('Agent-Do did not return preview url')
  }

  data.url = normalizeWorkshopPreviewUrl(data.url)

  return data
}

export async function* streamPreviewWithAgentDo(payload) {
  const response = await fetch(`${API_BASE}/agent-do/generate-preview/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      context: payload.context,
      system_prompt: payload.systemPrompt,
      conversation_id: payload.conversationId,
      username: payload.username,
      title: payload.title,
      generation_mode: payload.generationMode,
      manual_skill_ids: Array.isArray(payload.manualSkillIds) ? payload.manualSkillIds : [],
      auto_resolve_skills: payload.autoResolveSkills !== false,
      skill_mode: payload.skillMode || 'workshop',
      max_skill_count: Number(payload.maxSkillCount || 3),
    }),
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const err = await response.json()
      if (typeof err.detail === 'string') detail = err.detail
      else if (err.detail != null) detail = JSON.stringify(err.detail)
      else if (err.error) detail = err.error
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  for await (const item of parseJsonSseStream(response)) {
    if (item?.type === 'result' && item.url) {
      item.url = normalizeWorkshopPreviewUrl(item.url)
    }
    yield item
  }
}

function extractApiErrorMessage(data, fallbackStatus) {
  if (!data) return `HTTP ${fallbackStatus}`
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0]
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg
    return JSON.stringify(first)
  }
  if (data.detail && typeof data.detail === 'object') {
    if (typeof data.detail.msg === 'string' && data.detail.msg.trim()) return data.detail.msg
    return JSON.stringify(data.detail)
  }
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  return `HTTP ${fallbackStatus}`
}

function normalizeAgentDoSessionMapping(data, fallback = {}) {
  return {
    ...(data || {}),
    username: String(data?.username ?? fallback.username ?? ''),
    conversationId: String(
      data?.conversationId
      ?? data?.conversation_id
      ?? fallback.conversationId
      ?? fallback.conversation_id
      ?? '',
    ),
    agentDoSessionId: String(
      data?.agentDoSessionId
      ?? data?.agentdo_session_id
      ?? fallback.agentDoSessionId
      ?? fallback.agentdo_session_id
      ?? '',
    ),
    workspacePath: String(
      data?.workspacePath
      ?? data?.workspace_path
      ?? fallback.workspacePath
      ?? fallback.workspace_path
      ?? '',
    ),
  }
}

export async function restoreAgentDoSessionMapping(payload) {
  const response = await fetch(`${API_BASE}/agent-do/session-mapping/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username: payload.username,
      conversation_id: payload.conversationId,
      agentdo_session_id: payload.agentDoSessionId,
      workspace_path: payload.workspacePath || '',
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return normalizeAgentDoSessionMapping(data, payload)
}

export async function ensureAgentDoSessionMapping(payload) {
  const response = await fetch(`${API_BASE}/agent-do/session-mapping/ensure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username: payload.username,
      conversation_id: payload.conversationId,
      title: payload.title || '',
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return normalizeAgentDoSessionMapping(data, payload)
}

export async function deleteAgentDoSessionMapping({ username, conversationId }) {
  const response = await fetch(
    `${API_BASE}/agent-do/session-mapping/${encodeURIComponent(username)}/${encodeURIComponent(conversationId)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return normalizeAgentDoSessionMapping(data, {
    username,
    conversationId,
    deleted: Boolean(data?.deleted),
  })
}

export async function fetchAgentDoConversationTokenUsage({ username, conversationId }) {
  try {
    return await workshopJsonRequest(
      '/agent-do/tokens/conversation/' + encodeURIComponent(username) + '/' + encodeURIComponent(conversationId)
    )
  } catch (error) {
    if (
      String(error?.message || '').includes('Conversation mapping not found')
      || String(error?.message || '').includes('HTTP 404')
    ) {
      return {
        username,
        conversationId,
        agentDoSessionId: '',
        workspacePath: '',
        tokenUsage: {
          session_id: '',
          user_id: username,
          title: '',
          run_count: 0,
          total_tokens: 0,
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          first_recorded_at: null,
          last_recorded_at: null,
          items: [],
        },
      }
    }
    throw error
  }
}

export async function fetchAgentDoUserTokenUsage(username) {
  try {
    return await workshopJsonRequest('/agent-do/tokens/user/' + encodeURIComponent(username))
  } catch (error) {
    if (
      String(error?.message || '').includes('HTTP 404')
      || String(error?.message || '').includes('user_id is required')
    ) {
      return {
        username,
        tokenUsage: {
          user_id: username,
          run_count: 0,
          session_count: 0,
          total_tokens: 0,
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          first_recorded_at: null,
          last_recorded_at: null,
          sessions: [],
        },
      }
    }
    throw error
  }
}

/* [容器池功能暂时禁用]
export async function fetchAgentDoSandboxPool() {
  const response = await fetch(`${API_BASE}/agent-do/sandbox-pool`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return {
    runtimeRoot: String(data?.runtimeRoot || ''),
    activeCount: Number(data?.activeCount || 0),
    maxContainers: Number(data?.maxContainers || 0),
    idleTtlMs: Number(data?.idleTtlMs || 0),
    activeSandboxes: Array.isArray(data?.activeSandboxes) ? data.activeSandboxes : [],
    reclaimedSandboxes: Array.isArray(data?.reclaimedSandboxes) ? data.reclaimedSandboxes : [],
  }
}
*/

export async function fetchAgentDoWorkspaceTree({ username, conversationId }) {
  const response = await fetch(
    `${API_BASE}/agent-do/files/${encodeURIComponent(username)}/${encodeURIComponent(conversationId)}/tree`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return data
}

export async function fetchAgentDoWorkspaceFile({ username, conversationId, path }) {
  const query = new URLSearchParams({ path: path || '' })
  const response = await fetch(
    `${API_BASE}/agent-do/files/${encodeURIComponent(username)}/${encodeURIComponent(conversationId)}/content?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `HTTP ${response.status}`)
  }

  return data
}

export function getAgentDoWorkspaceDownloadUrl({ username, conversationId, path }) {
  const query = new URLSearchParams({ path: path || '' })
  return `${API_BASE}/agent-do/files/${encodeURIComponent(username)}/${encodeURIComponent(conversationId)}/download?${query.toString()}`
}

export async function uploadConversationFiles({ username, conversationId, title = '' }, files = []) {
  const normalizedUsername = String(username || '').trim()
  const normalizedConversationId = String(conversationId || '').trim()
  const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : []

  if (!normalizedUsername || !normalizedConversationId) {
    throw new Error('缺少会话信息，无法上传附件')
  }
  if (!normalizedFiles.length) {
    throw new Error('请选择至少一个文件')
  }

  const formData = new FormData()
  if (title) {
    formData.append('title', title)
  }
  for (const file of normalizedFiles) {
    formData.append('files', file)
  }

  const response = await fetch(
    `${API_BASE}/agent-do/files/${encodeURIComponent(normalizedUsername)}/${encodeURIComponent(normalizedConversationId)}/upload`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data
}

export async function uploadSkillAssistantFiles(session, files = []) {
  return uploadConversationFiles(session, files)
}

export async function fetchWorkshopSkills({
  page = 1,
  pageSize = 100,
  keyword = '',
  isActive = undefined,
  includeDeleted = false,
} = {}) {
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('page_size', String(pageSize))
  if (keyword) query.set('keyword', keyword)
  if (typeof isActive === 'boolean') query.set('is_active', String(isActive))
  if (includeDeleted) query.set('include_deleted', 'true')

  const response = await fetch(`${API_BASE}/skills?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || { items: [], total: 0, page, page_size: pageSize }
}

export async function fetchWorkshopSkillDetail(skillId) {
  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function fetchWorkshopSkillVersion(skillId, version) {
  const response = await fetch(
    `${API_BASE}/skills/${encodeURIComponent(skillId)}/versions/${encodeURIComponent(version)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  )

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function createWorkshopSkill(payload) {
  const response = await fetch(`${API_BASE}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      version: payload.version,
      markdown: payload.markdown,
      changelog: payload.changelog || '',
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function createWorkshopSkillFromZip(payload, zipFile) {
  const formData = new FormData()
  formData.append('name', payload.name || '')
  formData.append('slug', payload.slug || '')
  formData.append('description', payload.description || '')
  formData.append('version', payload.version || '')
  formData.append('changelog', payload.changelog || '')
  formData.append('file', zipFile)

  const response = await fetch(`${API_BASE}/skills/upload-zip`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function fetchWorkshopLocalZipFiles() {
  const response = await fetch(`${API_BASE}/skills/local-zips`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || { root_dir: '', items: [] }
}

export async function createWorkshopSkillFromLocalZip(payload) {
  const response = await fetch(`${API_BASE}/skills/upload-local-zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      filename: payload.filename,
      name: payload.name,
      slug: payload.slug || '',
      description: payload.description || '',
      version: payload.version,
      changelog: payload.changelog || '',
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function patchWorkshopSkillStatus(skillId, isActive) {
  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ is_active: Boolean(isActive) }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function patchWorkshopSkillMeta(skillId, payload = {}) {
  const body = {}
  if (Object.prototype.hasOwnProperty.call(payload, 'name')) body.name = payload.name
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) body.description = payload.description

  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function patchWorkshopSkillRouting(skillId, payload = {}) {
  const body = {}
  if (Object.prototype.hasOwnProperty.call(payload, 'priority')) body.priority = payload.priority
  if (Object.prototype.hasOwnProperty.call(payload, 'routing_tags')) body.routing_tags = payload.routing_tags
  if (Object.prototype.hasOwnProperty.call(payload, 'trigger_keywords')) body.trigger_keywords = payload.trigger_keywords
  if (Object.prototype.hasOwnProperty.call(payload, 'exclude_keywords')) body.exclude_keywords = payload.exclude_keywords
  if (Object.prototype.hasOwnProperty.call(payload, 'mode_scope')) body.mode_scope = payload.mode_scope

  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}/routing`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function resolveWorkshopSkills(payload = {}) {
  const response = await fetch(`${API_BASE}/skills/resolve/selection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      input: String(payload.input || ''),
      mode: String(payload.mode || 'skill_assistant'),
      manual_skill_ids: Array.isArray(payload.manualSkillIds) ? payload.manualSkillIds : [],
      max_count: Number(payload.maxCount || 3),
    }),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function deleteWorkshopSkill(skillId) {
  const response = await fetch(`${API_BASE}/skills/${encodeURIComponent(skillId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, response.status))
  }

  return data?.data || null
}

export async function uploadHTML(fileName, htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const formData = new FormData()
  formData.append('file', blob, fileName)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return response.json()
}
