import { API_BASE } from '../config.js'

const EDU_REPO_API_PREFIX = '/api/edu'

function toUrl(path, params = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return
    query.set(key, String(value))
  })
  const qs = query.toString()
  const merged = `${API_BASE || ''}${normalizedPath}`
  return qs ? `${merged}?${qs}` : merged
}

function toErrorMessage(payload, status) {
  if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message.trim()
  if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail.trim()
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error.trim()
  return `HTTP ${status}`
}

async function eduRequest(path, options = {}) {
  const {
    method = 'GET',
    params = {},
    body,
    timeoutMs = 18000,
    retries = 0,
    headers = {},
  } = options

  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const hasBody = body !== undefined && body !== null
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
      const requestHeaders = {
        Accept: 'application/json',
        ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      }

      const response = await fetch(toUrl(path, params), {
        method,
        headers: requestHeaders,
        body: hasBody && !isFormData ? JSON.stringify(body) : body,
        signal: controller.signal,
      })

      clearTimeout(timer)

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      if (isJson) {
        let payload = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        if (!response.ok) {
          throw new Error(toErrorMessage(payload, response.status))
        }

        return payload
      }

      const text = await response.text().catch(() => '')
      if (!response.ok) {
        const brief = text ? `: ${text.slice(0, 180)}` : ''
        throw new Error(`HTTP ${response.status}${brief}`)
      }

      return { success: true, text }
    } catch (error) {
      clearTimeout(timer)

      const isAbort = error?.name === 'AbortError'
      const isNetwork = error instanceof TypeError
      const retryable = isAbort || isNetwork

      lastError = isAbort ? new Error('请求超时，请稍后重试') : error

      if (attempt >= retries || !retryable) break
    }
  }

  throw lastError || new Error('请求失败')
}

export function getEduFeed({
  limit = 40,
  board = 'all',
  q = '',
  minScore = 1.4,
  timeoutMs = 18000,
} = {}) {
  return eduRequest(`${EDU_REPO_API_PREFIX}/feed`, {
    params: { limit, board, q, minScore },
    timeoutMs,
    retries: 1,
  })
}

export function getEduStats({ timeoutMs = 8000 } = {}) {
  return eduRequest(`${EDU_REPO_API_PREFIX}/stats`, {
    timeoutMs,
    retries: 1,
  })
}

export function postEduBackfill({
  limit = 20,
  board = 'all',
  q = '',
  minScore = 1.2,
  asyncMode = 1,
  timeoutMs = 30000,
} = {}) {
  return eduRequest(`${EDU_REPO_API_PREFIX}/backfill`, {
    method: 'POST',
    params: { limit, board, q, minScore, asyncMode },
    timeoutMs,
  })
}

export function postEduProcess({
  limit = 20,
  board = 'all',
  asyncMode = 1,
  timeoutMs = 30000,
} = {}) {
  return eduRequest(`${EDU_REPO_API_PREFIX}/process`, {
    method: 'POST',
    params: { limit, board, asyncMode },
    timeoutMs,
  })
}

export function getEduItem(newsId, { timeoutMs = 18000 } = {}) {
  return eduRequest(`${EDU_REPO_API_PREFIX}/items/${encodeURIComponent(String(newsId || '').trim())}`, {
    timeoutMs,
  })
}

export function buildEduCoverUrl({
  templateId = 't1',
  title = '',
  highlights = [],
  size = '3x4',
} = {}) {
  const list = Array.isArray(highlights) ? highlights : []
  return toUrl(`${EDU_REPO_API_PREFIX}/cover.png`, {
    templateId,
    title,
    highlights: list.filter(Boolean).slice(0, 3).join(','),
    size,
  })
}
