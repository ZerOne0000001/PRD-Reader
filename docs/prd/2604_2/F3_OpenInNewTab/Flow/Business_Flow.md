# 业务流程图 (Business Flow)

以下是用户在交互式 PRD 中点击“在新标签页打开”图标后的业务逻辑流转：

```mermaid
flowchart TD
    %% 参与者/泳道定义（隐式）
    subgraph 用户 (Reader)
        A((开始阅读 PRD)) --> B[发现右侧原型图太小或需全屏查看]
        B --> C[点击 iframe 右上角的“外链”悬浮图标]
        H[在新标签页中查看完整原型] --> I((结束全屏查看))
    end

    subgraph 系统 (Interactive_PRD.html)
        C --> D{系统拦截点击事件}
        D --> E[解析当前外层 URL Hash]
        E --> F[从 Hash 中提取对应的原型文件相对路径\n例如：F2_Reader/home.html]
        F --> G[调用 window.open(相对路径, '_blank')]
    end

    subgraph 浏览器 (Browser)
        G --> H
    end
```
