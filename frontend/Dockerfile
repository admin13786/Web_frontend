ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
ARG NGINX_IMAGE=docker.m.daocloud.io/library/nginx:alpine

FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package.json ./

ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm config set registry ${NPM_REGISTRY} && npm install

COPY . .

ARG VITE_PUBLIC_BASE=/edurepo/
ARG VITE_API_BASE=
ENV VITE_PUBLIC_BASE=${VITE_PUBLIC_BASE}
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

FROM ${NGINX_IMAGE}

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
