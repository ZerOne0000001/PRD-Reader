# ⚙️ 核心基建与权限名词 (Domain_Core)

| 中文术语 | 英文术语 (代码中常用) | 释义与语境 |
| :--- | :--- | :--- |
| **全局访问令牌** | Global Token | 具有 `read_api` 权限的 GitLab 个人或项目访问令牌。系统后端统一使用该令牌代理所有请求。前端用户无感。 |
| **仓库白名单** | Repositories Whitelist / Repos | 系统后台配置的、允许在前台展示的 GitLab 仓库列表。前端左侧树状结构的根节点集合。 |
| **实例地址** | Instance URL | GitLab 服务的根域名，例如 `http://192.168.10.122/`。 |
| **原生文件 / 原始数据** | Raw File / Blob | 直接从 GitLab API 获取的未被解析的文本或二进制文件内容。 |
| **虚拟父节点** | Virtual Parent Node | 前端状态机在处理 GitLab 扁平树结构时，若发现缺少父级目录数据，自动补齐的虚拟目录节点对象。 |