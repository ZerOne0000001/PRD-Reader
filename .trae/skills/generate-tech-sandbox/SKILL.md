---
name: generate-tech-sandbox
description: 专门用于迭代上线后，根据真实的代码变更（Git Diff）逆向工程，自动化生成结构化的技术沙箱草案。当用户以技术口吻说出“代码上线了”、“更新下技术文档”、“提取下这次的改动”、“跑一下代码分析”、“反向生成下文档”、“生成技术沙箱”等日常用语时，自动触发此技能。
---

# 💻 逆向生成技术沙箱 (Generate Tech Sandbox)

## 🎯 技能目标
在代码合并并发布上线后，消除“开发不写文档”的痛点。基于**真实的 Git Diffs 和代码变更**，在迭代沙箱中生成技术实现草案，确保文档绝对诚实，这是 Blueprint 永远的 Single Source of Truth。

## 🗺️ 逆向工程路径

### 步骤 1：定位当前的迭代与变更
1.  找到当前正在进行的迭代沙箱（如 `docs/Blueprint/03_Active_Iterations/Sprint_X/`）。
2.  通过分析本次迭代的 `Git Diffs`（用户可能通过提示词提供，或你可以利用系统工具扫描本地代码变更）。

### 步骤 2：对标基线 (Baseline Alignment)
1.  识别变更了哪些核心代码（如新增了路由、修改了 `Zustand` 状态、引入了新组件）。
2.  查阅 `docs/Blueprint/02_Tech_Baseline/` 下对应的技术架构、数据契约或 `03_Features_Impl/` 映射。

### 步骤 3：逆向生成沙箱草案 (Reverse Engineering)
1.  在当前迭代的 `02_Tech_Sandbox/` 下，**完全模仿**技术基线的目录结构创建草案文件。
2.  例如：
    *   如果后端新增了 `/api/search` 路由，生成 `02_Tech_Sandbox/02_Data_Contracts/API_Change_Draft.md`。
    *   如果前端在 `readerStore.ts` 中新增了 `searchKeyword` 状态，生成 `02_Tech_Sandbox/02_Data_Contracts/State_Machines/Store_Change_Draft.md`。
    *   如果新增了搜索组件，更新 `02_Tech_Sandbox/03_Features_Impl/F02_Reader/Trace_Update.md` 映射表。

### 步骤 4：报告生成结果
*   完成生成后，向用户汇报：
    > "✅ 技术沙箱 (Tech Sandbox) 已逆向生成完毕！
    > - 分析代码变更，提取了 `/api/search` 的 API 变更草案，存入 `02_Tech_Sandbox/02_Data_Contracts/API_Change_Draft.md`。
    > - 更新了 `F02_Reader` 的代码映射表。
    > - 准备就绪，可以执行合并基线 (update-blueprint) 动作。"