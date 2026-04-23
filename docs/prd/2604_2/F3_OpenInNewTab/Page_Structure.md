# 页面结构 (Page Structure)

**设备与端侧**：桌面端 Web (PC Web)
**影响范围**：修改 `interactive-prd-builder` 技能产出的 `Interactive_PRD.html` 模板结构。

## 全局导航与结构
*   **交互式 PRD 页面 (`Interactive_PRD.html`)**：现有的单页结构，左侧为 Markdown 渲染区，右侧为 iframe 预览区。本次新增一个悬浮控件。

## 页面分区拆解

### 1. 右侧原型预览容器 (`iframe-container`)
*   **现有元素**：`<iframe id="prototype-frame">`。
*   **新增控件**：**“在新标签页打开”外链悬浮图标 (Open in New Tab Icon)**
    *   **位置描述**：常驻于右侧 iframe 容器的右上角。
    *   **视觉表现**：
        *   默认状态：图标颜色较浅（如浅灰色/浅蓝色），且带有半透明（如 opacity: 0.6），以防遮挡原型自身的右上角操作区。
        *   悬停状态：恢复不透明度（opacity: 1），并可能伴随轻微的大小变化或背景加深。
    *   **交互流**：
        *   鼠标悬停 (Hover)：弹出原生 `title` 属性或自定义 Tooltip，提示“在新标签页中打开原型”。
        *   鼠标点击 (Click)：拦截点击事件，读取当前外层 URL 中 `#` 后的部分作为相对路径（如 `F2_Reader/home.html`），并调用 `window.open(path, '_blank')`。
