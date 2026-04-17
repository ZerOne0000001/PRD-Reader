# 业务流程图 (Business Flow)

## 1. 核心流程描述
本系统作为一个纯前端代理展示平台，其核心业务流程主要围绕“文件检索”和“内容渲染”展开。
1.  **初始化与鉴权**：用户访问系统首页，系统前端向后端请求“可见仓库白名单”。后端使用预置的全局只读 Token 向 GitLab API 确认权限并返回仓库列表。
2.  **文件树浏览**：用户点击某个仓库，前端按需（懒加载）请求该仓库的目录树结构并渲染。
3.  **全局搜索**：用户在顶部输入关键词，后端代理请求 GitLab 的跨项目 Search API，并将匹配结果返回给前端展示。
4.  **文件阅读与预览**：
    *   当用户点击 `.md` 文件时：前端获取 Raw 文件内容，通过 Markdown 解析器转换为 HTML，并调用 Mermaid.js 渲染图表，最后在右侧主视图展示。
    *   当用户点击 `.html` 文件时：前端获取 Raw 文件内容，构建一个安全的 `iframe` 或直接在新窗口打开，以网页形式预览该 HTML。
    *   其他不支持的文件类型：提示无法预览或提供下载链接。

## 2. 业务流程图 (泳道图)

```mermaid
flowchart TD
    %% 定义角色/泳道
    subgraph User [产品或技术人员]
        A[访问平台首页]
        E[浏览左侧文件树]
        F[在搜索框输入关键词]
        I[点击具体文件 .md或.html]
        M[阅读文档或预览原型]
    end

    subgraph Frontend [前端 Web 平台]
        B[请求初始化数据]
        D[渲染可见仓库列表]
        G[展示搜索结果列表]
        J{判断文件类型}
        K1[请求 Raw Markdown 并解析渲染]
        K2[请求 Raw HTML 并构建 iframe 预览]
        K3[提示不支持预览]
    end

    subgraph Backend [后端代理服务]
        C[读取白名单配置并使用全局 Token 校验]
        H[调用 GitLab 全局 Search API]
        L[调用 GitLab Repository API 获取文件内容]
    end

    subgraph GitLab [GitLab 服务端]
        API1[返回仓库或目录信息]
        API2[返回搜索匹配数据]
        API3[返回 Raw 文件流]
    end

    %% 流程连线
    A --> B
    B --> C
    C --> API1
    API1 --> C
    C --> D
    D --> E
    D --> F
    
    %% 搜索分支
    F --> H
    H --> API2
    API2 --> H
    H --> G
    G --> I

    %% 浏览分支
    E --> I

    %% 文件渲染分支
    I --> J
    J -->|.md| K1
    J -->|.html| K2
    J -->|其他| K3
    
    K1 --> L
    K2 --> L
    L --> API3
    API3 --> L
    L --> K1
    L --> K2
    
    K1 --> M
    K2 --> M
```
