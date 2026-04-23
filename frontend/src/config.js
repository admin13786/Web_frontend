function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

const env = import.meta.env || {}
const isDev = Boolean(env.DEV)
const hasViteApiBase = Object.prototype.hasOwnProperty.call(env, 'VITE_API_BASE')
const fromVite = hasViteApiBase ? env.VITE_API_BASE : undefined

const fromWindow =
  typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, '__EDU_API_BASE__')
    ? window.__EDU_API_BASE__
    : undefined

// Dev fallback points to EduRepo backend (not Crawl).
// Prefer leaving VITE_API_BASE empty to use relative "/api/*" + Vite proxy.
const localFallback = isDev ? 'http://localhost:9010' : ''

export const API_BASE = firstDefined(fromVite, fromWindow, localFallback)
