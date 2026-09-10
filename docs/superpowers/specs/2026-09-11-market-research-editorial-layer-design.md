# Market Research Editorial Layer 设计

## 目标

将 `quant-market-research` 的研究刊物式视觉语言，有选择地落到 `quant-trading-workbench` 的研究区域，使两个 Quant 项目具备家族一致性，同时保留 Workbench 在行情和日内工作台中的操作密度。

## 设计边界

### 研究区域

策略研究、Contextual Research、研究证据、快照状态和后续 cohort/research-series 页面采用暖白纸张、衬线标题、细分隔线、Mono 元数据、低阴影和明确的证据状态。研究内容的视觉重点从“卡片容器”转向“章节、表格、来源和结论”。

### 操作区域

盘前概览、日内工作台、行情图表、实时状态和 Agent 组合操作继续使用当前较冷静的蓝灰强调、较高的信息密度和快捷操作结构。可以共享字体、边框和状态语义，但不强制使用长篇报告式布局。

## 视觉 token

- 浅色研究底色：暖白/纸张色，而不是纯白。
- 研究强调色：低饱和砖红/赭色，用于 section kicker、验证状态和关键结论；蓝色继续作为 Workbench 的操作强调色。
- 标题：研究章节使用衬线 display face；表格、日期、schema、coverage 使用等宽字体。
- 容器：研究卡片减少圆角和阴影，使用细边框、顶部规则和章节间距。
- 状态：`verified`、`warning`、`stale`、`unknown` 需要有边框、背景和文本的组合差异，不能只依赖颜色。
- 暗色主题：保留现有可读性和 chart surface 分离，不将暖色 token 直接反转成低对比度橙色。

## 实施方式

1. 在现有 `editorial.css` 中增加研究层 token 和页面级 modifier，不重写基础 `styles.css`。
2. 在 `research.css` 中将策略研究的 tab、KPI、证据卡和表格改为更接近 `quant-market-research` 的 editorial layout。
3. 为研究区添加最小语义 class，必要时只调整 `StrategyResearchView`、`ResearchPanel` 和 `ContextualResearchPanel` 的 className，不改变 props、数据解析和路由。
4. 使用现有 Node test 通过静态 CSS/markup contract 保护视觉系统；通过现有 build 验证 CSS 和 TypeScript。

## 非目标

- 不迁移 `quant-market-research` 的组件代码或数据文件。
- 不改变颜色表达的业务语义、研究快照契约、行情 API、路由和页面状态。
- 不新增 cohort explorer、研究序列或新的数据字段。
- 不把盘前/日内/Agent 页面整体改成静态研究报告。
