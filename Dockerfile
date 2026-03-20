# 阶段一：用 Node 安装依赖并构建前端
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package.json package-lock.json ./
RUN npm ci

# 再复制源码并构建（构建时可传入后端 API 地址）
COPY . .
ARG VITE_API_BASE
ARG VITE_USE_MOCK
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_USE_MOCK=${VITE_USE_MOCK:-true}
RUN npm run build

# 阶段二：用 Nginx 托管静态资源，无需再安装任何“库”
FROM nginx:alpine

# 从构建阶段拷贝产物
COPY --from=builder /app/dist /usr/share/nginx/html
# 使用项目内的 nginx 配置（支持 Vue Router History 模式）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
