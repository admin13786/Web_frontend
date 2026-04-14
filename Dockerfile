# 支持通过构建参数覆盖基础镜像，默认使用更稳定的镜像代理。
ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
ARG NGINX_IMAGE=docker.m.daocloud.io/library/nginx:alpine

# 阶段一：用 Node 安装依赖并构建前端
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package.json package-lock.json ./
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry ${NPM_REGISTRY} && npm ci

# 再复制源码并构建（构建时可传入后端 API 地址）
COPY . .
ARG VITE_API_BASE
ARG VITE_USE_MOCK
ARG VITE_RANK_VIDEO_MOCK
ARG VITE_RANK_WEIBO_MOCK
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_USE_MOCK=${VITE_USE_MOCK:-true}
ENV VITE_RANK_VIDEO_MOCK=${VITE_RANK_VIDEO_MOCK:-true}
ENV VITE_RANK_WEIBO_MOCK=${VITE_RANK_WEIBO_MOCK:-false}
RUN npm run build

# 阶段二：用 Nginx 托管静态资源，无需再安装任何“库”
FROM ${NGINX_IMAGE}

# 从构建阶段拷贝产物
COPY --from=builder /app/dist /usr/share/nginx/html
# 默认 nginx.conf；Compose 联调时可传 --build-arg NGINX_CONF=nginx.compose.conf
ARG NGINX_CONF=nginx.conf
COPY ${NGINX_CONF} /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/99-render-nginx-config.sh /docker-entrypoint.d/99-render-nginx-config.sh

RUN chmod +x /docker-entrypoint.d/99-render-nginx-config.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
