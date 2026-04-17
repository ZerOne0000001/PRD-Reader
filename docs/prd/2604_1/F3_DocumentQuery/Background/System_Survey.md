# 系统调研 (System Survey) - F2 文档查询功能

## 1. 原有系统核心逻辑

### 1.1 技术架构概览
| 层级 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| 前端框架 | React 18 + TypeScript | SPA 应用 |
| 状态管理 | Zustand | 轻量级，已用于 readerStore、configStore |
| 样式方案 | Tailwind CSS | 原子化 CSS |
| 后端框架 | Express (Node.js) | 代理层，负责 GitLab API 转发 |
| 路由 | react-router-dom | Hash Router |

### 1.2 现有 API 路由
| 路由 | 方法 | 功能 |
| :--- | :--- | :--- |
| `/api/gitlab/tree` | GET | 获取所有白名单仓库的文件树 |
| `/api/gitlab/file` | GET | 获取文本文件内容（Markdown） |
| `/api/gitlab/raw/:projectId/*` | GET | 虚拟静态资源路由（HTML/图片） |
| `/api/config` | GET/POST | 系统配置管理 |

### 1.3 现有搜索框状态
- **位置**：Reader.tsx 顶部导航栏
- **当前状态**：disabled，显示"搜索文档 (敬请期待)..."
- **代码位置**：`src/pages/Reader.tsx` 第 342-347 行

### 1.4 状态管理结构
- `readerStore.ts`：管理 repos 列表、currentFile、loading 状态
- `configStore.ts`：管理全局配置（instanceUrl、token、repositories）

## 2. 受影响的现有页面/模块

| 模块 | 影响程度 | 具体影响 |
| :--- | :--- | :--- |
| **Reader.tsx** | 🔴 高 | 需要启用搜索框、添加搜索跳转逻辑 |
| **readerStore.ts** | 🟡 中 | 可能需要添加搜索相关的状态（或新建 searchStore） |
| **App.tsx** | 🟡 中 | 需要添加搜索结果页面的路由 |
| **gitlab.ts (后端)** | 🔴 高 | 需要新增搜索 API 路由 |
| **gitlabService.ts** | 🔴 高 | 需要新增调用 GitLab Search API 的方法 |

## 3. 约束与依赖

### 3.1 技术约束
- **GitLab 版本**：私有部署版（支持全局搜索 API）
- **Token 权限**：具有所有权限，可调用 Search API
- **性能要求**：搜索响应时间 ≤ 5 秒

### 3.2 GitLab Search API 能力
私有部署版 GitLab 支持以下搜索接口：

| 接口 | 说明 |
| :--- | :--- |
| `GET /api/v4/search?scope=blobs&search=keyword` | 全局搜索文件内容 |
| `GET /api/v4/projects/:id/search?scope=blobs&search=keyword` | 单项目搜索文件内容 |
| `GET /api/v4/search?scope=projects&search=keyword` | 搜索项目名称 |

**关键参数**：
- `scope`: 搜索范围（blobs=文件内容, projects=项目, issues=议题等）
- `search`: 搜索关键词
- `per_page`: 每页结果数（默认 20，最大 100）

### 3.3 设计约束
- 搜索范围限制在**白名单仓库**内（需后端过滤）
- 仅搜索 `.md` 文件内容 + 所有文件的文件名
- 搜索结果需支持分页

## 4. 技术方案决策

### 4.1 方案对比
| 方案 | 描述 | 响应时间 | 实现复杂度 | 决策 |
| :--- | :--- | :--- | :--- | :--- |
| **GitLab Search API** | 使用 GitLab 原生搜索接口 | < 1秒 | 低 | ✅ 采用 |
| 后端遍历搜索 | 遍历所有 .md 文件逐个匹配 | 5-30秒 | 中 | ❌ 放弃 |
| 本地索引 | 维护 ElasticSearch/内存索引 | < 500ms | 高 | ❌ 过度设计 |

### 4.2 最终方案
**采用 GitLab Search API**，理由：
1. 私有部署版支持全局搜索
2. Token 具有完整权限
3. 响应时间满足要求（< 1秒）
4. 实现复杂度低，无需额外存储

## 5. 风险与缓解措施

| 风险 | 影响 | 缓解措施 |
| :--- | :--- | :--- |
| GitLab Search API 返回非白名单仓库结果 | 数据泄露 | 后端过滤：仅返回白名单仓库内的结果 |
| 搜索结果过多 | 用户体验差 | 分页展示 + 结果数量统计 |
| GitLab API 限流 | 搜索失败 | 添加错误处理和重试机制 |
