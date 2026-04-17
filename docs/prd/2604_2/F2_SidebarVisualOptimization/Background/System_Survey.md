# 系统调研与上下文分析 (System Survey)

## 1. 调研背景
本次需求是对现有系统 PRD-Reader 的 `Reader` 页面侧边栏 (Sidebar) 进行视觉和交互的迭代升级。主要解决的问题是长文件名显示不全导致的阅读体验不佳。

## 2. 现有系统核心逻辑与架构预判
*   **侧边栏组件**: 现有的侧边栏通常采用树状结构 (Tree/Nested List) 进行渲染。它负责展示项目的目录层级。
*   **当前布局约束**: 侧边栏可能拥有一个固定的宽度 (如 `width: 250px`) 或者是基于 Flex/Grid 布局的固定占比。当前的文件名节点 (`node` 或 `item`) 可能没有做超长文本处理，导致溢出容器或被硬性切断。
*   **DOM 结构预想**: 
    ```html
    <div class="sidebar">
      <div class="tree-node">
         <span class="icon">📁</span>
         <span class="label">Requirement_Background_Very_Long_Name.md</span>
      </div>
    </div>
    ```

## 3. 受影响的现有页面或模块
*   **核心影响页面**: `Reader` 页面 (`Reader.tsx` / `Reader.html`)。
*   **受影响的组件**: 侧边栏容器 (Sidebar Container) 和 树节点渲染项 (Tree Node Item)。
*   **潜在关联影响**: 
    *   侧边栏宽度的增加/拖拽可能会压缩主阅读区域 (Main Content Area) 的宽度。需要确保主区域具备良好的响应式能力。
    *   Tooltip 组件的引入需要考虑 `z-index` 层级，防止被其他全屏或悬浮元素遮挡。

## 4. 约束与依赖 (Constraints & Dependencies)
*   **性能约束**: 侧边栏在渲染包含大量文件的大型项目时，DOM 节点较多。
    *   **截断方案约束**: 必须采用高性能的纯 CSS (`text-overflow: ellipsis`) 方案，避免遍历 DOM 计算文本长度导致的卡顿。
    *   **Tooltip 约束**: 需要确保自定义 Tooltip 仅在发生截断的元素上、且用户悬停一定时间（防抖延迟，如 300ms）后才触发渲染，避免不必要的 DOM 性能消耗。
*   **布局约束**: 拖拽调整宽度的功能必须设定合理的边界值（`min-width` 和 `max-width`），防止用户将侧边栏拖拽到不可用的状态。
*   **样式约束**: Tooltip 和侧边栏新字号/间距必须与 PRD-Reader 现有的设计系统（暗黑/明亮模式等）保持一致。

## 5. 调研结论与技术选型方向
1.  **截断处理**: 采用 **纯 CSS 单行截断 (方案 A)**。通过 `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis` 实现。
2.  **完整名称提示**: 采用 **自定义 Tooltip 组件**。不使用原生 `title` 属性，以保证视觉风格统一、延迟可控以及防遮挡。
3.  **宽度调整**: 引入侧边栏边缘拖拽交互，使用 CSS 变量或状态管理控制侧边栏宽度，主区域自适应伸缩。