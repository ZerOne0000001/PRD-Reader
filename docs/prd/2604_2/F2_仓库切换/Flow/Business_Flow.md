# 业务流程设计 (Business_Flow) - F2_仓库切换

## 1. 核心业务流程描述

本流程涵盖了用户从访问系统、查阅独立仓库列表，到进入阅读器并使用下拉菜单进行仓库切换的完整闭环。

**关键节点与分支说明：**
1.  **入口分发**：系统首先根据 URL 判断是否携带 `?repo=` 参数。
2.  **独立列表页流转**：如果没有参数，则进入独立列表页，系统读取配置的白名单。若白名单为空，显示无数据提示；若有数据，渲染卡片列表。用户点击卡片后，跳转至阅读器并附带对应的 `?repo=` 参数。
3.  **阅读器内切换流转**：在阅读器内，用户点击左上角的仓库名称呼出下拉列表。如果选择“返回所有项目”，则清空参数跳转回列表页；如果选择另一个仓库，则更新 URL 参数，并触发阅读器内部的状态重置与数据重载。

## 2. 业务流程图 (泳道图)

```mermaid
flowchart TD
    %% 定义样式
    classDef startEnd fill:#1e1e1e,stroke:#333,stroke-width:2px,color:#fff,rx:10px
    classDef process fill:#2d3748,stroke:#4d4d4d,stroke-width:1px,color:#fff
    classDef decision fill:#4a5568,stroke:#718096,stroke-width:2px,color:#fff,shape:rhombus
    classDef page fill:#2b6cb0,stroke:#4299e1,stroke-width:2px,color:#fff
    classDef action fill:#2c7a7b,stroke:#63b3ed,stroke-width:1px,color:#fff,stroke-dasharray: 5 5

    %% 节点定义
    Start([用户访问系统]) ::: startEnd
    
    subgraph 路由分发层
        CheckURL{URL是否包含<br>?repo=参数?} ::: decision
    end

    subgraph 独立仓库列表页
        RenderList[渲染仓库列表页] ::: page
        LoadConfig[读取白名单配置] ::: process
        CheckData{白名单<br>是否为空?} ::: decision
        ShowEmpty[显示无可用仓库提示] ::: process
        ShowCards[渲染仓库卡片网格] ::: process
        ClickCard[用户点击某个仓库卡片] ::: action
    end

    subgraph Reader阅读器
        RenderReader[渲染阅读器页面] ::: page
        FetchTree[根据repo参数<br>拉取文件树] ::: process
        ShowReader[展示左侧文件树<br>与右侧内容] ::: process
        
        ClickDropdown[点击左上角仓库名称] ::: action
        ShowDropdown[弹出下拉仓库列表] ::: process
        SelectAction{用户选择<br>什么操作?} ::: decision
        
        SelectOtherRepo[选择其他仓库] ::: action
        SelectReturn[选择返回所有项目] ::: action
        
        UpdateURLRepo[更新URL ?repo=新仓库<br>清空 ?file=参数] ::: process
        ClearURL[清空URL所有参数<br>跳转回根路由 /] ::: process
    end

    %% 连线关系
    Start --> CheckURL
    
    %% 列表页分支
    CheckURL -->|否 (如访问 /)| RenderList
    RenderList --> LoadConfig
    LoadConfig --> CheckData
    CheckData -->|是| ShowEmpty
    CheckData -->|否| ShowCards
    ShowCards --> ClickCard
    ClickCard --> RenderReader
    
    %% 阅读器分支
    CheckURL -->|是 (带参数)| RenderReader
    RenderReader --> FetchTree
    FetchTree --> ShowReader
    
    %% 切换交互闭环
    ShowReader --> ClickDropdown
    ClickDropdown --> ShowDropdown
    ShowDropdown --> SelectAction
    
    SelectAction -->|点击其他仓库| SelectOtherRepo
    SelectOtherRepo --> UpdateURLRepo
    UpdateURLRepo --> FetchTree
    
    SelectAction -->|点击返回| SelectReturn
    SelectReturn --> ClearURL
    ClearURL --> RenderList
```
