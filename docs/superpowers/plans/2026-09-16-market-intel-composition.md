# Workbench Market Intel 聚合入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Quant Trading Workbench 中新增默认 Intel 分区，聚合现有行情、Contextual/策略研究和纸面组合来源状态。

**Architecture:** 增加纯 TypeScript `MarketIntelSnapshot` view model，不写入或替换来源 JSON。Intel 页面复用已解析的 Dashboard 与策略数据，并逐一读取 Agent 组合快照；来源缺失或失败只影响对应模块。每日短评保持明确的未接入状态，待 provider PR 合并后再作独立集成。

**Tech Stack:** React 19、TypeScript 7、Vite、Node built-in test runner、现有 Vitest-independent 静态资产校验。

**Spec:** `docs/superpowers/specs/2026-09-16-market-intel-composition-design.md`

## 全局约束

- 不改变现有研究快照契约、行情 API、研究/Agent 生成逻辑或部署 workflow。
- Intel 只显示最新已验证输入；不展示昨日变化或声称 PIT 回放。
- 每个来源独立显示 `available`、`missing`、`invalid`、`error` 或显式可知的 `stale` 状态。
- Agent 组合始终标注为纸面实验，不发出交易指令。
- 不读取或渲染原始 payload 中未经校验的 HTML。

---

### Task 1: 构造并测试 Intel 来源 view model

**Files:**
- Create: `apps/dashboard/web/src/marketIntel.ts`
- Create: `apps/dashboard/web/src/marketIntel.test.mjs`
- Modify: `apps/dashboard/web/src/agentPortfolio.ts`
- Modify: `apps/dashboard/web/src/agentPortfolio.test.mjs`

**Interfaces:**
- `IntelSourceStatus = 'available' | 'missing' | 'invalid' | 'error' | 'stale'`。
- `MarketIntelSource` 包含 `id`、`label`、`kind`、`status`、`dataDate`、`generatedAt`、`schemaVersion`、`destination`、`detail`。
- `buildMarketIntelSnapshot(dataDate, generatedAt, sources)` 返回 `{ schemaVersion: 'trading_research.market_intel_view.v1', dataDate, generatedAt, timingNote, sources }`；输入来源顺序原样保留。
- `loadAgentPortfolioResult(path)` 返回 discriminated union：成功含已解析 `snapshot`，失败状态为 `missing`、`invalid` 或 `error`，不会 reject。

- [x] **Step 1: 为 view model 写失败测试**，覆盖空来源、固定 view schema、日期与生成时间不混同、source 状态和来源顺序。
- [x] **Step 2: 运行 `node --test apps/dashboard/web/src/marketIntel.test.mjs`**，确认因模块不存在而失败。
- [x] **Step 3: 实现最小纯函数**，定义上述类型和 builder；builder 不根据跨来源日期推断 `stale`。
- [x] **Step 4: 为 Agent loader 写失败测试**，覆盖 HTTP 404/非 JSON 为 `missing`、无效 schema 为 `invalid`、HTTP/network 错误为 `error`、有效 fixture 为 `available`。
- [x] **Step 5: 实现 `loadAgentPortfolioResult`**，复用 `parseAgentPortfolio`，保留现有 `loadAgentPortfolio` 对 Agent 页面调用方的行为。
- [x] **Step 6: 运行两组 Node 测试**，确认测试通过，并检查不存在未处理 rejection。
- [ ] **Step 7: 提交** `feat: add Market Intel source model`。

### Task 2: 新增 Intel 聚合视图和 Workbench 导航入口

**Files:**
- Create: `apps/dashboard/web/src/components/MarketIntelView.tsx`
- Create: `apps/dashboard/web/tests/e2e/market-intel.spec.mjs`
- Modify: `apps/dashboard/web/src/App.tsx`
- Modify: `apps/dashboard/web/src/styles.css`
- Modify: `apps/dashboard/README.md`

**Interfaces:**
- `MarketIntelView` props：`dashboard: DashboardData`、`contextualResearch: ContextualResearchSnapshot | null`、`stateProbe: StateProbeSnapshot | null`、`strategyResults: StrategyLoadResult[]`、`onNavigate(view: 'overview' | 'workspace' | 'research' | 'agent'): void`。
- View 在挂载后以 `Promise.all` 调用 `loadAgentPortfolioResult('agent/etf/latest.json')` 和 `loadAgentPortfolioResult('agent/stocks/latest.json')`；loader 对每条路径都返回结果，不因单项错误 reject。
- `App` 增加 `intel` view id，将其设为初始 view；其余四个现有 view id、组件与行为保持不变。

- [ ] **Step 1: 添加 Playwright 页面测试**，检查 Intel 默认导航项、研究/Agent 来源失败隔离、缺失每日短评文案及到现有 Monitor/Research view 的跳转。
- [ ] **Step 2: 构建现有 Dashboard 后运行 `pnpm --filter wu-t0-dashboard-web exec playwright test tests/e2e/market-intel.spec.mjs`**，确认失败原因对应页面/导航尚不存在。
- [ ] **Step 3: 实现 `MarketIntelView`**，分成 Daily State、Research Status、Paper Portfolio、Daily Note 四个区域；从已校验对象构造 source entries，仅显示数据实际存在的数值，并呈现各自的 `dataDate` / `generatedAt`。
- [ ] **Step 4: 实现来源独立状态**，研究状态沿用 `StrategyLoadResult`，Agent 使用 Task 1 loader；state probe/contextual payload 缺失显示 `missing`，原始字段非空但 parser 返回 null 时显示 `invalid`。
- [ ] **Step 5: 修改 `App.tsx`**，为主导航增加 `Intel · 每日情报`，把它设为默认分区并传入已解析来源；导航按钮回调切换到现有分区。
- [ ] **Step 6: 增加 Intel 页面样式**，复用现有 semantic tokens、主题和状态颜色；桌面使用紧凑网格，窄屏顺序堆叠，状态同时使用文字而不只依赖颜色。
- [ ] **Step 7: 更新 Dashboard README**，说明 Intel 聚合范围、静态来源时间语义、目前未接入每日短评及不提供 yesterday-change/PIT replay。
- [ ] **Step 8: 运行 Playwright 页面测试和相关 unit tests**，确认 Intel 默认入口、导航和孤立错误状态通过。
- [ ] **Step 9: 提交** `feat: add Workbench Market Intel view`。

### Task 3: 全量验证和 PR 交付

**Files:**
- Verify: 所有 Task 1/2 文件
- Verify: `apps/dashboard/web` build and test workflow
- Verify: monorepo foundation checks

- [ ] **Step 1: 运行前端单测**：`pnpm --filter wu-t0-dashboard-web test`。
- [ ] **Step 2: 运行前端构建**：`pnpm --filter wu-t0-dashboard-web build`。
- [ ] **Step 3: 运行 Python 静态资产/数据校验**：从 `apps/dashboard/` 执行 `uv run pytest tests/test_static_assets.py` 与仓库对应的 static asset validator。
- [ ] **Step 4: 运行 `python scripts/check_foundation.py`**，记录完整结果；若有基线失败，确认与本次改动无关后报告。
- [ ] **Step 5: 检查 PR 差异**：确认不含快照 fixtures、生成数据、本机路径或 production artifacts；运行 `git diff --check`。
- [ ] **Step 6: 推送任务分支并创建目标为 `main` 的 PR**，正文记录设计 spec、测试命令和限制；待 review/检查完成后再合并。

## 验收条件

- Intel 是默认分区，Monitor、Workspace、Research、Agent 可通过页面操作继续访问。
- 各数据来源独立显示时间与状态；一个 Agent 文件或研究快照缺失不会隐藏其他栏目。
- 每日短评明确显示待 provider 接入；界面不合成无来源的“昨日变化”、新闻结论或交易指令。
- 浏览器 view model 不写回数据文件；所有来源 payload 继续使用既有解析器。
- 前端测试、构建、目标 Python 检查和 PR 检查通过。
