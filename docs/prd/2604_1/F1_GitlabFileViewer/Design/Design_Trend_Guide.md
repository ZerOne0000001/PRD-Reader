# 设计倾向指南 (Design Trend Guide)

## 1. 核心调性 (Tone & Purpose)
*   **Purpose**: 为产品和技术人员提供一个极速、沉浸式、跨项目的 GitLab 文件查阅平台。核心在于“高频切换”与“长时间阅读”。
*   **Tone**: **Notion-esque (清新阅读风)**。拒绝沉闷的传统后台灰，拒绝过度修饰的渐变色。追求极致的干净、大面积留白、细致的排版层次。

## 2. 排版规范 (Typography - 核心灵魂)
*   **字体栈**: 优先使用系统原生无衬线字体，确保阅读清晰度。
    *   `font-sans`: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
    *   `font-mono` (代码块专属): `JetBrains Mono, "Fira Code", Consolas, monospace`
*   **字号与行高 (Markdown 阅读区严格要求)**:
    *   正文：`text-base` (16px)，行高 `leading-relaxed` (1.625)，段落间距适中。
    *   标题：对比强烈。H1 `text-3xl font-bold tracking-tight`，H2 `text-2xl font-semibold`，H3 `text-xl font-medium`。
    *   色彩层级：主标题/正文使用 `text-gray-900`，辅助信息（如侧边栏文件数、面包屑）使用 `text-gray-500`。

## 3. 色彩与主题 (Color & Theme)
*   **背景色**: 
    *   左侧侧边栏：极浅的灰色 `bg-gray-50/80` (带轻微毛玻璃效果更好)。
    *   右侧阅读区：纯白 `bg-white`。
*   **强调色 (Accent Color)**: 
    *   克制的点缀色。不使用大面积高饱和色块。
    *   选中状态、链接、核心按钮使用柔和的蓝色或中性黑（如 `text-blue-600`, `bg-gray-100` 表示选中）。
*   **边框与分割**: 
    *   极其微弱的分割线。使用 `border-gray-200` 或干脆用空间留白代替线条。

## 4. 空间与交互 (Spatial Composition & Interaction)
*   **侧边栏 (Sidebar)**: 
    *   无明显边界感，通过背景色区分。
    *   悬浮(Hover)项背景变为 `bg-gray-200/50`，圆角 `rounded-md`。
    *   文件图标必须精致（如使用 Heroicons 的 SVG）。
*   **主视图 (Main View)**: 
    *   内容区域必须居中且限制最大宽度（如 `max-w-3xl` 或 `max-w-4xl`），保证视线追踪的舒适度（避免满屏宽度的文字）。
    *   顶部面包屑导航粘性定位 (Sticky header) 且背景带毛玻璃效果 `backdrop-blur-md bg-white/90`。
*   **微交互**: 
    *   所有的状态切换（展开折叠、Hover）必须有极短的过渡动画 `transition-all duration-150 ease-in-out`。

## 5. 必须实现的页面状态 (Required States in Prototype)
原型必须在一个 HTML 文件中通过 JavaScript 模拟以下状态切换：
1.  **初始态**: 左侧树加载完毕，右侧展示欢迎占位图。
2.  **搜索交互**: 点击顶部搜索框，弹出全局搜索面板 (Modal/Popover)。
3.  **阅读 Markdown**: 点击左侧 `.md` 文件，右侧渲染带 TOC（右侧悬浮目录）的精美富文本页面。
4.  **预览 HTML**: 点击左侧 `.html` 文件，右侧主视图变为全屏宽度的 iframe 容器模式。
