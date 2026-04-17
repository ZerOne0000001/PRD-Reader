# 业务流程图 (Business Flow)

## 1. 业务流程概述

本文档描述了 GitHub 集成功能的核心业务流程，包括平台配置、平台切换、文件浏览和仓库白名单管理等关键场景。

---

## 2. 平台配置与管理流程

### 2.1 管理员配置 GitHub 平台

```mermaid
flowchart TB
    subgraph 后台配置页面
        A([管理员进入后台]) --> B{选择平台}
        B -->|GitHub Tab| C[显示 GitHub 配置表单]
        C --> D[填写实例地址<br/>默认: https://github.com]
        D --> E[填写 Personal Access Token]
        E --> F[点击测试连接]
        F --> G{连接测试结果}
        G -->|成功| H[显示绿色已连接状态]
        G -->|失败| I[显示红色错误状态<br/>提示权限问题]
        H --> J[点击保存配置]
        J --> K[系统保存配置到 config.json]
        K --> L[自动刷新白名单区域]
        L --> M[添加仓库到白名单]
        M --> N[系统验证仓库可访问性]
        N --> O{验证结果}
        O -->|成功| P[仓库添加到白名单<br/>状态显示: 正常]
        O -->|失败| Q[显示错误提示<br/>仓库不存在或无权限]
    end
```

**关键节点说明**：

| 节点 | 说明 |
|:---|:---|
| 测试连接 | 调用 GitHub API `/user` 验证 Token 有效性 |
| 保存配置 | 将 GitHub 配置写入 `config.json` 的 `github` 字段 |
| 添加仓库 | 调用 GitHub API `/repos/{owner}/{repo}` 验证仓库可访问性 |

---

### 2.2 平台切换流程

```mermaid
flowchart LR
    subgraph 平台切换
        A([用户进入后台]) --> B[查看当前平台状态]
        B --> C{切换平台}
        C -->|点击 GitHub Tab| D[保存当前 GitLab 配置]
        D --> E[加载 GitHub 配置]
        E --> F[显示 GitHub Token 状态]
        F --> G{Token 状态}
        G -->|已配置| H[显示 GitHub 仓库白名单]
        G -->|未配置| I[提示配置 GitHub Token]
        H --> J[前台自动刷新<br/>显示 GitHub 仓库]
        I --> J
    end
```

**关键约束**：
- 切换平台时自动保存当前平台的配置
- 两个平台的配置独立存储，切换时完整加载
- 前台文件树自动刷新显示新平台的数据

---

## 3. 文件浏览流程

### 3.1 用户浏览仓库文件

```mermaid
flowchart TB
    subgraph 前台阅读页面
        A([用户打开首页]) --> B[系统加载当前平台配置]
        B --> C[获取仓库白名单]
        C --> D[显示仓库列表]
        D --> E[用户点击仓库]
        E --> F[调用 /api/repo/tree]
        F --> G{平台判断}
        G -->|GitLab| H[调用 GitLab Service]
        G -->|GitHub| I[调用 GitHub Service]
        H --> J[获取目录结构]
        I --> J
        J --> K[前端构建嵌套树]
        K --> L[渲染文件树组件]
        L --> M[用户展开目录]
        M --> N[递归加载子目录]
        N --> O[用户点击文件]
        O --> P{文件类型判断}
        P -->|.md| Q[调用 /api/repo/file<br/>渲染 Markdown]
        P -->|.html| R[调用 /api/repo/raw<br/>iframe 预览]
        P -->|图片| S[直接渲染图片]
        P -->|其他| T[下载或预览]
    end
```

---

### 3.2 Markdown 文档阅读流程

```mermaid
flowchart TB
    A([用户点击 .md 文件]) --> B[显示加载状态]
    B --> C[调用 /api/repo/file]
    C --> D[获取 Raw 文件内容]
    D --> E[Markdown 解析]
    E --> F{识别特殊语法}
    F -->|Mermaid 块| G[调用 Mermaid 渲染 SVG]
    F -->|普通代码块| H[语法高亮处理]
    G --> I[组装最终 HTML]
    H --> I
    I --> J[注入 TOC 目录]
    J --> K[渲染到阅读区]
    K --> L[用户阅读文档]
    L --> M[用户点击 TOC 章节]
    M --> N[平滑滚动到对应位置]
```

---

## 4. 仓库白名单管理流程

### 4.1 添加仓库到白名单

```mermaid
flowchart TB
    A([管理员输入仓库标识]) --> B{输入格式判断}
    B -->|owner/repo 格式| C[直接提取 owner 和 repo]
    B -->|仅 repo 名| D[使用默认 owner]
    C --> E[调用平台 API 验证仓库]
    D --> E
    E --> F{API 返回结果}
    F -->|200 OK| G[仓库存在]
    G --> H{是否已在白名单}
    H -->|否| I[添加到白名单]
    I --> J[保存 config.json]
    J --> K[返回成功响应]
    K --> L[前端刷新白名单列表]
    H -->|是| M[返回错误: 仓库已存在]
    F -->|404| N[返回错误: 仓库不存在]
    F -->|403| O[返回错误: 无访问权限]
    F -->|401| P[返回错误: Token 无效]
```

---

### 4.2 删除仓库从白名单

```mermaid
flowchart TB
    A([管理员 hover 仓库卡片]) --> B[显示删除按钮]
    B --> C[管理员点击删除]
    C --> D[直接从列表移除]
    D --> E[保存 config.json]
    E --> F[返回成功响应]
    F --> G[前端更新列表]
```

**关键设计决策**：
- **无二次确认**：删除操作直接执行，不弹出确认对话框（遵循现有交互设计）

---

## 5. 异常处理流程

### 5.1 平台连接异常处理

```mermaid
flowchart TB
    A([用户访问前台]) --> B[加载文件树]
    B --> C{请求结果}
    C -->|成功| D[正常显示文件树]
    C -->|失败| E[显示错误提示]
    E --> F[提示内容:<br/>连接失败，请联系管理员检查配置]
    F --> G[管理员进入后台]
    G --> H[查看配置状态]
    H --> I{错误类型}
    I -->|Token 无效| J[提示更新 Token]
    I -->|权限不足| K[提示需要对应权限]
    I -->|网络问题| L[提示检查网络连接]
    J --> M[管理员更新配置]
    K --> M
    L --> M
    M --> N[测试连接]
    N --> O{测试结果}
    O -->|成功| P[保存配置]
    O -->|失败| Q[返回继续排查]
    P --> R[前台刷新<br/>恢复正常]
```

---

## 6. 数据流转总图

```mermaid
flowchart LR
    subgraph 前端
        A[Admin.tsx]
        B[Reader.tsx]
        C[Home.tsx]
    end

    subgraph Zustand Store
        D[configStore]
        E[readerStore]
    end

    subgraph Express Routes
        F[/api/config]
        G[/api/repo/tree]
        H[/api/repo/file]
        I[/api/repo/raw]
    end

    subgraph Services
        J[configService]
        K[gitlabService]
        L[githubService]
    end

    subgraph External APIs
        M[GitLab API]
        N[GitHub API]
    end

    A -->|配置管理| D
    B -->|文件操作| E
    C -->|加载仓库| D
    D --> F
    E --> G
    E --> H
    E --> I
    F --> J
    G -->|platform=gitlab| K
    G -->|platform=github| L
    H --> K
    H --> L
    I --> K
    I --> L
    K --> M
    L --> N
    J -->|读写| O[(config.json)]
```

---

## 7. 流程关键节点汇总

| 流程名称 | 关键节点 | 异常处理 |
|:---|:---|:---|
| 配置 GitHub | 测试连接 → 保存配置 → 添加仓库 | Token 无效、权限不足 |
| 平台切换 | 加载配置 → 刷新文件树 | 配置为空、连接失败 |
| 文件浏览 | 加载文件树 → 渲染文件 → 渲染内容 | 网络超时、文件不存在 |
| 白名单管理 | 验证仓库 → 添加/删除 | 仓库已存在、无访问权限 |
