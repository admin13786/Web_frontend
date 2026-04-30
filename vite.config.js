import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 服务器部署说明：
// 1. 开发环境：OpenMAIC 页面路由由 Vue 接管，iframe 直连 3000
// 2. 生产环境：
//    - 方案A：修改 .env.production 中的 VITE_OPENMAIC_BASE_URL 为服务器地址
//    - 方案B：使用 Nginx 反向代理 OpenMAIC API 到 http://localhost:3000
//    - OpenMAIC 已添加 CORS 支持，允许跨域访问

export default defineConfig({
  plugins: [vue()],
  server: {
    // 与 Crawl 默认端口 8000 错开，否则无法同时跑 npm run dev 与本机/容器 Crawl
    port: 5173,
    proxy: {
      // 必须放在 /api/workshop 之前，否则 /api/workshop-history 会被错误命中成 Workshop 服务
      '/api/workshop-history': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Workshop 后端代理
      '/api/workshop': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/workshop/, ''),
      },
      // AI 新闻榜单代理服务（直接走 Crawl API）
      '/api/ranks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/articles': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/news': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/page-screenshot': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/page-screenshot.png': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/og-image': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 登录认证
      '/api/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // EduRepo 后端代理
      '/api/analytics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/edu': {
        target: 'http://localhost:9010',
        changeOrigin: true,
      },
    },
  },
})
