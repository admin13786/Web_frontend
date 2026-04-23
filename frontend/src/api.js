import { API_BASE } from './config.js'

export async function apiGet(path) {
  const url = path.startsWith('http') ? path : `${API_BASE || ''}${path}`
  console.log('API请求URL:', url)
  let res
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    const baseHint =
      API_BASE === ''
        ? 'VITE_API_BASE 为空：将使用 Vite dev proxy（检查 frontend/vite.config.js 的 proxy target，并确认后端已启动）。'
        : `当前 API_BASE=${API_BASE || '(empty)'}（确认后端可访问：${API_BASE || ''}/health）。`
    throw new Error(
      `无法连接后端：${err?.message || err}\n请求：${url}\n提示：EduRepo Backend 默认端口是 9010（不要和 Crawl 的 8000 搞混）。${baseHint}`,
    )
  }
  const ct = res.headers.get('content-type') || ''

  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '')
    throw new Error(`API 请求未返回 JSON (status=${res.status}, content-type=${ct}): ${text.slice(0, 200)}`)
  }

  const data = await res.json().catch((err) => {
    throw new Error(`解析 API JSON 失败: ${err?.message || err}`)
  })

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export function buildFeedUrl({ limit = 40, board = 'all', q = '', minScore = 2.2 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', String(limit))
  qs.set('board', String(board || 'all'))
  if (q) qs.set('q', String(q))
  qs.set('minScore', String(minScore))
  return `/api/edu/feed?${qs.toString()}`
}

export function buildItemUrl(newsId) {
  return `/api/edu/items/${encodeURIComponent(String(newsId || '').trim())}`
}
