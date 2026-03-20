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

可选：在项目根目录 `.env` 中配置 `VITE_OPENMAIC_BASE_URL`（例如 `http://localhost:3000`）。频道页「讲解」会跳转到 OpenMAIC 的 `/api/dialog-prefill?title=…&to=home`，由服务端写入预填并回到首页。

## Docker 部署到服务器

**服务器上需要安装的只有 Docker**，无需单独安装 Node、Nginx 或其它库；镜像内已包含构建与运行所需环境。

## CI/CD：构建镜像并推送到镜像仓库（Docker Hub）

项目已包含 GitHub Actions 工作流：push 到 `main`（或打 `vX.Y.Z` tag）时自动构建镜像并推送到 Docker Hub。

- **镜像地址**：`docker.io/akaina666666/frontend:<tag>`
- **默认 tag**：`main`、`sha-<短哈希>`，以及发布 tag（如 `v1.2.3`）
- **Docker Hub 登录（Secrets）**：
  - `DOCKERHUB_TOKEN`：Docker Hub Access Token（建议用 token，不要用密码）
- **可选构建参数（Secrets）**：
  - `VITE_API_BASE`：后端 API Base URL（例如 `https://api.example.com`）
  - `VITE_USE_MOCK`：是否启用 mock（例如 `false`）

首次使用前，请先在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 配好上述 Secrets。

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
3. 排行榜 `/channel` → 条目旁「讲解」跳转 OpenMAIC 预填；「返回主页」回到工字型主页
