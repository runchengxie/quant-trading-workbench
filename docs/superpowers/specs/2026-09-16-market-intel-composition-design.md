# Market Intel 聚合入口设计

## 目标

在 Quant Trading Workbench 增加 `Intel · 每日情报` 主分区，作为进入 Monitor、Workspace、Research 与 Agent 的每日研究入口。第一阶段只组合 Workbench 当前已经发布的静态快照，清楚标出来源、数据日期、生成时间和可用状态；不复制来源指标，也不把探索性研究结论升级为交易信号。

## 当前基础

Dashboard 已独立加载 `data.json`、`research.json`、R-Breaker 与 ICT 策略快照、`stateProbe`，Agent 页面另行读取 ETF 与个股组合快照。各来源有自己的版本和时间戳，缺失研究快照不会阻断行情页。当前没有跨域 Market Intel 数据契约、统一的 source health model、快照日历史或新闻 first-seen 时间。

## 设计原则

- Intel 是聚合入口，不取代现有 Monitor、Workspace、Research 和 Agent 分区。
- 保留每个来源的 canonical JSON 与 schema；聚合层只放摘要、引用、日期、时间戳和健康状态。
- 每个 section 独立加载、独立失败。来源缺失或无效时展示可解释状态，不让其余内容消失。只有来源显式提供 freshness 状态时才标为 stale；数据日期不同步只展示各自日期，不用跨来源日期比较推断过期。
- 区分 `dataDate`、`generatedAt` 与可用状态。第一阶段没有 `firstSeenAt`，不得把数据生成时间称为信息在当时可见的时间，也不得声称实现 PIT 回放。
- 研究快照展示为研究状态和 evidence link；Agent 数据继续明确标为纸面组合。页面不生成仓位或交易指令。
- Intel 不暗示“较昨日变化”：当前生产输入没有完整、冻结、可比的前一日聚合快照。

## 第一阶段范围

### 聚合内容

1. **Daily State**：使用行情快照的 as-of 日期、当前已发布的 market state probe 与 contextual research，显示各自状态和来源时间。
2. **Research Status**：显示牛门线、R-Breaker、ICT 研究快照的可用/缺失/无效状态、数据截止日和现有质量提示，并提供跳转到 Research 的操作。
3. **Paper Portfolio**：读取已有 ETF 和个股 Agent 最新快照，只显示 as-of、总收益、当前持仓数及来源状态，并链接到 Agent；不得把纸面净值描述为实盘。
4. **Daily Note Slot**：定义可选的来源引用和摘要 adapter 边界，第一阶段允许展示“尚未连接每日短评来源”。跨仓读取 `quant-market-intel-pages` 的生成内容属于后续 provider integration，须在 provider PR 合入并确认 URL/数据保留契约后单独实施。

### 页面行为

- 在 Workbench 主导航增加 `Intel · 每日情报`，作为默认分区；现有 Monitor、Workspace、Research、Agent 路由与行为保持不变。
- 为聚合信息定义浏览器端 `MarketIntelSnapshot` view model，schema 标识为 `trading_research.market_intel_view.v1`。它只在 UI 层由已验证来源派生，不写入或替换来源 JSON。
- 每个 source entry 包含稳定 source id、kind、status、`dataDate`、`generatedAt`、schema/version（可用时）、来源路径和简短状态信息。status 为 `loading`、`available`、`missing`、`invalid`、`error` 或 `stale`。
- 每个栏目展示自身更新时间和数据日期；缺失/解析失败时提供该来源的状态文案及现有页面入口。
- Intel 只显示最新可用输入，不缓存或回填旧日期以伪装当前数据。视图明确提示各来源时间戳不同步。

## 非目标

- 新闻采集、事件日历、新闻实体识别或 `publishedAt` / `firstSeenAt` / `availableAt` 数据流水线。
- `market_intel_snapshot.v1` 的服务端发布、每日不可变历史归档或 revision 管理。第一阶段是 UI view model，不是新的持久 wire contract。
- “Changes since yesterday”、decision reconstruction、historical replay 或回测可见性校验。
- Cohort、candidate ledger、experiment manifest 的跨模块重构。
- Agent 决策/组合逻辑、研究生产流程、现有快照 schema、路由机制或部署数据的改动。
- 将 `market-intel-pages` 的未合并工作分支或临时部署作为生产依赖。

## 数据与失败处理

- 复用现有 `loadDashboard`、`loadStrategySnapshot` 与 `loadAgentPortfolio` 解析器，不为 Intel 实现第二套 JSON 校验。
- 聚合层接收已经验证的对象及每个 loader 的结果；来源异常转换为该来源的状态条目，禁止将错误正文或原始 payload 渲染为 HTML。
- Agent 两个 portfolio 继续独立加载。一个组合不可用时，另一个组合和 Intel 其余栏目仍可显示；基础 `data.json` 仍是 Workbench 既有必需输入。
- 只有该栏目的来源可用且日期存在时才渲染数值；不得将 `null`、无效或不同 as-of 的数字合并成同一总指标。

## 验证

- 纯 TypeScript 测试覆盖 view model 组合、来源状态、日期/生成时间差异、单来源失败隔离及缺失短评状态。
- 组件测试覆盖 Intel 默认导航、到现有分区的跳转和独立 loading/error/empty 状态。
- 运行 Dashboard web unit tests/build、相关 Python static asset tests，并按仓库流程运行 monorepo foundation checks。
- 确认未变更现有 JSON fixtures、source schemas、研究/Agent 生成逻辑、部署 workflows 和生产数据。

## 后续顺序

1. 待 `market-intel-pages` provider PR 合并后，单独设计并接入每日短评源，确认来源 IDs、数据日期、生成时间、滚动保留窗口与失效行为。
2. 为各来源补足 point-in-time 可用时间和冻结的每日 Intel snapshot 后，再设计 “Changes since yesterday” 与历史决策重建。
3. Candidate Ledger 与统一 Experiment Manifest 分别立项，避免把不同研究生命周期塞入 Intel 页面。
