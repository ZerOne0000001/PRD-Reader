# 🛡️ 完成定义与知识更新机制 (Definition of Done)

蓝图最怕变成“死蓝图”。文档必须随着迭代一起演进。
本规范强制要求 AI 在完成任何一次版本迭代后，**必须将知识库更新 (Merge to Baseline) 作为发版的最后一环**。

## 1. DoD (Definition of Done) 核心要求

当你向用户报告“迭代已完成准备发版”之前，必须在内心确认以下三个问题：

1.  **代码层面**：我是否已经根据 `QA_Checklist.md` 完成了闭环自测？
2.  **沙箱清理**：我是否已经将 `03_Active_Iterations/当前Sprint/` 下的所有碎片化需求（产品设计、API 变更）全部提炼并智能合并到了 `01_Product_Baseline` 和 `02_Tech_Baseline` 中？
3.  **技术视角同步**：我是否引入了新的 npm 依赖、新的 Zustand Store 变量、或者修改了后端接口参数？如果是，我是否已经更新了基线中对应的模块映射？

## 2. 知识库自生长操作指南 (AI 必读)

当你执行 **Merge to Baseline** 时，请遵循以下原则：

*   **只增不减（对于 ADR）**：架构决策记录 (`Decision_Records/`) 只能新增，不能删除或随意篡改历史决策。如果旧决策被推翻，请新建一个 ADR 记录“为什么要推翻”。
*   **双向追溯更新**：如果你在 `02_Tech_Baseline/03_Features_Impl` 中增加了一个新组件的映射，请确保你在代码中也加上了适当的注释，方便未来的 AI 能够对应上。
*   **保持中文语境**：更新文档时，必须保持与现有文档一致的中文语境、Markdown 格式（如带有 emoji 图标的标题）。

## 3. 验收话术规范
在你的最后一次回复中，请包含类似如下的汇报结构，证明你已遵守 DoD：

> "✅ 迭代功能代码已实现并测试通过。
> 🔄 已执行 Blueprint Merge，同步更新基线：
> - 将 `Sprint_v1.2/PM_Drafts/xxx` 合并至 `01_Product_Baseline/04_Features_Design/F01_Home/Rules.md`。
> - 在 `02_Tech_Baseline/03_Features_Impl/F02_Reader/Trace.md` 中更新了状态机字段映射。
> 🗑️ 已归档当前迭代沙箱。"