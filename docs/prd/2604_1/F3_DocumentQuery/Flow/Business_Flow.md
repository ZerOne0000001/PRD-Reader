# 业务流程图 (Business Flow) - F2 文档查询功能

## 1. 业务流程概述

本文档描述文档查询功能的完整业务流程，包括用户交互、前后端协作和数据流转。

---

## 2. 核心业务流程

### 2.1 搜索主流程

```mermaid
flowchart TD
    Start([用户进入 Reader 页面])
    Start --> InputSearch[用户输入搜索关键词]
    InputSearch --> ClickSearch[用户点击搜索按钮]
    ClickSearch --> Navigate[/search?q=关键词]
    Navigate --> ShowLoading[展示搜索结果页面 / 显示加载状态]
    ShowLoading --> CallAPI{调用 GET /api/gitlab/search}
    CallAPI --> BackendProcess[后端处理请求]
    BackendProcess --> GitLabAPI[调用 GitLab Search API]
    GitLabAPI --> ReceiveRaw[接收 GitLab 返回结果]
    ReceiveRaw --> FilterRepos{过滤非白名单仓库}
    FilterRepos --> ReturnResults[返回过滤后的结果集]
    ReturnResults --> ShowResults[展示搜索结果列表]
    ShowResults --> DisplayCount[显示共 X 个结果]
    DisplayCount --> End([用户浏览结果])
```

### 2.2 搜索结果筛选流程

```mermaid
flowchart TD
    %% 开始节点
    Start([用户查看搜索结果])

    %% 筛选操作
    Start --> ChooseFilter[用户选择筛选条件]
    ChooseFilter --> CheckType{筛选类型}

    %% 按仓库筛选
    CheckType -->|按仓库| ToggleRepo[勾选/取消仓库]
    ToggleRepo --> FilterByRepo[按选中仓库过滤结果]

    %% 按匹配类型筛选
    CheckType -->|按类型| ToggleType[勾选文件名/内容匹配]
    ToggleType --> FilterByType[按选中类型过滤结果]

    %% 合并筛选
    FilterByRepo --> MergeFilter[合并所有筛选条件]
    FilterByType --> MergeFilter

    %% 更新展示
    MergeFilter --> UpdateList[更新结果列表展示]
    UpdateList --> CheckEmpty{结果为空?}

    %% 两种结果
    CheckEmpty -->|是| ShowEmpty[展示空状态提示]
    CheckEmpty -->|否| ShowFiltered[展示筛选后结果]

    %% 结束节点
    ShowEmpty --> End([用户调整筛选条件])
    ShowFiltered --> End
```

### 2.3 分页浏览流程

```mermaid
flowchart TD
    %% 开始节点
    Start([用户查看分页控件])

    %% 分页操作
    Start --> CheckPage{检查当前页状态}
    CheckPage -->|非首页| EnablePrev[启用上一页按钮]
    CheckPage -->|非末页| EnableNext[启用下一页按钮]
    CheckPage -->|首页| DisablePrev[禁用上一页按钮]
    CheckPage -->|末页| DisableNext[禁用下一页按钮]

    %% 用户点击分页
    DisablePrev --> ClickPage[用户点击页码]
    DisableNext --> ClickPage
    EnablePrev --> ClickPage
    EnableNext --> ClickPage

    %% 加载对应页
    ClickPage --> LoadPage[加载对应页码结果]
    LoadPage --> UpdateUI[更新页码高亮<br/>展示新页结果]

    %% 结束节点
    UpdateUI --> End([用户继续浏览])
    DisablePrev --> End
    DisableNext --> End
```

### 2.4 点击结果打开文档流程

```mermaid
flowchart TD
    %% 开始节点
    Start([用户点击搜索结果项])

    %% 提取信息
    Start --> ExtractInfo[提取 repoId 和 filePath]
    ExtractInfo --> OpenTab[在新标签页打开<br/>/reader?repo=xxx&file=xxx]

    %% Reader 页面加载
    OpenTab --> LoadReader[Reader 页面加载]
    LoadReader --> FetchTree[调用 fetchTree<br/>加载文件树]

    %% 文件树处理
    FetchTree --> ExpandTree[自动展开文件树<br/>并高亮目标文件]
    ExpandTree --> FetchFile[调用 fetchFile<br/>加载文件内容]

    %% 渲染文件
    FetchFile --> RenderContent[根据文件类型渲染]
    RenderContent --> CheckType{文件类型}

    %% 不同类型渲染
    CheckType -->|Markdown| RenderMD[使用 marked 渲染]
    CheckType -->|HTML| RenderHTML[使用 iframe 预览]
    CheckType -->|图片| RenderImg[直接渲染图片]

    %% 结束节点
    RenderMD --> End([用户阅读文档])
    RenderHTML --> End
    RenderImg --> End
```

---

## 3. 异常流程

### 3.1 搜索失败处理

```mermaid
flowchart TD
    %% 开始节点
    Start([搜索请求发出])

    %% 异常判断
    Start --> Request{请求是否成功?}

    %% 失败情况
    Request -->|否| CheckError{错误类型}

    %% 超时
    CheckError -->|超时| ShowTimeout[展示超时提示<br/>请稍后重试]

    %% GitLab 限流
    CheckError -->|429 限流| ShowRateLimit[展示限流提示<br/>请稍后重试]

    %% 网络错误
    CheckError -->|网络错误| ShowNetwork[展示网络错误提示<br/>检查网络连接]

    %% 成功情况
    Request -->|是| Continue([继续正常流程])

    %% 结束
    ShowTimeout --> Retry([用户点击重试])
    ShowRateLimit --> Retry
    ShowNetwork --> Retry
```

### 3.2 空结果处理

```mermaid
flowchart TD
    %% 开始节点
    Start([搜索结果为空])

    %% 展示空状态
    Start --> ShowEmpty[展示空状态插图]
    ShowEmpty --> ShowMessage[显示文案<br/>未找到与「关键词」相关的文档]

    %% 用户操作
    ShowMessage --> UserAction{用户选择}

    %% 重新搜索
    UserAction -->|重新搜索| BackToSearch[返回搜索框<br/>修改关键词]

    %% 返回首页
    UserAction -->|返回首页| GoHome[返回 Reader 首页]

    %% 结束
    BackToSearch --> End([用户重新输入关键词])
    GoHome --> End
```

---

## 4. 关键决策点汇总

| 决策点 | 条件 | 处理方式 |
| :--- | :--- | :--- |
| **搜索请求** | 关键词为空 | 提示"请输入搜索关键词" |
| **API 调用** | GitLab 返回 429 | 提示"搜索服务繁忙，请稍后重试" |
| **API 调用** | 网络超时 | 提示"搜索超时，请检查网络后重试" |
| **结果过滤** | 过滤后结果为空 | 展示空状态提示 |
| **分页切换** | 首页/末页 | 禁用对应方向的按钮 |
| **文件渲染** | 根据文件后缀 | MD 用 marked，HTML 用 iframe，图片直接渲染 |
