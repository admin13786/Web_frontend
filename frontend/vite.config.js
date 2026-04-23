import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = String(env.VITE_PUBLIC_BASE || '/').trim() || '/'
  // Dev-only proxy (optional): forward /api/* to EduRepo backend.
  // If you set VITE_API_BASE to a full URL, the app will call it directly and proxy is not used.
  const target = (env.VITE_API_PROXY_TARGET || env.VITE_API_BASE || 'http://localhost:9010').replace(/\/$/, '')

  return {
    base,
    server: {
      port: 5188,
      proxy: {
        // Optional: for cases where API_BASE is empty and you still want to use relative /api paths.
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
