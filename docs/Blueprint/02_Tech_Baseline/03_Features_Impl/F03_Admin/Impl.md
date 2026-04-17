# ⚙️ 后台配置模块实现细节 (F03_Admin)

## 1. 代码文件级映射 (Traceability Matrix)

| 职责域 | 核心文件路径 | 核心作用与说明 |
| :--- | :--- | :--- |
| **前端视图 (React)** | `src/pages/Admin.tsx` | 管理员控制台页面，包含多平台切换、Token 输入区和白名单列表管理。 |
| **状态机 (Zustand)** | `src/store/configStore.ts` | 管理系统配置的读取、修改、保存、以及连通性测试。 |
| **后端路由 (Express)** | `api/routes/config.ts` | 提供 `/api/config` 相关的 GET / POST 接口。 |
| **底层服务 (Node.js)** | `api/services/configService.ts` | 直接操作根目录的 `config.json` 文件进行持久化存储。 |
| **配置文件** | `config.json` | JSON 格式的持久化存储。 |

## 2. 核心功能逻辑

### 2.1 全局配置保存
*   **交互**：用户在后台输入新的实例地址和 Token，点击保存。
*   **流转**：
    1.  触发 `useConfigStore().saveConfig()`，向后端发起 `POST /api/config` 请求。
    2.  后端路由 `config.ts` 接收数据，调用 `configService.saveConfig()`。
    3.  `configService` 使用 `fs.writeFileSync` 同步写入根目录下的 `config.json`。
*   **注意**：保存后通常需要触发一次连接测试，验证 Token 权限。

### 2.2 仓库白名单管理
*   **交互**：用户输入仓库 ID 或路径，点击添加。
*   **流转**：
    1.  触发 `useConfigStore().addRepository()`，前端通过代理接口获取该仓库的具体信息。
    2.  若存在且可访问，将其追加到对应平台的 `repositories` 数组中。
    3.  调用 `saveConfig` 持久化到后端。
*   **删除交互**：鼠标悬停出现垃圾桶，点击即删，无需弹窗二次确认。删除后立刻调用 `saveConfig` 保存状态。

## 3. 安全与隔离约束
*   **后台访问控制**：前端在进入 `Admin.tsx` 前，必须进行鉴权拦截（通过输入密码 `Aa@000000`）。
*   **后端白名单硬校验**：即使前端恶意发起了获取某个未配置仓库的文件请求，后端在代理层必须拦截请求，返回 `403 Forbidden`，防止数据越权访问。