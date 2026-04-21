---
description: 专门用于需求评审后，将非标、碎片化的原始产品材料，自动化提取并转换为符合 Blueprint 规范的结构化产品沙箱草案。当用户以产品口吻说出“需求归档”、“需求对焦”、“梳理一下PRD”、“帮我拆解下需求”、“准备开发了看下文档”、“生成产品沙箱”等日常用语时，自动触发此技能。
---

# 📦 提取产品沙箱 (Extract PM Sandbox)

## 🎯 技能目标
在开发写下第一行代码前，将人类编写的原始、碎片化 PRD（存放在 `00_Raw_Materials` 中）翻译并拆解为高度结构化的“蓝图增量”，存入 `01_PM_Sandbox`。

## 🗺️ 提取与结构化路径

### 步骤 1：读取原始输入
1.  定位到当前迭代目录（如 `docs/Blueprint/03_Active_Iterations/Sprint_X/`）。
2.  读取 `00_Raw_Materials/` 下的所有用户输入材料（可能包含文本描述、Markdown 片段等）。

### 步骤 2：对标基线 (Baseline Alignment)
1.  分析这些原始需求涉及了哪些具体的功能模块。
2.  查阅 `docs/Blueprint/01_Product_Baseline/04_Features_Design/` 下的对应目录（如 `F01_Home` 或新建 `F_XXX`）。
3.  **核心逻辑**：识别出原始材料中，哪些属于交互 UI (对应 `UI_UX.md`)，哪些属于业务逻辑 (对应 `Rules.md`)。

### 步骤 3：生成沙箱草案 (Generate Sandbox Drafts)
1.  在当前迭代的 `01_PM_Sandbox/` 下，**完全模仿**产品基线的目录结构创建草案文件。
2.  例如，如果修改了阅读区的搜索规则，则生成 `01_PM_Sandbox/F02_Reader/Rules_Draft.md`。
3.  **注意**：草案内容必须是**增量**描述，或者是对现有规则的**修改指令**，格式必须是机器可读的 Markdown 列表。
4.  **重要**：如果原始材料或需求设计中包含 HTML 原型页面（如存放在 `docs/prd/` 目录下），必须将该原型文件提取或复制到对应的沙箱模块中（如 `01_PM_Sandbox/F02_Reader/Prototypes/index.html`），以确保后续迭代时能提供准确的 UI 参考，避免 UI 不一致。

### 步骤 4：报告提取结果
*   完成生成后，向用户汇报：
    > "✅ 产品沙箱 (PM Sandbox) 已生成完毕！
    > - 从原始材料中提取了 `搜索防抖规则`，并存入 `01_PM_Sandbox/F02_Reader/Rules_Draft.md`。
    > - 开发现在可以基于此结构化沙箱开始编写代码。"