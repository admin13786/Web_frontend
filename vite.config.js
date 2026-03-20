import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8000,
    proxy: {
      // 避免浏览器跨域：让前端把请求转发给 OpenMAIC
      // 前端只需要配置 VITE_OPENMAIC_BASE_URL=/openmaic
      '/openmaic': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openmaic/, ''),
      },
      // 新增：url-generate 后端代理（须放在通用 /api 之前，避免被抢）
      '/api/workshop': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/workshop/, ''),
      },
      // AI 新闻服务：排行榜 + 登录（与 Crawl/run_local 或 backend run_local 同源）
      '/api/ranks': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
})
