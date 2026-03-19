import { API_BASE } from '../config.js'

/**
 * 统一请求封装
 * @param {string} path - 接口路径（如 '/api/auth/sessions'）
 * @param {RequestInit} [options] - fetch 选项
 * @returns {Promise<{ data: any, ok: boolean }>}
 */
export async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const contentType = res.headers.get('content-type')
  let data = null
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }
  return { ok: res.ok, status: res.status, data }
}

/**
 * 从 localStorage 读取 token（用于需要认证的请求）
 */
export function getAuthToken() {
  return localStorage.getItem('token')
}
