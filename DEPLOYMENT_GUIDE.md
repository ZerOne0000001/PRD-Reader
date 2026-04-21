# PRD-Reader 服务器部署与保活指南 (PM2 + Nginx / Docker)

本指南详细说明了如何将 PRD-Reader 项目（Vite 前端 + Node.js/Express 后端）部署到生产服务器（Ubuntu/CentOS）。我们提供两种部署方案：**方案 A (推荐)：使用 Docker Compose 容器化部署**，以及 **方案 B：传统的 PM2 + Nginx 裸机部署**。

---

## 方案 A：使用 Docker Compose 部署 (推荐)

此方案基于已配置好的 `docker-compose.yml` 和 `Dockerfile` 进行一键构建和部署。不需要在宿主机安装 Node.js、Nginx 和 PM2，所有服务被隔离在独立的容器中。

### 1. 环境准备 (安装 Docker)
以 Ubuntu 22.04 为例，安装官方 Docker 及 Docker Compose 插件：
```bash
# 下载并运行 Docker 安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl enable --now docker
```

### 2. 配置与启动
将项目代码完整上传至服务器。
```bash
# 1. 进入项目根目录 (包含 docker-compose.yml 的目录)
cd /path/to/PRD-Reader

# 2. 创建或修改环境变量 (根据需要配置后端)
# cp prd-reader-web/.env.example prd-reader-web/.env

# 3. 后台一键构建并启动所有服务 (Nginx前端 + Node后端)
sudo docker compose up -d --build
```

### 3. Docker 日常维护
- **查看运行日志**：
  ```bash
  # 查看所有容器日志
  sudo docker compose logs -f

  # 仅查看后端接口日志
  sudo docker compose logs -f backend
  ```
- **重新构建并部署** (代码更新后)：
  ```bash
  sudo docker compose up -d --build
  ```
- **停止服务**：
  ```bash
  sudo docker compose down
  ```

---

## 方案 B：传统的 PM2 + Nginx 裸机部署

如果您的服务器无法安装 Docker 或者您更倾向于原生部署，请参考以下传统步骤。

### 阶段一：服务器环境准备 (Environment Setup)

在服务器上，首先需要安装必备的基础运行环境：

### 1. 安装 Node.js
推荐使用 v18 或 v20 LTS 版本。

```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### 2. 安装 PM2
PM2 是用于 Node.js 应用程序的生产环境进程管理器，内置了负载均衡，能实现应用“永不宕机（Keep-alive）”。

```bash
npm install -g pm2
```

### 3. 安装 Nginx
Nginx 将作为 Web 服务器和反向代理服务器。

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y
```

---

## 阶段二：项目拉取与构建 (Build & Prepare)

将代码克隆或上传至服务器指定目录（例如 `/var/www/prd-reader-web`）。

### 1. 安装项目依赖
```bash
cd /var/www/prd-reader-web
npm install
```

### 2. 配置环境变量
在项目根目录创建 `.env` 文件，确保包含必要的配置（例如服务端口、密钥等）：
```env
PORT=3001
# 在此处补充其他后端所需的环境变量
```

### 3. 执行生产环境构建
执行构建命令，这会编译 TypeScript 并使用 Vite 打包前端静态文件到 `dist` 目录：
```bash
npm run build
```

---

## 阶段三：后端服务部署与保活 (Backend Keep-alive)

该项目的后端入口为 `api/server.ts`。在生产环境中，我们将使用 PM2 通过 `tsx` 来运行和保活该服务。

### 1. 使用 PM2 启动服务
```bash
# 在 prd-reader-web 目录下执行
pm2 start npx --name "prd-reader-api" -- tsx api/server.ts
```

### 2. 配置 PM2 开机自启 (非常重要)
此步骤确保即使服务器重启，后端服务也会被 PM2 自动拉起保活：
```bash
# 生成开机自启脚本并按照提示执行输出的命令
pm2 startup

# 保存当前正在运行的 PM2 进程列表
pm2 save
```

### 3. 验证后端运行状态
```bash
# 查看所有被 PM2 管理的进程状态
pm2 status

# 查看日志确认服务已启动
pm2 logs prd-reader-api
```

---

## 阶段四：前端部署与 Nginx 反向代理 (Frontend & Nginx)

前端使用 Nginx 直接托管构建出的静态产物（`dist` 目录），并将对 `/api/*` 的请求反向代理到本地被 PM2 保活的 Node.js 后端。

### 1. 创建 Nginx 站点配置文件
```bash
sudo nano /etc/nginx/sites-available/prd-reader
```

### 2. 写入 Nginx 配置
将以下内容写入配置文件：
```nginx
server {
    listen 80;
    server_name your_domain.com; # 请替换为您的实际域名或服务器 IP

    # 1. 托管前端静态产物
    location / {
        root /var/www/prd-reader-web/dist; # 指向您刚才构建出的 dist 目录的绝对路径
        index index.html index.htm;
        
        # 支持 React-Router 的前端路由 (History 模式)，避免刷新页面报 404
        try_files $uri $uri/ /index.html; 
    }

    # 2. 反向代理后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:3001; # 指向由 PM2 运行的 Node.js 后端端口
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 避免请求体过大（PRD 解析可能有大体积 Payload）
        client_max_body_size 50M; 
    }
}
```

### 3. 启用配置并重启 Nginx
```bash
# 建立软链接启用配置
sudo ln -s /etc/nginx/sites-available/prd-reader /etc/nginx/sites-enabled/

# 测试 Nginx 配置是否合法
sudo nginx -t

# 重新加载 Nginx 应用新配置
sudo systemctl reload nginx
```

---

## 🛠 日常维护与故障排查指南

- **查看后端日志（报错/请求记录）**：
  ```bash
  pm2 logs prd-reader-api --lines 100
  ```

- **重启/重载服务（代码更新后）**：
  ```bash
  # 拉取新代码并重新构建后执行
  npm run build
  pm2 restart prd-reader-api
  ```

- **进程崩溃自动恢复机制**：
  由于使用了 PM2，如果 Node.js 后端遇到异常崩溃（如内存溢出或未捕获的错误），PM2 会在毫秒级别自动重新启动该进程，实现真正的进程级保活，无需人工干预。
