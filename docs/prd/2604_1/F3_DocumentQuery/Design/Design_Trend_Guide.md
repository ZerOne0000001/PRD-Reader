# 设计倾向指南 (Design Trend Guide) - F2 文档查询功能

## 1. 设计方向确认

**选定方向**：A - 延续经典 Notion 风
**设计理念**：完全复用 PRD-Reader 现有的极简清新风格，保持产品一致性

---

## 2. 排版规范 (Typography)

### 字体
- **标题字体**：`Quicksand` (Google Font)
- **正文字体**：`Nunito` (Google Font)
- **代码字体**：`JetBrains Mono` / `Fira Code`（如有代码展示）

### 字号层级
- **页面标题**：`text-2xl` (24px)，`font-bold`
- **模块标题**：`text-xl` (20px)，`font-bold`
- **正文**：`text-base` (16px)，`font-semibold`
- **辅助文字**：`text-sm` (14px)，`font-medium`
- **标签文字**：`text-xs` (12px)，`font-bold`

### 行高
- **正文行高**：`leading-7` (1.75)
- **紧凑行高**：`leading-relaxed` (1.625)

---

## 3. 色彩规范 (Color & Theme)

### 主色板
```css
--bg-pastel: #FDF4F5      /* 页面主背景 - 淡粉 */
--sidebar-bg: #E8F3F1     /* 侧边栏背景 - 淡绿 */
--accent-pink: #FFB5C2    /* 粉色强调 */
--accent-blue: #A2D2FF    /* 蓝色强调 */
--accent-yellow: #FDE293   /* 黄色强调 */
--text-dark: #4A4E69       /* 深色文字 */
--text-light: #9CA3AF     /* 浅色文字 */
```

### 功能色
- **成功色**：`#10B981` (绿色)
- **警告色**：`#F59E0B` (橙色)
- **错误色**：`#EF4444` (红色)
- **高亮背景**：`bg-[var(--accent-yellow)]/40` (半透明黄色)

### 阴影色
- **卡片阴影**：`rgba(0,0,0,0.03)` + `rgba(0,0,0,0.05)`
- **按钮悬停阴影**：`rgba(162,210,255,0.4)` (蓝色透明)

---

## 4. 空间组合 (Spatial Composition)

### 圆角规范
| 元素类型 | 圆角大小 | Tailwind 类 |
| :--- | :--- | :--- |
| 页面级容器 | 32px | `rounded-[32px]` |
| 卡片/面板 | 24px | `rounded-[24px]` |
| 按钮/输入框 | 16px | `rounded-2xl` |
| 小标签/胶囊 | 全圆 | `rounded-full` |
| 图标背景 | 8px | `rounded-lg` |

### 间距规范
| 间距类型 | 数值 | Tailwind 类 |
| :--- | :--- | :--- |
| 页面外边距 | 12px | `m-3` |
| 卡片内边距 | 24-40px | `p-6` / `px-8 py-6` |
| 元素间距 | 8-16px | `gap-2` / `gap-4` / `mb-4` |
| 分组间距 | 16-24px | `my-4` / `space-y-4` |

### 尺寸规范
| 元素 | 尺寸 | Tailwind 类 |
| :--- | :--- | :--- |
| 搜索框宽度 | 384px (96 * 4) | `w-96` |
| 左侧面板宽度 | 256px (64 * 4) | `w-64` |
| 图标按钮尺寸 | 28-32px | `w-7 h-7` / `w-8 h-8` |
| 分页按钮尺寸 | 40px | `w-10 h-10` |

---

## 5. 组件规范

### 按钮样式

**主按钮 (soft-btn)**
```css
background: var(--accent-blue);
color: white;
padding: 10px 20px;
border-radius: 16px;
font-weight: bold;
hover: translateY(-2px) + shadow
```

**次要按钮**
```css
background: white;
color: var(--text-dark);
border: 2px solid #E5E7EB;
hover: border darker + translateY(-1px)
```

### 输入框样式 (soft-input)
```css
background: #F9FAFB;
border: 2px solid transparent;
border-radius: 16px;
padding: 10px 20px;
focus: border-color var(--accent-blue) + background white
```

### 复选框样式
```css
width: 16px;
height: 16px;
border: 2px solid #E5E7EB;
border-radius: 4px;
checked: background var(--accent-blue) + checkmark white
```

### 卡片样式
```css
background: white;
border-radius: 24px;
box-shadow: 0 4px 15px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05);
```

### 结果项样式
```css
padding: 20px;
background: #F9FAFB;
border-radius: 16px;
border: 2px solid transparent;
hover: border-color var(--accent-blue) + background gray-50
```

---

## 6. 动画规范

### 过渡时长
- **快速过渡**：`150ms` - 列表淡入淡出
- **标准过渡**：`200ms` - 悬停效果
- **弹性过渡**：`300ms cubic-bezier(0.34,1.56,0.64,1)` - 面板滑入

### 动画类型
| 场景 | 动画类型 | 说明 |
| :--- | :--- | :--- |
| 加载动画 | `animate-spin` | 旋转圆环 |
| 列表淡入 | `opacity transition` | 150ms ease |
| 悬停效果 | `transition-all duration-200` | 边框、背景色变化 |
| 面板滑入 | `translate-x` + cubic-bezier | 左侧抽屉式展开 |

---

## 7. 禁止事项 (Anti-Al AI Slop Rules)

### 必须避免
- ❌ 烂大街的蓝紫渐变背景
- ❌ Inter / Roboto / Arial 等通用字体
- ❌ 纯灰色单调界面
- ❌ 过多的阴影层次（最多 2 层）
- ❌ 粗野的直接投影 `box-shadow: 0 10px`
- ❌ 过于紧凑的间距导致信息堆叠

### 保持一致性
- ✅ 所有圆角必须遵循上述规范
- ✅ 所有颜色必须使用 CSS 变量或现有色板
- ✅ 所有阴影必须使用 `card-shadow` 或 `soft-shadow`
- ✅ 所有按钮必须使用 `soft-btn` 或 `soft-btn-outline`
