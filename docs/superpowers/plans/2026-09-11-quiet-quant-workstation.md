# Quiet Quant Workstation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 收敛 Workbench 的视觉身份，让 shell、行情、Agent 和研究区共享一套安静的机构级工作台语言。

**Architecture:** 以现有 semantic CSS tokens 和 `ChartPalette` 为唯一视觉基础；操作区与研究区只在排版和内容密度上区分，不再通过独立主题区分。市场涨跌色通过 `paletteFor(theme, market)` 获得，品牌色仅服务交互与选中状态。

**Tech Stack:** React, TypeScript, CSS, ECharts, Node test runner, Vite, Playwright。

**Spec:** `docs/superpowers/specs/2026-09-11-workbench-editorial-terminal-design.md`，并结合本次用户确认的 Quiet Quant Workstation 方向。

## Global Constraints

- 不改变行情、研究快照、Agent 组合数据结构或生产数据。
- 不提交字体二进制；通过可靠的字体 stack 和现有部署资源加载字体。
- 颜色必须通过 semantic token 或 `ChartPalette` 使用，禁止新增页面私有主题色。
- `999px` 仅允许用于真正的状态 chip；普通控件使用 4–6px radius。
- 研究区保留 serif 标题、细分隔线和 evidence 层级，但不拥有独立背景主题。
- 保持 light/dark 两种主题和 CN/HK/US 市场支持。

### Task 1: 收敛视觉 tokens 与基础 primitive

**Files:**
- Modify: `apps/dashboard/web/src/styles.css`
- Modify: `apps/dashboard/web/src/editorial.css`
- Modify: `apps/dashboard/web/src/research.css`
- Modify: `apps/dashboard/web/src/components/ui/button.tsx`
- Test: `apps/dashboard/web/src/quietWorkstationContract.test.mjs`

- [x] **Step 1: Write contract tests** for quiet palette, no body grid, radius/shadow limits, semantic button classes, and removal of saturated legacy blue.
- [x] **Step 2: Run the focused contract test and confirm it fails.**
- [x] **Step 3: Replace legacy palette values with steel/ink tokens, remove the body engineering grid, normalize base radius/shadow, and route button states through semantic tokens.**
- [x] **Step 4: Run the focused test and the existing design-system tests.**
- [x] **Step 5: Commit the token and primitive changes.**

### Task 2: 重构产品身份与顶部 shell

**Files:**
- Modify: `apps/dashboard/web/index.html`
- Modify: `apps/dashboard/web/src/App.tsx`
- Modify: `apps/dashboard/web/src/styles.css`
- Test: `apps/dashboard/web/src/quietWorkstationContract.test.mjs`

- [x] **Step 1: Add assertions for the Workbench title, two-row shell identity, and removal of duplicate Dashboard branding.**
- [x] **Step 2: Implement `QUANT TRADING WORKBENCH` branding, compact primary navigation, and keep the existing data-backed context strip.**
- [x] **Step 3: Tighten shell spacing and responsive behavior without changing page routing or data loading.**
- [x] **Step 4: Run shell tests and a TypeScript build.**
- [x] **Step 5: Commit the shell changes.**

### Task 3: 完善字体与研究/操作两种阅读模式

**Files:**
- Modify: `apps/dashboard/web/index.html`
- Modify: `apps/dashboard/web/src/styles.css`
- Modify: `apps/dashboard/web/src/editorial.css`
- Modify: `apps/dashboard/web/src/research.css`
- Test: `apps/dashboard/web/src/quietWorkstationContract.test.mjs`

- [x] **Step 1: Add font-loading and typography contract assertions.**
- [x] **Step 2: Add a network-safe font strategy with `@import`-free local/system fallbacks, mono numeric metadata, and restrained serif research headings.**
- [x] **Step 3: Reduce research heading scale, normalize editorial radius, and remove remaining SaaS card shadows/pills from research layout.**
- [x] **Step 4: Run the focused and full frontend tests.**
- [x] **Step 5: Commit typography and reading-mode changes.**

### Task 4: 分离品牌色、市场色、状态色与图表语义

**Files:**
- Modify: `apps/dashboard/web/src/theme.ts`
- Modify: `apps/dashboard/web/src/components/StockChart.tsx`
- Modify: `apps/dashboard/web/src/components/IntradayChart.tsx`
- Modify: `apps/dashboard/web/src/components/ResearchPanel.tsx`
- Test: `apps/dashboard/web/src/chartVisuals.test.mjs`
- Test: `apps/dashboard/web/src/quietWorkstationContract.test.mjs`

- [x] **Step 1: Add tests requiring market-aware up/down palette values and preserving evidence amber as a distinct semantic.**
- [x] **Step 2: Extend `paletteFor` with an optional `Market` argument and select CN red-up/green-down versus HK/US green-up/red-down without changing `semantic-positive/negative`.**
- [x] **Step 3: Pass the active instrument market to daily, intraday, Agent-independent research charts where market data is available; preserve neutral defaults where it is not.**
- [x] **Step 4: Run chart tests, full tests, and build.**
- [x] **Step 5: Commit chart semantic changes.**

### Task 5: 浏览器验证与交付

**Files:**
- Modify: `apps/dashboard/web/src/quietWorkstationContract.test.mjs` only if browser-discovered contract needs tightening.

- [x] **Step 1: Run `git diff --check`, frontend unit tests, and production build.**
- [x] **Step 2: Run Playwright smoke checks in light/dark themes and across all four navigation states, checking no page errors and visible Workbench identity.**
- [x] **Step 3: Inspect the final diff for data/credential/generated-file leakage.**
- [ ] **Step 4: Commit, push, create PR, wait for Python/Web CI, and squash merge to `main`.**
- [ ] **Step 5: Sync `main`, remove only this task's worktree and branches, and verify a clean main checkout.**
