# 系统调研报告 (System Survey)

## 1. 项目背景与需求概述

### 1.1 需求名称
**GitHub 集成功能 (GitHubIntegration)**

### 1.2 需求类型
**对现有系统的迭代和修改** - 在现有 GitLab 文件查看系统的基础上，增加 GitHub 平台支持。

### 1.3 核心需求摘要
- 平台选择器：支持在 GitLab 和 GitHub 之间切换
- GitHub 配置管理：实例地址、Personal Access Token 配置
- GitHub 仓库白名单管理
- GitHub 文件树浏览、Markdown 渲染、HTML 预览、图片查看
- 两个平台的配置独立存储，切换时自动加载

---

## 2. 现有系统核心逻辑分析

### 2.1 配置管理模块

| 项目 | 现状 |
|:---|:---|
| **配置文件** | `config.json` 存储 GitLab 的 instanceUrl、token、repositories |
| **服务层** | `services/configService.ts` 读写 config.json |
| **路由层** | `routes/config.ts` 提供 GET/POST /api/config |
| **状态层** | `configStore.ts` 管理配置状态 |

**重构方向**：需要在 `config.json` 中增加 `platform` 字段和 GitHub 配置字段。

### 2.2 文件浏览模块

| 项目 | 现状 |
|:---|:---|
| **服务层** | `services/gitlabService.ts` 调用 GitLab API |
| **路由层** | `routes/gitlab.ts` 提供 /api/gitlab/tree、/api/gitlab/file、/api/gitlab/raw |
| **状态层** | `readerStore.ts` 管理文件树和当前文件状态 |

**重构方向**：抽象通用路由，根据 platform 调用对应服务。

### 2.3 前台页面模块

| 项目 | 现状 |
|:---|:---|
| **阅读页面** | `pages/Reader.tsx` - 左侧文件树 + 右侧阅读区 |
| **后台配置** | `pages/Admin.tsx` - Token 配置 + 白名单管理 |
| **首页** | `pages/Home.tsx` - 仓库列表入口 |

**重构方向**：Admin 页面增加平台选择器，Reader 页面根据平台渲染不同仓库。

---

## 3. 技术架构决策

### 3.1 平台路由方案
**采用方案 A：抽象通用路由**

将现有的 `/api/gitlab/*` 路由重构为 `/api/repo/*`，根据 `config.json` 中的 `platform` 字段动态调用对应的服务层。

### 3.2 服务层方案
**采用方案 1：独立新文件**

新建 `services/githubService.ts`，与现有的 `services/gitlabService.ts` 完全独立，接口相似但实现各自独立。

**理由**：
- GitHub API 与 GitLab API 差异较大（认证、返回格式、分页等）
- 两个平台功能完全对等，复用代码收益有限
- 独立文件职责单一，便于维护和扩展

### 3.3 配置数据结构
**存储在同一个 config.json 中**

```json
{
  "platform": "gitlab" | "github",
  "gitlab": {
    "instanceUrl": "string",
    "token": "string",
    "repositories": [...]
  },
  "github": {
    "instanceUrl": "https://github.com",
    "token": "string",
    "repositories": [...]
  }
}
```

---

## 4. 受影响的现有页面与数据流转

### 4.1 受影响的页面

| 页面 | 修改内容 |
|:---|:---|
| `Admin.tsx` | 增加平台选择器，表单根据平台动态切换 |
| `Reader.tsx` | 文件树和阅读区逻辑需适配平台 |
| `Home.tsx` | 可能需要显示当前平台标识 |

### 4.2 受影响的数据流转

| 数据流 | 现状 | 变更 |
|:---|:---|:---|
| 配置获取 | GET /api/config 只返回 GitLab 配置 | 返回完整配置对象（含双平台配置和当前平台） |
| 文件树获取 | GET /api/gitlab/tree | GET /api/repo/tree，根据 platform 调用 GitLab/GitHub 服务 |
| 文件内容获取 | GET /api/gitlab/file | GET /api/repo/file，根据 platform 调用对应服务 |
| 静态资源获取 | GET /api/gitlab/raw/:projectId/* | GET /api/repo/raw/:projectId/* |

---

## 5. 约束与依赖

### 5.1 技术约束
- GitHub 使用 Personal Access Token 进行鉴权
- Token 需具备 `public_repo` + `repo` 权限
- 前端所有平台 API 请求必须通过后端代理
- 后端需校验请求的仓库是否在白名单中

### 5.2 兼容性约束
- 需要保持与现有 GitLab 功能的完全兼容
- 平台切换不能影响现有用户体验
- 配置变更需立即生效，无需重启服务

### 5.3 依赖项
- 无新的外部依赖
- 复用现有的 React、Express、Zustand、Tailwind CSS 技术栈

---

## 6. 风险评估

| 风险项 | 风险等级 | 缓解措施 |
|:---|:---:|:---|
| 平台切换时配置加载错误 | 中 | 增加配置校验和错误提示 |
| GitHub API 限流 | 低 | 添加请求间隔控制 |
| Token 权限不足 | 中 | 提供清晰的权限说明和错误提示 |
| 现有 GitLab 功能被破坏 | 高 | 充分测试，确保向后兼容 |

---

## 7. 调研结论

本次迭代的核心目标是**在不影响现有 GitLab 功能的前提下**，增加 GitHub 平台支持。

**关键技术决策**：
1. **路由抽象**：采用通用路由 `/api/repo/*`，动态分发到对应平台服务
2. **服务独立**：新建 `githubService.ts`，与 GitLab 服务完全解耦
3. **配置统一**：两个平台的配置存储在同一个 `config.json` 中，通过 `platform` 字段切换

此架构具有良好的扩展性，未来如需接入 GitLab Enterprise 或其他平台，只需新增对应的服务文件即可。
