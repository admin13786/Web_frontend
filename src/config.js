/**
 * 前端运行配置
 * API 基地址：通过环境变量 VITE_API_BASE 配置，未配置时为空（同源）
 * 未配置 VITE_API_BASE 时默认使用 Mock 数据，便于无后端时本地运行
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (import.meta.env.VITE_USE_MOCK !== 'false' && !import.meta.env.VITE_API_BASE)

/** 认证默认走真实后端；仅在显式设置 VITE_AUTH_USE_MOCK=true 时才使用 Mock。 */
export const USE_AUTH_MOCK = import.meta.env.VITE_AUTH_USE_MOCK === 'true'

/** 视频榜默认 Mock；仅 VITE_RANK_VIDEO_MOCK=false 时请求 /api/ranks/.../video */
export const USE_RANK_VIDEO_MOCK = import.meta.env.VITE_RANK_VIDEO_MOCK !== 'false'

/** 微博/话题榜：与通用 USE_MOCK 解耦，默认走真实接口（仅 VITE_RANK_WEIBO_MOCK=true 时用 Mock） */
export const USE_RANK_WEIBO_MOCK = import.meta.env.VITE_RANK_WEIBO_MOCK === 'true'

// OpenMAIC 服务基地址，用于调用：
// POST {OPENMAIC_BASE_URL}/api/generate-classroom
// GET  {OPENMAIC_BASE_URL}/api/generate-classroom/:jobId
// 例如：http://localhost:3000 ；经 Vite 代理时可填 /openmaic
export const OPENMAIC_BASE_URL = import.meta.env.VITE_OPENMAIC_BASE_URL ?? ''
export const OPENMAIC_PORT = String(import.meta.env.VITE_OPENMAIC_PORT || '3000').trim()

/**
 * 浏览器整页跳转到 OpenMAIC（Next）时的根地址。
 * 当 OPENMAIC_BASE_URL 为相对路径 /openmaic 时，只用于同源 fetch 代理，整页仍需指向 Next 实际端口。
 */
export const OPENMAIC_APP_URL = import.meta.env.VITE_OPENMAIC_APP_URL ?? ''
export const EDUREPO_APP_URL = import.meta.env.VITE_EDUREPO_APP_URL ?? ''
export const MONITOR_APP_URL = import.meta.env.VITE_MONITOR_APP_URL ?? ''
export const ANDROID_APK_URL = String(
  import.meta.env.VITE_ANDROID_APK_URL ?? '/downloads/lingjing-android-latest.apk',
).trim()
export const EDUREPO_VIEW_MODE = String(import.meta.env.VITE_EDUREPO_VIEW_MODE ?? 'native')
  .trim()
  .toLowerCase()

export function getOpenMAICAppUrl() {
  const explicit = String(OPENMAIC_APP_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const base = String(OPENMAIC_BASE_URL || '').trim()
  if (/^https?:\/\//i.test(base)) return base.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${OPENMAIC_PORT || '3000'}`
  }
  return `http://localhost:${OPENMAIC_PORT || '3000'}`
}

export function getEduRepoAppUrl() {
  const explicit = String(EDUREPO_APP_URL || '').trim()
  if (explicit) return explicit.endsWith('/') ? explicit : `${explicit}/`
  // Native mode uses same-origin /api/edu and does not rely on this URL.
  // Keep this fallback for one release cycle to support embed rollback.
  return '/edurepo/'
}

export function getMonitorAppUrl() {
  const explicit = String(MONITOR_APP_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:6670`
  }
  return 'http://localhost:6670'
}

export function isEduRepoEmbedMode() {
  return EDUREPO_VIEW_MODE === 'embed'
}

/**
 * 在浏览器中打开此 URL：会请求 OpenMAIC 的 dialog-prefill，由服务端 Set-Cookie 并 302 到首页 ?prefill=…
 * @param {string} baseUrl OPENMAIC_BASE_URL，已去尾部 /
 * @param {string} title 填入课堂/首页输入框的文案（一般为新闻标题）
 */
export function buildOpenMAICDialogPrefillHomeUrl(baseUrl, title) {
  const base = String(baseUrl || '').replace(/\/$/, '') || ''
  const q = new URLSearchParams({ title, to: 'home' })
  return `${base}/api/dialog-prefill?${q.toString()}`
}
