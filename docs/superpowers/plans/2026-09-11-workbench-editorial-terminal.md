# Workbench Editorial Terminal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Workbench 的行情、日内、Agent 和策略研究统一到一套 dark-first semantic design system，同时保留研究区的 editorial 阅读语法。

**Architecture:** 先在基础样式中建立唯一 semantic token 和 Brand/Market/State/Evidence 四层颜色语义，再迁移现有组件和 ECharts 的硬编码颜色。研究区通过 `research.css` 只增加 typography、spacing、证据布局和表格节奏；Workbench Shell 负责持久上下文和统一控件，不引入新的数据接口或路由。

**Tech Stack:** React/TypeScript、CSS、ECharts、Node built-in test、Vite、pnpm workspace。

**Spec:** `docs/superpowers/specs/2026-09-11-workbench-editorial-terminal-design.md`

## Global Constraints

- 不改变研究快照契约、行情 API、路由、Python 逻辑、Agent 决策逻辑或已发布数据。
- 只使用一套 semantic color token；研究专属 token 仅允许 typography、spacing 和 evidence 语义。
- `light`、`dark`、`system` 都必须通过同一语义 token 映射，暗色保持 chart surface 与 canvas 可区分。
- market up/down 与 semantic positive/negative 分离，并保留 A 股红涨绿跌兼容行为。
- 研究区保留 serif 标题、细规则、mono metadata 和证据布局；正文、控件和表格不整体改用 serif。
- 不新增外部依赖，不提交 `package-lock.json`、原始数据、凭据或生成缓存。
- 每个任务先写失败测试，再写最小实现；前端验证使用 `pnpm --filter wu-t0-dashboard-web test` 和 `pnpm --filter wu-t0-dashboard-web build`。

---

### Task 1: 建立统一主题 token 和迁移禁止项

**Files:**
- Create: `apps/dashboard/web/src/designSystem.test.mjs`
- Modify: `apps/dashboard/web/src/styles.css`
- Modify: `apps/dashboard/web/src/editorial.css`
- Modify: `apps/dashboard/web/src/theme.ts`

**Interfaces:** `theme.ts` 保留现有主题 hook 和类型；CSS 对组件提供 `--surface-*`、`--text-*`、`--border-*`、`--accent-*`、`--market-*`、`--state-*`、`--evidence-*` token。

- [ ] **Step 1: Write the failing token contract.** Read `styles.css` and `editorial.css`; assert the presence of `--surface-canvas`, `--surface-primary`, `--text-primary`, `--border-default`, `--accent-primary`, `--market-up`, `--market-down`, and `--evidence-accent`, plus a `[data-theme="dark"]` mapping. Assert that `editorial.css` no longer declares `--research-paper` or `--research-surface`.
- [ ] **Step 2: Run `pnpm --filter wu-t0-dashboard-web test`; expect only the new contract to fail because the unified tokens are absent.**
- [ ] **Step 3: Add light and dark semantic maps to `styles.css`; move research paper/surface colors out of global semantics, define restrained evidence amber/brick, and keep operational blue as `--accent-primary`.**
- [ ] **Step 4: Remove page-level research paper/surface declarations from `editorial.css`; retain only heading, metadata, spacing and evidence tokens. Update chart fallback values without changing exported theme APIs.**
- [ ] **Step 5: Run `pnpm --filter wu-t0-dashboard-web test`; expect all existing tests and the token contract to pass.**
- [ ] **Step 6: Commit with `git add apps/dashboard/web/src && git commit -m "refactor: unify workbench design tokens"`.**

### Task 2: Migrate the shared shell and operational surfaces

**Files:**
- Create: `apps/dashboard/web/src/shellVisuals.test.mjs`
- Modify: `apps/dashboard/web/src/styles.css`
- Modify: `apps/dashboard/web/src/App.tsx`
- Modify: `apps/dashboard/web/src/components/AgentPortfolioView.tsx`
- Modify: existing overview/intraday components only when a hard-coded visual selector is verified by `rg`.

**Interfaces:** Preserve all existing props, theme state, navigation state, Agent snapshot loading and selected-instrument behavior. The shell may reuse `data.generatedAt`, selected symbol and service status, but cannot add API fields.

- [ ] **Step 1: Write a failing contract for persistent context labels, semantic shell classes and absence of old editorial paper/surface literals in operational selectors.**
- [ ] **Step 2: Run the focused contract and confirm failure before markup/token migration.**
- [ ] **Step 3: Add a compact Workbench context strip using existing market, selected instrument, data date, live status and theme state; show `未提供` for missing values.**
- [ ] **Step 4: Replace shared header, navigation, overview, Agent and intraday background/border/text/focus/state literals with semantic tokens without changing operational density or controls.**
- [ ] **Step 5: Run `pnpm --filter wu-t0-dashboard-web test` and inspect Agent loading plus main navigation.**
- [ ] **Step 6: Commit with `git add apps/dashboard/web/src && git commit -m "feat: unify workbench operational surfaces"`.**

### Task 3: Unify chart language and numeric typography

**Files:**
- Create: `apps/dashboard/web/src/chartThemeContract.test.mjs`
- Modify: `apps/dashboard/web/src/theme.ts`
- Modify: `apps/dashboard/web/src/components/StockChart.tsx`
- Modify: `apps/dashboard/web/src/components/IntradayChart.tsx`
- Modify: `apps/dashboard/web/src/components/AgentPortfolioView.tsx`
- Modify: every chart component found by `rg -n '#[0-9a-fA-F]{6}|rgba\\(' apps/dashboard/web/src/components`
- Modify: `apps/dashboard/web/src/styles.css`

**Interfaces:** Chart props and ECharts output remain unchanged. `readChartTheme()` returns semantic axis, grid, label, tooltip, surface, market-up, market-down and evidence values and remains safe in Node tests without a DOM.

- [ ] **Step 1: Write failing contracts for shared chart palette consumption and tabular numeric typography.**
- [ ] **Step 2: Run the focused contract and confirm failure from literal colors.**
- [ ] **Step 3: Extend `readChartTheme()` with the semantic chart values and deterministic light/dark fallbacks.**
- [ ] **Step 4: Migrate price, intraday, research, Agent and contextual chart options; use market colors for price movement and brand accent only for selection.**
- [ ] **Step 5: Add `font-variant-numeric: tabular-nums` to price, metric, date, ticker and metadata selectors.**
- [ ] **Step 6: Run full tests and build, then commit with `git add apps/dashboard/web/src && git commit -m "refactor: unify workbench chart language"`.**

### Task 4: Reduce research mode to layout grammar

**Files:**
- Create: `apps/dashboard/web/src/researchModeContract.test.mjs`
- Modify: `apps/dashboard/web/src/research.css`
- Modify: `apps/dashboard/web/src/editorial.css`
- Modify: `apps/dashboard/web/src/components/StrategyResearchView.tsx`
- Modify: `apps/dashboard/web/src/components/ResearchPanel.tsx`
- Modify: `apps/dashboard/web/src/components/ContextualResearchPanel.tsx`

**Interfaces:** Preserve research props and snapshot parsing. Research wrappers may add `research-mode`, `research-heading`, `research-metadata`, `evidence-block` and `drivers-risks-strip`; they cannot change the data contract.

- [ ] **Step 1: Write failing contracts for shared surfaces, scoped serif headings, mono metadata, evidence-only accent and no research page background.**
- [ ] **Step 2: Run the focused contract and confirm failure against warm research declarations.**
- [ ] **Step 3: Move research layout rules into `research.css`; leave `editorial.css` as a compatibility layer only where necessary, not a global background override.**
- [ ] **Step 4: Apply compact serif title, section rules, mono metadata, flat evidence blocks, lower-radius tables, consistent density and responsive horizontal scrolling; use shared surfaces and evidence accent only for evidence/warnings.**
- [ ] **Step 5: Add Drivers/Risks strip from existing copy/status only; omit absent sides rather than inventing conclusions.**
- [ ] **Step 6: Run full tests/build and inspect both research and operational routes for cross-scope leakage.**
- [ ] **Step 7: Commit with `git add apps/dashboard/web/src && git commit -m "feat: align research mode with workbench shell"`.**

### Task 5: Add visual regression contracts and finish the migration

**Files:**
- Modify: `apps/dashboard/web/src/designSystem.test.mjs`
- Modify: `apps/dashboard/web/src/shellVisuals.test.mjs`
- Modify: `apps/dashboard/web/src/chartThemeContract.test.mjs`
- Modify: `apps/dashboard/web/src/researchModeContract.test.mjs`
- Modify: this plan and spec when implementation decisions change.

- [ ] **Step 1: Add negative contracts forbidding page-level `#f4f0e8`, `#f8f5ef`, `#b64d33` and private research paper/surface token declarations.**
- [ ] **Step 2: Add positive contracts for both theme maps, Brand/Market/State/Evidence separation, tabular numbers, persistent context, shared chart palette, scoped serif headings and responsive dense tables.**
- [ ] **Step 3: Run `pnpm --filter wu-t0-dashboard-web test`, `pnpm --filter wu-t0-dashboard-web build`, and `git diff --check`; expected result is all tests pass, build succeeds and only planned CSS/React/test/docs files change.**
- [ ] **Step 4: Review both theme maps and verify market movement colors are not reused for evidence/state meaning.**
- [ ] **Step 5: Commit contract cleanup with `git add apps/dashboard/web/src docs/superpowers && git commit -m "test: enforce workbench visual system boundaries"`.**
