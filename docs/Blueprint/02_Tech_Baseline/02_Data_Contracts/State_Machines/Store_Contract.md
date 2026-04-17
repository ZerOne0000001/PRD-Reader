# 🗄️ 全局状态管理契约 (State Management)

本项目使用 `Zustand` 管理前端的全局状态。状态被拆分为两个核心切片：`configStore` 和 `readerStore`。

## 1. `configStore.ts` (配置与鉴权)
负责管理与管理员后台、代码托管平台（GitLab/GitHub）连接配置相关的状态。

### 1.1 核心状态 (State)
*   `config`: 当前的系统配置对象（包含 `platform`, `gitlab`, `github` 三个核心字段，每个平台下都有自己的 `instanceUrl`, `token`, `repositories` 数组）。
*   `loading`: 布尔值，标识配置是否正在加载或保存。
*   `error`: 字符串，记录最近一次的错误信息。

### 1.2 核心动作 (Actions)
*   `fetchConfig()`: 从 `/api/config` 获取完整配置。
*   `saveConfig(newConfig)`: 保存新配置到后端。
*   `switchPlatform(platform)`: 切换当前激活的代码托管平台，并持久化。
*   `testConnection(platform, url, token)`: 验证输入的对应平台的实例和 Token 是否有效。
*   `addRepository(platform, projectId/path)`: 根据输入获取对应平台的仓库信息并加入白名单。
*   `removeRepository(platform, projectId)`: 从对应平台的白名单中移除仓库。

## 2. `readerStore.ts` (阅读器核心逻辑)
负责管理左侧文件树数据、当前选中的文件以及内容加载逻辑。

### 2.1 核心状态 (State)
*   `repos`: `RepoTree[]` 类型，经过前端转换后的**嵌套树结构**的可见仓库列表。
*   `loadingTree`: 布尔值，标识是否正在获取所有仓库的目录树。
*   `currentFile`: 对象，记录当前正在阅读的文件信息。
    ```typescript
    {
      repoId: string;
      filePath: string;
      content: string; // 若为 md 则是源码，若为 html/image 则是构建好的 URL
      type: 'md' | 'html' | 'image' | 'other';
    }
    ```
*   `loadingFile`: 布尔值，标识文件内容是否正在加载。

### 2.2 核心动作 (Actions)
*   `fetchTree(repoParam?: string)`: 调用 `/api/github/tree` 或 `/api/gitlab/tree`（可附加 `?repo=` 过滤参数），并将扁平数据通过内部的 `buildNestedTree` 函数转换为嵌套树。
*   `fetchFile(repoId, filePath)`:
    *   如果是 `md` 文件，调用对应平台的 `/file` 拉取文本。
    *   如果是 `html` 或图片，直接拼接 `/raw/` 路由作为 `content` 并立即返回，避免将大体积二进制数据拉入状态机内存。

### 2.3 关键算法：`buildNestedTree`
代码托管平台 API 默认可能返回扁平化的目录结构。状态机中内置了健壮的转换逻辑：
1.  遍历所有节点并存入 Map。
2.  通过 `path.split('/')` 寻找父节点。
3.  **核心修复机制**：如果找不到父节点，状态机会动态创建 `virtual-xxx` 的虚拟父节点，保证树结构不会断裂。
4.  **排序规则**：文件夹（tree）在**前**，文件（blob）在**后**；同类型按名称**升序（A-Z）**排列。