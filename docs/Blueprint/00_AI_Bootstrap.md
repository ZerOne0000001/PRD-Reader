# 🤖 Blueprint 蓝图 - AI 引导协议

## 1. 角色定位与目标
欢迎介入 PRD-Reader 项目！
在这个项目中，你既是**产品经理**也是**全栈工程师**。为了防止上下文污染并确保设计/代码与现有系统的高度一致性，请你在执行任何任务前，**严格遵守本蓝图（Blueprint）的双子星架构与迭代工作流**。

## 2. 蓝图架构与查阅规则 (Progressive Disclosure)
**严禁**一开始就全盘扫描代码库或读取整个蓝图！请根据你的任务角色，按需顺藤摸瓜：

### 2.1 蓝图目录结构说明
*   **`01_Product_Baseline/` (产品基线)**：纯业务视角的当前快照。包含目标用户、业务主流程、产品名词解释、以及具体功能的产品设计说明（PRD、交互、规则）。
*   **`02_Tech_Baseline/` (技术基线)**：纯工程视角的当前快照。包含系统架构、数据库结构、状态机契约、以及具体功能的技术实现细节和代码映射。
*   **`03_Active_Iterations/` (迭代沙箱)**：当前正在进行的版本迭代工作区。
*   **`04_QA_And_DoD/` (质量与完成定义)**：代码交付前的强制检查项。

### 2.2 查阅路径指引 (Query Blueprint)
*   **当你需要做“产品设计/需求调研”时**：
    1. 先阅读 `01_Product_Baseline/01_Target_Users/Index.md` 和 `02_Business_Flows/Index.md`。
    2. **若是在现有页面上进行改动**：进入 `01_Product_Baseline/04_Features_Design/` 查找对应功能，**必须直接读取该功能下 `Prototypes/` 目录中的对应 HTML 原型文件**，将其作为修改的绝对基准。
    3. **若是设计现有系统的全新页面**：必须参考全局视觉规范，并**主动读取首页（如 `F01_Home/Prototypes/`）的实际设计 HTML** 作为整体视觉参考和对标。
*   **当你需要做“代码开发/Bug 修复”时**：
    1. 你当前的上下文 = `01_Product_Baseline` + `02_Tech_Baseline` + 当前迭代沙箱中的 `PM_Sandbox` 增量需求。
    2. 进入 `02_Tech_Baseline/03_Features_Impl/` 获取对应的源码文件路径映射。
    3. 查阅 `02_Tech_Baseline/02_Data_Contracts/` 了解强契约。

## 3. 标准迭代工作流 (Workflow: Event-Driven)
本项目采用“事件驱动”的自动化沙箱管理机制，所有迭代必须严格遵守以下三个节点：

1.  **节点 1：评审后生成产品沙箱 (extract-pm-sandbox)**
    *   **触发**：需求评审完毕。
    *   **动作**：将人类编写的原始、碎片化 PRD 放入 `03_Active_Iterations/当前Sprint/00_Raw_Materials/`。调用对应 Skill，让 AI 将这些原始材料翻译为高度结构化的增量草案，存入 `01_PM_Sandbox/`。
    *   **开发依据**：开发写代码时，只看基线和 `PM_Sandbox` 中的结构化增量。

2.  **节点 2：上线后生成技术沙箱 (generate-tech-sandbox)**
    *   **触发**：代码合并到 main 分支并发布上线。
    *   **动作**：调用对应 Skill，让 AI 根据真实的 Git Diffs 和代码变更，**逆向工程**生成技术实现草案，存入 `02_Tech_Sandbox/`。确保文档绝对诚实。

3.  **节点 3：迭代收尾合并基线 (update-blueprint)**
    *   **触发**：技术沙箱生成完毕并 Review 通过。
    *   **动作**：调用对应 Skill，将 `PM_Sandbox`（产品意图）和 `Tech_Sandbox`（技术事实）智能合并 (Merge) 到 `01_Product_Baseline` 和 `02_Tech_Baseline` 中。归档当前沙箱，迎接下一次迭代。

## 4. 输出与交互规范
1. **中文沟通**：所有输出（设计文档、代码注释、向用户汇报的内容）**必须使用中文**。
2. **代码修改规范**：遵循现有的 Zustand 状态管理、Tailwind 样式规范，复用现有的接口契约。
3. **闭环自测**：交付代码前必须根据 `04_QA_And_DoD/QA_Checklist.md` 走查逻辑。