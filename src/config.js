/**
 * 前端运行配置
 * API 基地址：通过环境变量 VITE_API_BASE 配置，未配置时为空（同源）
 * 未配置 VITE_API_BASE 时默认使用 Mock 数据，便于无后端时本地运行
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (import.meta.env.VITE_USE_MOCK !== 'false' && !import.meta.env.VITE_API_BASE)
