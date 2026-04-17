# 业务与交互流程 (Business Flow)

由于本需求偏向纯前端的视觉与交互优化，不涉及复杂的后端业务状态流转，此处的“业务流程”主要描述用户在界面上的**交互操作流与系统组件的状态响应**。

```mermaid
flowchart TD
    %% 参与者/实体定义
    User([用户])
    Sidebar[侧边栏容器]
    Node[目录树节点文本]
    Tooltip[自定义 Tooltip 组件]
    
    %% 流程开始
    User -->|进入 Reader 页面| Init[渲染初始状态]
    
    %% 初始状态判定
    Init --> Sidebar
    Sidebar -->|应用新默认宽度和字号| RenderTree[渲染目录树]
    RenderTree --> Node
    
    %% 截断判定逻辑 (核心)
    Node --> CheckTruncation{文本实际宽度 > 节点可用宽度?}
    CheckTruncation -->|Yes| Truncate[触发 CSS 截断\n显示省略号 '...']
    CheckTruncation -->|No| Normal[完整显示文本\n无省略号]
    
    %% Hover 交互逻辑
    User -->|鼠标悬停在节点上| HoverAction{节点状态?}
    HoverAction -->|Normal状态节点| Ignore[忽略, 不触发任何提示]
    HoverAction -->|Truncate状态节点| Wait[开始计时 (防抖延迟如 300ms)]
    
    Wait --> UserMove{鼠标在延迟期间移开?}
    UserMove -->|Yes| Cancel[取消 Tooltip 渲染]
    UserMove -->|No| ShowTooltip[渲染并显示 Tooltip\n展示完整文件名]
    
    ShowTooltip --> UserLeave[用户鼠标移开节点]
    UserLeave --> HideTooltip[销毁/隐藏 Tooltip]
    
    %% 拖拽调整宽度逻辑
    User -->|鼠标移动到侧边栏右边缘| ResizeCursor[光标变为调整样式]
    ResizeCursor -->|按住并拖拽| Drag[动态更新侧边栏宽度]
    Drag --> LimitCheck{超出最大/最小宽度限制?}
    LimitCheck -->|Yes| Clamp[宽度限制在边界值]
    LimitCheck -->|No| ApplyWidth[应用新宽度]
    ApplyWidth --> RenderTree
    Clamp --> RenderTree
```