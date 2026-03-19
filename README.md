# Vue 工字型交互仪表盘

基于手绘原型构建的响应式 Vue 前端应用，包含登录、工字型主页与频道排行榜。

## 功能

- **登录页**：居中卡片，用户名/密码输入，登录按钮
- **工字型主页**：Workshop（顶）、Channel（左）、Remain（右）三块卡片布局
- **频道排行榜**：左侧排名、中间视频列表、右侧统计数据，支持响应式

## 技术栈

- Vue 3 + JavaScript
- Vue Router
- @vueuse/motion（页面与组件动画）
- Vite

## 启动

```bash
npm install
npm run dev
```

访问 http://localhost:8000

## Docker 部署到服务器

**服务器上需要安装的只有 Docker**，无需单独安装 Node、Nginx 或其它库；镜像内已包含构建与运行所需环境。

1. **构建镜像**（如需指定后端 API 地址，可传构建参数）：
   ```bash
   docker build -t vue-dashboard-app .
   # 指定后端 API 再构建示例：
   # docker build --build-arg VITE_API_BASE=https://api.example.com --build-arg VITE_USE_MOCK=false -t vue-dashboard-app .
   ```

2. **运行容器**：
   ```bash
   docker run -d -p 80:80 --name vue-dashboard vue-dashboard-app
   ```

3. 浏览器访问服务器 `http://<服务器IP>` 即可。前端会按 `VITE_API_BASE` 请求后端接口（见 `docs/API.md`）。

## 页面流程

1. 登录页 `/` → 输入任意用户名密码点击登录
2. 主页 `/home` → 点击左侧 Channel 卡片
3. 排行榜 `/channel` → 点击「返回主页」回到主页
