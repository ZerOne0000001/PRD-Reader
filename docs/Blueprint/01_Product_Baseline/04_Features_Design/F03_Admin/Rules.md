# ⚖️ 业务规则：后台配置 (F03_Admin)

## 1. 鉴权规则
*   **默认密码**：硬编码为 `Aa@000000`。
*   **Token 权限要求**：
    *   **GitLab**：需要 `read_api` 权限的 Personal Access Token (PAT) 或 Project Access Token。
    *   **GitHub**：需要 `public_repo` + `repo` 权限的 Personal Access Token (Classic 或 Fine-grained)。

## 2. 平台隔离规则
*   **数据结构隔离**：GitLab 和 GitHub 的配置（实例地址、Token、白名单列表）在后端存储中必须是完全隔离的两套数据。
*   **列表动态过滤**：后台的仓库白名单列表仅展示**当前激活平台**下的仓库。

## 3. 仓库白名单规则
*   **添加仓库格式**：
    *   **GitLab**：支持 Project ID（如 `12345`）或路径（如 `group/project`）。
    *   **GitHub**：支持 `owner/repository` 格式。
*   **移除规则**：
    *   移除后立刻生效，无需二次确认。
    *   前台用户刷新页面时左侧文件树将不再展示该仓库。

## 4. 状态反馈规则
*   **连接状态**：配置界面必须实时显示当前平台的连通性状态。
*   **测试连接**：点击“测试连接”时，调用对应平台的 API 验证 Token 的有效性。