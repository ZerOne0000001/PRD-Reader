---
name: update-blueprint
description: 专门用于执行知识合并（Merge to Baseline）的技能。在迭代上线且技术沙箱生成后，或者用户明确要求“迭代归档”、“归档迭代”、“沉淀知识”、“执行 Blueprint Merge”、“合并迭代沙箱”时，必须触发此技能，以确保沙箱中的增量信息被智能合并到蓝图基线中，保持知识库的最新状态。
---

# ✍️ 更新并合并蓝图 (Update Blueprint & Merge)

## 🎯 技能目标
将迭代沙箱（Active Iterations）中结构化的产品沙箱（`01_PM_Sandbox`）和技术沙箱（`02_Tech_Sandbox`），智能合并到蓝图的基线（Product/Tech Baseline）中，完成知识的沉淀与版本更迭。

## 🗺️ 更新原则与路径
你需要遵循“双子星架构”和“增量合并”的原则，确保合并过程丝滑且无信息损耗。

### 步骤 1：定位当前的迭代沙箱
1.  读取 `docs/Blueprint/03_Active_Iterations/` 目录，找到当前正在进行的迭代（如 `Sprint_v1.2`）。
2.  读取该沙箱内的 `Meta.md`，了解本次迭代的核心目标。

### 步骤 2：执行产品基线合并 (Product Baseline Merge)
1.  遍历沙箱内 `01_PM_Sandbox/` 下的所有结构化草案和原型文件。
2.  对于每一个草案，根据其所属的功能模块（如 `F01_Home` 或 `F02_Reader`），定位到 `docs/Blueprint/01_Product_Baseline/04_Features_Design/` 下的对应目录。
3.  如果修改了交互或 UI，使用 SearchReplace 工具更新对应的 `UI_UX.md`；如果修改了业务规则，更新对应的 `Rules.md`。
4.  如果新增了全局名词或用户角色，更新 `01_Target_Users` 或 `03_Glossary`。
5.  **重要**：如果沙箱中或本次迭代中产出了 HTML 原型页面（如存放在 `01_PM_Sandbox/F_XXX/Prototypes/` 目录下），必须将其复制并沉淀到 `01_Product_Baseline/04_Features_Design/F_XXX/Prototypes/` 中，以确保产品设计的 UI 原型永久存在于蓝图基线中，防止后续迭代在现有页面修改时发生 UI 不一致。

### 步骤 3：执行技术基线合并 (Tech Baseline Merge)
1.  遍历沙箱内 `02_Tech_Sandbox/` 下的所有技术草案。
2.  根据草案内容，更新 `docs/Blueprint/02_Tech_Baseline/` 下对应的 `API_Contract.md`, `Store_Contract.md` 或具体的 `Trace.md` 映射文件。
3.  如有重大架构决策，必须在 `02_Tech_Baseline/01_Architecture/Decision_Records/` 下新增一个 `ADR` 文件。

### 步骤 4：冲突解决与沙箱归档
*   如果发现沙箱中的需求与基线中的逻辑有严重冲突，必须向用户汇报并请求人工裁决，不要强行覆盖。
*   如果合并顺利完成，在最后归档当前的迭代沙箱目录。

### 步骤 5：验收汇报
*   向用户进行简短汇报，列出你具体合并了哪些文件。
*   汇报格式参考：
    > "✅ Blueprint 已成功合并：
    > - 将 `01_PM_Sandbox/F02_Reader/Rules_Draft.md` 的内容追加到了 `01_Product_Baseline/04_Features_Design/F02_Reader/Rules.md` 中。
    > - 将 `01_PM_Sandbox/F02_Reader/Prototypes/index.html` 同步到了 `01_Product_Baseline/04_Features_Design/F02_Reader/Prototypes/` 中。
    > - 将 `02_Tech_Sandbox/02_Data_Contracts/API_Change_Draft.md` 中的 `/api/search` 路由定义合并到了 `02_Tech_Baseline/02_Data_Contracts/API_Contract.md`。
    > - 沉淀了新的状态机定义到 `02_Tech_Baseline/02_Data_Contracts/State_Machines/Store_Contract.md`。
    > - **当前迭代沙箱已归档。**"