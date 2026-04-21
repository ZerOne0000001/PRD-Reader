---
name: query-blueprint
description: 专门用于查询和调研本项目蓝图（Blueprint）的技能。当你需要进行新产品设计、了解现有功能、查阅技术架构或开始编写代码前，请使用此技能。当用户要求“调研蓝图”、“查一下现有功能”、“这个模块是怎么设计的”或类似问题时，请务必触发此技能！
---

# 🔍 调研蓝图 (Query Blueprint)

## 🎯 技能目标
帮助 AI 在执行开发或设计任务前，遵循“渐进式披露”原则，快速、精准地从 `Blueprint` 目录中获取所需的上下文，避免一次性加载过多无关信息导致注意力分散。

## 🗺️ 查阅路径 (Progressive Disclosure)
你需要根据用户的指令类型，严格遵循“双子星架构”进行按图索骥。**切勿直接扫描整个项目的所有代码文件或 Blueprint 目录**。

### 步骤 1：定位入口 (Bootstrap)
无论什么任务，首先读取 `docs/Blueprint/00_AI_Bootstrap.md`。这里面包含了所有目录的结构说明和核心指引。

### 步骤 2：明确任务类型与下钻路径
*   **如果是【产品设计/需求分析/交互优化】**：
    1.  首选读取 `docs/Blueprint/01_Product_Baseline/01_Target_Users/Index.md` 和 `02_Business_Flows/Index.md` 了解全局视角。
    2.  根据具体场景进行下钻查阅：
        *   **场景 A：在现有页面上进行改动**。直接进入 `docs/Blueprint/01_Product_Baseline/04_Features_Design/` 找到对应的功能模块，**强制要求查询并直接读取该模块 `Prototypes/` 目录下对应的 HTML 原型代码**，将其作为修改的绝对基准，防止破坏原有 UI 结构。同时结合 `UI_UX.md` 和 `Rules.md` 获取业务规则。
        *   **场景 B：设计现有系统的全新页面**。除了阅读目标模块的规则外，**必须查阅系统的全局视觉规范（如 `03_Glossary/Domain_UI.md` 等），并主动提取首页（如 `F01_Home/Prototypes/`）的实际 HTML 设计作为参考**，确保新页面的视觉和交互风格与现有系统保持高度一致。
    3.  如果遇到不认识的专业名词，去 `01_Product_Baseline/03_Glossary/` 下查找。

*   **如果是【代码迭代/Bug 修复/技术重构】**：
    1.  首选读取 `docs/Blueprint/02_Tech_Baseline/01_Architecture/Tech_Stack.md` 确认技术栈。
    2.  如果涉及前后端接口或状态机，阅读 `02_Tech_Baseline/02_Data_Contracts/` 下的契约文件（`API_Contract.md`, `State_Machines/Store_Contract.md`）。
    3.  如果涉及具体业务模块的代码修改，进入 `docs/Blueprint/02_Tech_Baseline/03_Features_Impl/` 找到对应功能（如 `F02_Reader`），阅读 `Impl.md` 和 `Trace.md`，获取精确的源码文件路径映射。
    4.  查阅 `Decision_Records/ADR.md` 了解是否存在历史架构决策限制。

*   **如果是【迭代中的碎片化需求】**：
    1. 如果用户要求你“根据当前迭代的需求进行开发”，首先去 `docs/Blueprint/03_Active_Iterations/` 下寻找当前正在进行的 Sprint 目录。
    2. 读取 `01_PM_Sandbox/` 和 `02_Tech_Sandbox/` 下的结构化文档，**并特别注意读取 `01_PM_Sandbox/` 对应功能模块下可能存在的 `Prototypes/` HTML 原型文件**，将它们作为最高优先级的上下文。

### 步骤 3：获取源码 (仅限技术任务)
在通过 `Trace.md` 映射表找到需要修改的代码文件路径后，再使用 `Read` 工具读取这些具体的 `.ts` 或 `.tsx` 文件。

### 步骤 4：反馈上下文
*   向用户简要汇报你从蓝图中获取了哪些关键信息，并确认是否准备好开始后续的执行工作。
*   **注意**：所有汇报必须使用**中文**。