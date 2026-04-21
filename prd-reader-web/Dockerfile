# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# 1. 拷贝 package.json 和 lock 文件
COPY package*.json ./

# 2. 安装依赖 (包含 devDependencies 用于构建)
RUN npm install

# 3. 拷贝源代码并执行构建
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Backend (Node.js)
# ==========================================
FROM node:20-alpine AS backend
WORKDIR /app

# 从 builder 阶段拷贝所有文件 (因为我们要用 tsx 运行 ts 源码，所以连源码一起保留)
# 如果后续你想编译后端为 JS，可以优化只拷贝 dist 和 node_modules
COPY --from=builder /app ./

# 暴露后端端口 (供内部通信或本地调试)
EXPOSE 3001

# 启动后端 API 服务
CMD ["npx", "tsx", "api/server.ts"]

# ==========================================
# Stage 3: Frontend (Nginx)
# ==========================================
FROM nginx:alpine AS frontend

# 从 builder 阶段拷贝构建好的 Vite 静态资源 (dist) 到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 拷贝自定义的 Nginx 配置文件 (覆盖默认配置)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 Web 端口
EXPOSE 80

# 启动 Nginx (在前台运行)
CMD ["nginx", "-g", "daemon off;"]