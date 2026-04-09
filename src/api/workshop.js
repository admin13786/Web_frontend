/**
 * Workshop API
 */

const API_BASE = import.meta.env.VITE_WORKSHOP_API_URL || '/api/workshop'

function getApiOrigin() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function toAbsoluteApiUrl(pathname) {
  return `${getApiOrigin()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
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
      return parsed.toString()
    }
    if (parsed.pathname.startsWith(previewPrefix)) {
      return parsed.toString()
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
 * @typedef {{ kind: 'friendly' | 'html', content: string }} WorkshopStreamPart
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

export async function* streamGenerate(context, systemPrompt) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ context, system_prompt: systemPrompt }),
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

  return data
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
