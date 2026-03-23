import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // 与 Crawl 默认端口 8000 错开，否则无法同时跑 npm run dev 与本机/容器 Crawl
    port: 5173,
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
      // AI 新闻数据库代理服务（专门转发 SQLite 请求）
      '/api/ranks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/articles': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 登录：与 Crawl 内 rank_api 一致（/api/auth/sessions）
      '/api/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
