# Workbench Editorial Terminal 设计

## 目标

将 `quant-trading-workbench` 收敛成统一的 Quant Research Workstation：行情、日内、Agent 和策略研究共享同一套品牌视觉系统；研究区保留 editorial 阅读语法，但不再拥有独立的暖色页面主题。

核心原则是：一个视觉系统，两种阅读模式，三种内容密度。

## 产品设计原则

产品主路径是 `Observe → Investigate → Research → Validate → Act`。现有页面继续作为入口，但组件应围绕 `Instrument`、`Strategy`、`Research Run`、`Evidence`、`Agent Decision` 和 `Experiment` 建立一致的摘要、状态、元数据、历史和下一步入口。本次只建立视觉和上下文基础，不新增路由或数据模型。

- 操作模式：盘前概览、日内、行情图表、Agent，强调扫描速度、状态反馈和控件效率。
- 研究模式：策略研究、研究证据和 contextual research，强调论点顺序、证据层级、章节间距和可读性。
- `Monitor` 是高密度行情扫描，`Workspace` 是中高密度图表与操作，`Research` 是中密度正文、证据、表格和结论。

研究模式只增加 serif 标题、章节节奏、metadata 排版和证据布局，不改变全局背景、品牌 accent 或状态语义。

## 统一颜色系统

代码层只保留一组 semantic token，浅色和暗色分别映射到相同语义：

```css
--surface-canvas
--surface-primary
--surface-secondary
--surface-elevated
--text-primary
--text-secondary
--text-muted
--border-subtle
--border-default
--border-strong
--accent-primary
--accent-primary-muted
--focus-ring
--market-up
--market-down
--state-success
--state-warning
--state-danger
--state-info
--evidence-accent
--evidence-muted
```

Brand、Market、State、Evidence 四层语义必须分离。橙色只作为 evidence、warning、provisional 等少量提示，不再作为研究页面背景或所有标题颜色。A 股红涨绿跌和美股绿涨红跌属于 market palette；`positive/negative` 状态保持独立。

不得继续新增 `--research-paper`、`--research-surface` 这类页面级 token。研究专属 token 只能表达 heading family、metadata family、spacing 或 evidence 语义。

## 字体与版式

- UI、导航、按钮和正文使用统一 sans family，优先 `Inter` 或现有等价字体。
- 研究一级标题和少量章节标题使用 serif display face；研究正文不整体使用 serif。
- ticker、日期、比例、价格、schema、coverage、run id 使用 mono family。
- 金额和指标启用 tabular figures；数字列右对齐，文本列左对齐。
- 页面结构统一为：持久上下文 → 页面标题 → summary strip → analytical band → 数据表/证据 → Drivers/Risks → provenance 和限制。

## 组件与交互

- Workbench Shell 持久显示当前市场、选中标的、数据日期、freshness 和主题控制；优先复用现有 `data.generatedAt`、selected instrument 和服务状态。
- KPI 使用无卡片或低容器 summary strip，以细线分隔；重要数字、label、metadata 具有固定层级。
- 图表统一 axis、grid、tooltip、crosshair、benchmark 和 market color；chart surface 必须和页面 canvas 可区分。
- 研究区保留细规则、章节标题、mono metadata、平面证据块和较低圆角；卡片不再改变页面底色。
- Drivers/Risks 使用横向 insight strip；缺少数据时不渲染空的结论。
- dense table 保留横向滚动、排序和键盘 focus；状态不能只依赖颜色。

## 实施边界与非目标

第一阶段只修改 `apps/dashboard/web` 的 CSS、React markup、图表 option 和视觉测试。不得改变研究快照契约、行情 API、路由、Python 生成逻辑、Agent 决策逻辑或已发布数据；不复制 `quant-market-research` 的组件或数据；不新增 cohort explorer、research series 或新的研究字段。
