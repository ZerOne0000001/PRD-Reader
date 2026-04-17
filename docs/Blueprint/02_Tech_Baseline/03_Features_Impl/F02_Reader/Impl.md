# 📄 阅读器核心模块实现细节 (F02_Reader)

## 1. 代码文件级映射 (Traceability Matrix)

| 职责域 | 核心文件路径 | 核心作用与说明 |
| :--- | :--- | :--- |
| **前端视图 (React)** | `src/pages/Reader.tsx` | 承载阅读器的主页面结构：顶部导航、左侧抽屉下拉仓库切换器、单仓库树、居中阅读区、右侧 TOC。包含 Markdown 渲染逻辑与 iframe 隔离逻辑。 |
| **状态机 (Zustand)** | `src/store/readerStore.ts` | 管理 `repos` 列表、当前选中的 `currentFile`，负责请求单仓库文件树 `fetchTree(repoParam)` 并转化为可渲染的嵌套树。 |
| **后端路由 (Express)** | `api/routes/github.ts`<br>`api/routes/gitlab.ts` | 暴露 `/tree` (支持 `?repo=` 过滤单仓库), `/file` 及核心的虚拟静态路由 `/raw/:projectId/*`。 |
| **底层服务 (Node.js)** | `api/services/gitlabService.ts`<br>`api/services/githubService.ts` | 封装了调用对应平台 REST API 的具体方法（如拉取文件树、获取 Raw 文件内容）。 |

## 2. 核心功能逻辑

### 2.1 单仓库目录树异步加载与渲染
*   **入口**：前端页面加载时触发 `useReaderStore().fetchTree(repoParam)`，只加载当前指定的单仓库。
*   **流转**：
    1.  调用后端 `GET /api/xxx/tree?repo=xxx`。
    2.  后端读取全局配置的 `platform` 和对应的 Token，过滤出白名单中匹配的单仓库，调用平台服务拉取树数据。
    3.  前端收到扁平数据后，在 `readerStore.ts` 中通过 `buildNestedTree` 组装为包含 `children` 数组的嵌套树，并在左侧组件中递归渲染。

### 2.2 文件内容的加载与渲染分类
*   **交互**：用户在左侧文件树点击具体节点。
*   **判断逻辑 (`readerStore.fetchFile`)**：
    *   **如果是 `.md` 文件**：
        1. 调用 `/api/xxx/file`。
        2. 后端拉取 Raw 文本，返回给前端。
        3. 前端将 `content` 设置为该文本，类型置为 `'md'`。
        4. React 视图层使用 `marked` 解析文本，渲染为 DOM；拦截 `mermaid` 代码块绘制 SVG；生成右侧悬浮的 TOC 大纲。
    *   **如果是 `.html` 或图片**：
        1. 不向后端发起 fetch 数据请求。
        2. 前端状态机直接将 `content` 设置为拼接好的 URL：`/api/xxx/raw/{projectId}/{filePath}`。
        3. React 视图层渲染全屏的 `<iframe src={content}>` 或 `<img src={content}>`。

### 2.3 分享链接与路由状态同步 (Share & URL Sync)
*   **URL 参数同步**：`Reader.tsx` 中使用 `useSearchParams` 并在点击树节点时通过 `window.history.replaceState` 静默更新 `?repo=` 与 `?file=` 参数，避免触发整个 React 树重渲染。
*   **页面初始化与下钻 (Drill-down)**：
    1.  系统首次加载 `repos` 数据后，解析 URL 参数。
    2.  若找到对应的 `repo` 和 `file`，则触发下钻模式，更新 `drillDownNode` 为目标文件夹（或目标文件的父文件夹）。
    3.  若 `repo` 无权限或文件不存在，触发 404/403 拦截页，不渲染右侧内容，保留全局视图恢复按钮。
    4.  若未携带 `?file=` 参数，则默认定位并渲染当前仓库根目录下的 `README.md`。
*   **悬浮分享菜单 (Popover)**：左侧树节点 Hover 触发的分享操作使用绝对定位呈现气泡菜单，提供“复制 Git 地址”与“复制系统链接”选项，并结合 `navigator.clipboard` 与 Toast 提示用户。

## 3. 已知限制与注意事项
*   **树的层级渲染**：因为平台 API 的分页限制，庞大的仓库可能会出现数据截断，这正是 `buildNestedTree` 需要动态创建虚拟节点的原因。
*   **单文件 HTML 预览**：后端 `/api/xxx/raw/*` 路由仅支持代理同一仓库下的相对路径资源，跨仓库的资源引用在 iframe 内会 404。