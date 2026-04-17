# 🏗️ 技术栈与全局规范 (Tech Stack)

## 1. 核心技术栈
本项目是一个采用全栈单体结构（Monorepo）的 Web 应用。

### 1.1 前端 (Frontend)
*   **框架**：React 18
*   **构建工具**：Vite
*   **语言**：TypeScript
*   **路由**：`react-router-dom` (Hash Router 或 Browser Router 视具体配置而定)
*   **状态管理**：Zustand (轻量级，支持切片和持久化)
*   **样式方案**：Tailwind CSS (原子化 CSS，配合 `clsx` 和 `tailwind-merge` 解决类名冲突)
*   **图标库**：`lucide-react`
*   **Markdown 解析**：`marked` (配合 `dompurify` 防止 XSS 攻击)
*   **图表渲染**：`mermaid` (用于解析 PRD 中的流程图和架构图)

### 1.2 后端 (Backend)
*   **运行环境**：Node.js
*   **框架**：Express
*   **语言**：TypeScript (通过 `tsx` 和 `nodemon` 本地热更)
*   **核心职责**：
    1.  提供前端所需的配置和鉴权接口 (`/api/config`)。
    2.  作为代码托管平台 (GitLab/GitHub) API 的代理层，携带全局 Token 获取数据，避免前端泄露凭证。
    3.  提供类似虚拟静态服务器的路由，支持直接访问图片和 HTML 原型。

## 2. 目录结构规范
```text
/prd-reader-web
├── api/                  # Node.js 后端代理服务目录
│   ├── routes/           # Express 路由控制器 (分模块)
│   ├── services/         # 核心业务逻辑服务 (读写 config.json 等)
│   ├── app.ts            # Express 实例与中间件装配
│   └── server.ts         # 本地启动入口
├── src/                  # React 前端应用目录
│   ├── assets/           # 静态资源
│   ├── components/       # 全局复用的 UI 组件
│   ├── hooks/            # 自定义 React Hooks
│   ├── lib/              # 工具函数 (如 Tailwind class 合并工具)
│   ├── pages/            # 路由页面组件 (Home, Reader, Admin)
│   ├── store/            # Zustand 状态管理切片
│   ├── App.tsx           # 根组件 (路由配置)
│   └── main.tsx          # 前端挂载入口
├── config.json           # 本地持久化存储的系统配置文件
├── package.json          # 依赖清单与 npm scripts
└── vite.config.ts        # Vite 构建与代理配置
```

## 3. 全局编码规范
### 3.1 命名约定
*   **组件文件**：PascalCase (如 `Admin.tsx`)。
*   **工具函数/服务**：camelCase (如 `configService.ts`)。
*   **接口/类型定义**：PascalCase，建议带 `I` 前缀 (如 `IGitlabNode`)。
*   **Zustand Store**：以 `use` 开头 (如 `useReaderStore`)。

### 3.2 样式约定 (Tailwind)
*   所有样式必须通过 Tailwind Utility Classes 实现。
*   复杂条件样式必须使用 `cn` 工具函数（封装了 `clsx` 和 `twMerge`）拼接：
    ```typescript
    import { cn } from '@/lib/utils';
    <div className={cn('base-class', isActive && 'active-class')} />
    ```

### 3.3 数据流与状态管理
*   **单一数据源**：页面级状态和异步数据请求下沉到 Zustand Store 管理。
*   **避免前端直接请求**：前端绝对不允许直接引入 axios/fetch 调用外部托管平台 API，必须调用内部的 `/api/*` 代理路由。