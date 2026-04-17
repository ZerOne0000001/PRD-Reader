# 页面结构 (Page Structure) - F2 文档查询功能

## 1. 全局导航与结构

### 1.1 页面清单

| 页面 | 路由 | 预设 HTML 文件 | 说明 |
| :--- | :--- | :--- | :--- |
| 首页/阅读器 | `/reader` | `Reader.tsx` | 现有页面，**修改搜索框交互** |
| 搜索结果页 | `/search` | `Search.tsx` | **新建页面** |
| 后台配置 | `/admin` | `Admin.tsx` | 现有页面 |

### 1.2 视觉风格规范（与现有系统一致）

**颜色变量**：
```css
--bg-pastel: #FDF4F5      /* 主背景色（淡粉） */
--sidebar-bg: #E8F3F1     /* 侧边栏背景（淡绿） */
--accent-pink: #FFB5C2    /* 粉色强调 */
--accent-blue: #A2D2FF    /* 蓝色强调 */
--accent-yellow: #FDE293   /* 黄色强调 */
--text-dark: #4A4E69       /* 深色文字 */
--text-light: #9CA3AF     /* 浅色文字 */
```

**字体**：
- 正文：`Nunito`
- 标题：`Quicksand`

**圆角规范**：
- 大型圆角：`rounded-2xl`（搜索框、卡片）
- 胶囊形：`rounded-full`（小标签、按钮）

**阴影规范**：
- 卡片阴影：`card-shadow: 0 4px 15px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05);`

**按钮样式**：
- 主按钮：`soft-btn`（蓝色背景、白色文字、悬停上浮）
- 描边按钮：`soft-btn-outline`（白色背景、灰色边框）

---

## 2. 搜索入口页面 (`Reader.tsx`) 修改说明

### 2.1 修改背景

现有 `Reader.tsx` 的顶部导航栏中已存在搜索框组件，但处于 **disabled 状态**，显示"搜索文档 (敬请期待)..."。

**现有代码位置**：`src/pages/Reader.tsx` 第 341-347 行

```tsx
// 现有代码（disabled）
<div className="relative w-64">
  <input
    type="text"
    placeholder="搜索文档 (敬请期待)..."
    disabled
    className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-full px-5 py-2.5 text-sm font-bold text-[#4A4E69] focus:outline-none focus:border-[var(--accent-blue)] focus:bg-white transition-all opacity-50"
  />
  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
    <Search className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
  </div>
</div>
```

### 2.2 修改清单

| 修改项 | 修改内容 | 优先级 |
| :--- | :--- | :--- |
| **移除 disabled 状态** | 搜索框可输入 | P0 |
| **添加状态管理** | 添加 `searchQuery` state 管理输入值 | P0 |
| **添加搜索处理函数** | `handleSearch()` 函数处理回车和点击 | P0 |
| **添加路由跳转** | 搜索时跳转到 `/search?q={query}` | P0 |
| **修改 placeholder** | 改为"搜索文档..." | P1 |
| **添加键盘事件** | 支持 `Enter` 键触发搜索 | P1 |

### 2.3 修改后代码结构

```tsx
// 新增 state
const [searchQuery, setSearchQuery] = useState('')

// 新增搜索处理函数
const handleSearch = () => {
  if (searchQuery.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }
}

// 搜索框 JSX 修改后
<div className="relative w-64">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
    placeholder="搜索文档..."
    className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-full px-5 py-2.5 text-sm font-bold text-[#4A4E69] focus:outline-none focus:border-[var(--accent-blue)] focus:bg-white transition-all"
  />
  <button
    onClick={handleSearch}
    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-[var(--accent-blue)]/10 transition-colors"
  >
    <Search className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
  </button>
</div>
```

### 2.4 交互规范

| 交互 | 行为 |
| :--- | :--- |
| 输入关键词后按 Enter | 触发搜索，跳转 `/search?q=关键词` |
| 点击搜索图标 | 触发搜索，跳转 `/search?q=关键词` |
| 输入为空时点击搜索 | 不触发跳转（无反应） |
| 搜索框失焦 | 保持输入内容 |

---

## 3. 搜索结果页 (`Search.tsx`) 详细结构

### 3.1 整体布局

```
┌────────────────────────────────────────────────────────────────────┐
│  整体容器 (flex, h-screen, bg-[var(--bg-pastel)])                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 顶部导航栏 (Header)                                           │ │
│  │ h-20, bg-white, rounded-[32px], card-shadow, mx-3, mt-3     │ │
│  │ 内边距: px-10                                                │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │ 左侧: 返回按钮 [← 返回] + 面包屑 "搜索结果"                   │ │
│  │ 中间: 搜索框 [input] + [搜索按钮]                             │ │
│  │ 右侧: 占位 (flex-1)                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 主内容区 (flex-1, flex, gap-3, mx-3, mb-3)                    │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │                                                              │ │
│  │  ┌────────────────┐  ┌────────────────────────────────────┐ │ │
│  │  │ 左侧筛选面板    │  │ 右侧结果区域                        │ │ │
│  │  │ w-64, bg-white │  │ flex-1, bg-white, rounded-[32px]   │ │ │
│  │  │ rounded-[24px] │  │ card-shadow                        │ │ │
│  │  │ card-shadow   │  │ ─────────────────────────────────  │ │ │
│  │  │ p-6           │  │ 统计信息区 (共 X 个结果)            │ │ │
│  │  │ ────────────  │  │ ─────────────────────────────────  │ │ │
│  │  │ "筛选" 标题   │  │ 结果列表区 (flex-1, overflow-y)    │ │ │
│  │  │ ────────────  │  │ ─────────────────────────────────  │ │ │
│  │  │ 仓库列表       │  │ 分页控件                           │ │ │
│  │  │  ☑ 仓库A      │  │                                    │ │ │
│  │  │  ☑ 仓库B      │  │                                    │ │ │
│  │  │  ☐ 仓库C      │  │                                    │ │ │
│  │  │ ────────────  │  │                                    │ │ │
│  │  │ 匹配类型       │  │                                    │ │ │
│  │  │  ☑ 文件名     │  │                                    │ │ │
│  │  │  ☑ 内容       │  │                                    │ │ │
│  │  └────────────────┘  └────────────────────────────────────┘ │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 模块分区与详细规范

#### A. 顶部导航栏 (`<header>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 左区 | 返回按钮 | `flex items-center gap-2 text-[var(--text-light)] hover:text-[var(--text-dark)]` | 鼠标悬停变色 |
| 左区 | 面包屑文本 | `font-bold text-[var(--text-dark)]` | 显示"搜索结果" |
| 中区 | 搜索框容器 | `relative w-96` | 固定宽度 |
| 中区 | 搜索输入框 | `soft-input` | 圆角胶囊形 |
| 中区 | 搜索按钮 | `absolute right-1 top-1/2 -translate-y-1/2` | 定位在输入框右侧 |
| 右区 | 占位 | `flex-1` | 占据剩余空间 |

#### B. 左侧筛选面板 (`<aside>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 面板容器 | - | `w-64 rounded-[24px] card-shadow p-6` | 固定宽度、卡片样式 |
| 标题区 | "筛选" 文本 | `text-xs font-bold uppercase tracking-wider text-[var(--text-light)] mb-4` | 大写小号字体 |
| 仓库列表区 | 标题 | `text-sm font-bold text-[var(--text-dark)] mb-3` | "仓库" |
| 仓库项 | Checkbox + 仓库名 | `flex items-center gap-3 py-2 hover:bg-gray-50 rounded-xl px-2 transition-colors` | 悬停高亮 |
| 仓库项 | Checkbox | `w-4 h-4 rounded border-2 border-gray-200` | 自定义样式 |
| 分隔线 | hr | `border-t border-gray-100 my-4` | 分隔仓库和匹配类型 |
| 匹配类型区 | 标题 | `text-sm font-bold text-[var(--text-dark)] mb-3` | "匹配类型" |
| 类型项 | Checkbox + 类型名 | 同仓库项 | 同上 |

#### C. 右侧结果区域 (`<main>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 容器 | - | `flex-1 bg-white rounded-[32px] card-shadow flex flex-col` | 自适应宽度、垂直布局 |
| 统计区 | 结果计数 | `px-8 py-6 border-b border-gray-50` | 上边框分隔 |
| 统计文本 | "共 X 个结果" | `text-sm font-bold text-[var(--text-light)]` | - |
| 结果列表区 | - | `flex-1 overflow-y-auto px-8 py-6` | 可滚动 |
| 结果项 | - | `mb-4` | 每个结果间距 |
| 分页区 | - | `px-8 py-4 border-t border-gray-50 flex items-center justify-between` | 上边框分隔 |

#### D. 结果项组件 (`<SearchResultItem>`)

| 区域 | 样式类名 | 说明 |
| :--- | :--- |
| 容器 | `p-5 bg-[#F9FAFB] rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border-2 border-transparent hover:border-[var(--accent-blue)]` | 悬停时边框变蓝 |
| 文件名行 | `flex items-center justify-between mb-2` | 标题行 |
| 文件名 | `flex items-center gap-2` | - |
| 文件图标 | `w-8 h-8 bg-[#F3F4F6] rounded-lg flex items-center justify-center` | 灰色背景 |
| 文件名文本 | `font-bold text-[var(--text-dark)]` | 加粗 |
| 匹配标签 | `text-xs px-3 py-1 rounded-full bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] font-bold` | 蓝色浅底标签 |
| 仓库路径 | `text-sm text-[var(--text-light)] mb-3 ml-10` | 浅色小号字体 |
| 预览片段 | `text-sm text-[var(--text-dark)] leading-relaxed line-clamp-3` | 多行截断 |
| 高亮文字 | `bg-[var(--accent-yellow)]/40 px-1 rounded` | 黄色背景高亮 |

#### E. 分页组件 (`<Pagination>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 容器 | - | `flex items-center gap-2` | 水平排列 |
| 页码按钮 | - | `w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm` | 胶囊按钮 |
| 当前页 | - | `bg-[var(--accent-blue)] text-white` | 蓝色背景 |
| 其他页 | - | `text-[var(--text-light)] hover:bg-gray-100` | 悬停变灰 |
| 上一页按钮 | - | `w-10 h-10 rounded-full bg-[#F3F4F6] text-[var(--text-light)] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed` | 禁用时灰色 |
| 下一页按钮 | - | 同上一页 | 同上 |
| 页码间隔 | - | `w-10 text-center text-[var(--text-light)]` | "..." 分隔 |

#### F. 加载状态 (`<LoadingState>`)

| 区域 | 样式类名 | 说明 |
| :--- | :--- | :--- |
| 容器 | `flex-1 flex flex-col items-center justify-center` | 居中 |
| 加载动画 | `w-16 h-16 border-4 border-[var(--accent-blue)]/20 border-t-[var(--accent-blue)] rounded-full animate-spin` | 旋转动画 |
| 加载文本 | `mt-4 text-[var(--text-light)] font-bold` | "搜索中..." |

#### G. 空结果状态 (`<EmptyState>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 容器 | - | `flex-1 flex flex-col items-center justify-center` | 居中 |
| 插图 | - | `w-32 h-32 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-6` | 灰色圆形背景 |
| 图标 | 放大镜 + 问号 | `w-16 h-16 text-[var(--text-light)]` | 灰色图标 |
| 标题 | "未找到相关文档" | `text-xl font-bold text-[var(--text-dark)] mb-2` | - |
| 描述 | "请尝试其他关键词" | `text-sm text-[var(--text-light)]` | - |
| 重新搜索按钮 | - | `soft-btn mt-6` | 主按钮样式 |

#### H. 错误状态 (`<ErrorState>`)

| 区域 | 元素 | 样式类名 | 说明 |
| :--- | :--- | :--- | :--- |
| 容器 | - | `flex-1 flex flex-col items-center justify-center` | 居中 |
| 图标 | 警告图标 | `w-16 h-16 text-red-400 mb-4` | 红色 |
| 错误标题 | "搜索失败" | `text-xl font-bold text-[var(--text-dark)] mb-2` | - |
| 错误描述 | 具体错误信息 | `text-sm text-[var(--text-light)] mb-6` | - |
| 重试按钮 | - | `soft-btn` | 主按钮样式 |

---

## 4. 复杂交互动作说明

| 交互动作 | 触发条件 | 系统行为 | 动画/过渡 |
| :--- | :--- | :--- | :--- |
| 点击返回按钮 | 用户点击"← 返回" | 路由跳转回 `/reader` | 页面切换（React Router 默认） |
| 输入框回车触发 | 用户在搜索框按 Enter | 触发搜索，跳转 `/search?q=关键词` | 路由跳转 |
| 点击搜索结果 | 用户点击某条结果 | 新标签页打开 `/reader?repo=xxx&file=xxx` | `window.open()` |
| 切换仓库筛选 | 用户勾选/取消仓库 | 实时过滤结果列表 | 列表淡入淡出（150ms） |
| 切换匹配类型 | 用户勾选类型 | 实时过滤结果列表 | 列表淡入淡出（150ms） |
| 切换分页 | 用户点击页码 | 加载对应页结果 | 列表淡入淡出（150ms） |
| 悬停结果项 | 鼠标悬停在结果上 | 边框变蓝色 | `transition-all duration-200` |

---

## 5. 响应式策略

**本系统定位为桌面端 Web 应用，不考虑移动端适配。**

| 断点 | 行为 |
| :--- | :--- |
| `>= 1280px` | 左侧筛选面板 `w-64`（固定），结果区域自适应 |
| `1024px - 1279px` | 左侧筛选面板 `w-56`（略微收缩） |
| `< 102px` | 左侧筛选面板默认折叠，用户需点击展开按钮 |

---

## 6. 组件清单

| 组件名 | 文件路径 | 说明 |
| :--- | :--- | :--- |
| `Search` | `src/pages/Search.tsx` | 搜索结果页面主组件 |
| `FilterSidebar` | `src/pages/Search.tsx` 内联或拆分 | 左侧筛选面板 |
| `SearchResultItem` | `src/pages/Search.tsx` 内联或拆分 | 单条搜索结果 |
| `Pagination` | `src/components/Pagination.tsx` | 分页控件（可复用） |
| `LoadingState` | `src/components/LoadingState.tsx` | 加载状态组件 |
| `EmptyState` | `src/components/EmptyState.tsx` | 空结果状态（可复用） |
| `ErrorState` | `src/components/ErrorState.tsx` | 错误状态组件 |
