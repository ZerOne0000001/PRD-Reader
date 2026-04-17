# 🔌 前后端交互协议 (API Contract)

本系统的后端作为一个轻量级 Proxy，主要负责配置管理和代理 GitLab/GitHub 请求。

## 1. 基础约定
*   **API 前缀**：所有业务接口以 `/api` 开头。
*   **数据格式**：默认返回 JSON，标准响应体结构为：
    ```json
    {
      "success": true, // 或 false
      "data": {},      // 成功时返回的数据
      "error": "..."   // 失败时的错误信息
    }
    ```
*   **鉴权机制**：除 `/api/auth/*` 外，其余 `/api/config/*` 需校验本地密码。`/api/repo/*` 路由在中间件层会自动校验并挂载全局的 `config.json` 数据（Token）。

## 2. 配置模块 (`/api/config`)

### 2.1 获取系统配置
*   **路由**：`GET /api/config`
*   **功能**：返回当前的平台选择（`platform`）、GitLab 配置对象和 GitHub 配置对象。

### 2.2 保存系统配置
*   **路由**：`POST /api/config`
*   **请求体**：
    ```json
    {
      "platform": "gitlab | github",
      "gitlab": {
        "instanceUrl": "string",
        "token": "string",
        "repositories": [
          {
            "id": "string",
            "name": "string",
            "path": "string",
            "default_branch": "string",
            "status": "正常 | 异常"
          }
        ]
      },
      "github": {
        "instanceUrl": "string",
        "token": "string",
        "repositories": [ ... ]
      }
    }
    ```

## 3. 代码托管平台代理模块 (`/api/github` & `/api/gitlab`)
*后端为不同平台提供独立的路由前缀，前端根据当前激活的 `platform` 动态调用对应的接口。*

### 3.1 获取白名单仓库的文件树
*   **路由**：`GET /api/github/tree` 或 `GET /api/gitlab/tree`
*   **Query 参数**：
    *   `repo` (可选)：指定仓库名称、ID 或路径。若提供，则仅返回该单个仓库的目录树数据。
*   **响应体**：
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "1344",
          "name": "B端大框架",
          "path": "product/Bduan_PRD",
          "status": "正常",
          "tree": [
            {
              "id": "node_hash",
              "name": "F1_GitlabFileViewer",
              "type": "tree",
              "path": "F1_GitlabFileViewer",
              "mode": "040000"
            }
          ]
        }
      ]
    }
    ```
*   **注**：后端返回的 `tree` 是扁平化数据，前端状态机会负责将其转换为嵌套树。

### 3.2 获取文本文件内容 (Markdown)
*   **路由**：`GET /api/github/file` 或 `GET /api/gitlab/file`
*   **Query 参数**：
    *   `projectId` 或 `owner/repoName` (必填)
    *   `filePath` (必填，需 URL Encode)
    *   `ref` (可选，默认取 default_branch)
*   **响应体**：直接返回 Raw 文本内容（不包裹在 JSON 中），设置了对应的 `Content-Type`。

### 3.3 虚拟静态资源路由 (图片与 HTML)
*   **路由**：`GET /api/github/raw/:projectId/*` 或 `GET /api/gitlab/raw/:projectId/*`
*   **功能**：专门为 HTML 原型和图片设计的路由，支持真实路径访问。
*   **机制**：根据文件后缀动态设置 `Content-Type`（如 `text/html`, `image/png`），直接返回 Buffer。前端通过此路由作为 `iframe` 或 `img` 的 `src`。