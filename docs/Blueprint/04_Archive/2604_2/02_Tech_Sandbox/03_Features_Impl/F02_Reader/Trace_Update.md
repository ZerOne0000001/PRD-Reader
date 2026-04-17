# F02_Reader 技术实现草案 (Tech Sandbox Update)

## 1. 核心逻辑变更 (Reader.tsx)

### 1.1 分享链接与路由状态同步 (Share & URL Sync)
* **URL 参数同步**：`Reader.tsx` 中使用 `useSearchParams` 拦截初始化 URL 参数 `?repo=` 与 `?file=`，并在点击左侧树节点时通过 `window.history.replaceState` 静默更新参数，避免触发整个 React 组件树重渲染。
* **页面初始化与下钻 (Drill-down)**：
  1. 系统首次加载 `repos` 树形数据后，解析 URL 参数。
  2. 若找到对应的 `repo` 和 `file` 节点，则触发下钻模式，更新 `drillDownNode` 状态机，使其值指向目标文件夹（或目标文件的父文件夹）。
  3. 若 `repo` 无权限或文件不存在，则拦截原有的页面渲染逻辑，转而通过 `renderContent()` 方法内部返回 404/403 的占位页，同时保留返回全局视图的按钮。

### 1.2 悬浮分享菜单 (Popover)
* **组件重构**：重构了 `TreeNode` 组件中原本简单的“复制地址”行为，改为由 Hover 触发“分享链接”按钮。
* **气泡菜单渲染**：点击分享按钮时，使用基于 `getBoundingClientRect()` 计算绝对定位的方式弹出气泡菜单，提供“复制 Git 地址”和“复制系统链接”两个选项。
* **剪贴板交互反馈**：引入 `copyToClipboard` 方法与 `copiedGit`、`copiedSys` 状态机联动，在复制成功时将图标切换为绿色的“Check（打勾）”标记并停留 2 秒，提供明确的视觉反馈。

## 2. 状态机与契约变更 (Zustand)
本次迭代主要依赖于 `Reader.tsx` 内部的状态机流转 (`searchParams`, `drillDownNode`, `shareMenu`, `notFoundState` 等)，无需更改全局 `readerStore.ts` 和后端的 API 契约。

## 3. 已知限制与注意事项
* 为了防止覆盖导致菜单收起的冲突问题，目前采取了 `shareMenuOpenRef` 与 `DOM:hover` 双重机制检测来拦截侧边栏的 `mouseleave` 事件，确保气泡菜单弹出期间左侧树稳定展开。