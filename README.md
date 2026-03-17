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

访问 http://localhost:5173

## 页面流程

1. 登录页 `/` → 输入任意用户名密码点击登录
2. 主页 `/home` → 点击左侧 Channel 卡片
3. 排行榜 `/channel` → 点击「返回主页」回到主页
