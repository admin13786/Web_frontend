# 教育仓库（EduRepo）Demo - Frontend

Vite + 原生 JS/CSS 的“小红书风格”瀑布流 demo（不依赖 UI 库）。

取数方式：**只请求 EduRepo Backend**（由后端去 Crawl 拉取、翻译/科普改写并缓存，并返回封面图）。

## 运行

1) 启动 EduRepo Backend（默认 `http://localhost:9010`）

2) 启动前端

如果你本地能安装依赖：

```bash
cd Backend/EduRepo/frontend
npm i
npm run dev
```

如果你当前环境不方便 `npm i`（离线/无网络），可以复用仓库里已有的 Vite：

```powershell
cd Backend\EduRepo\frontend
.\run-dev.ps1 -ApiBase http://localhost:9010 -Port 5188
```

然后访问 `http://localhost:5188`。

## 环境变量

- `VITE_API_BASE`：EduRepo Backend 地址（例如 `http://localhost:9010`）
- `VITE_API_PROXY_TARGET`：仅 dev proxy 使用（可选，默认 `http://localhost:9010`）
- `VITE_PUBLIC_BASE`：静态资源发布基路径；若要挂到主站 `/edurepo/`，构建时设为 `/edurepo/`

## Docker

如果通过上层 `Backend/EduRepo/docker-compose.yml` 启动：

- 前端容器对外暴露 `5188`
- 默认访问地址是 `http://localhost:5188/edurepo/`

之所以默认带 `/edurepo/`，是为了和主站左侧导航里的内嵌路径保持一致。
