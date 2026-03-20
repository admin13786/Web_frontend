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
    },
  },
})
