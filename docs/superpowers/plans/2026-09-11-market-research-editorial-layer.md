# Market Research Editorial Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `quant-market-research` 的研究刊物式视觉语言落到 Workbench 的研究区，同时保留行情和日内工作台的操作型界面。

**Architecture:** 复用现有 `styles.css`、`editorial.css` 和 `research.css` 的层叠关系，在研究页面增加 scoped editorial modifier；只改视觉 class、CSS token 和静态视觉测试，不改数据、路由或后端。操作页面继续消费既有基础 token 和蓝色交互强调。

**Tech Stack:** React/TypeScript、CSS、Node built-in test、Vite。

**Spec:** `docs/superpowers/specs/2026-09-11-market-research-editorial-layer-design.md`

## Global Constraints

- 不改变研究快照、行情数据、路由、API、组件 props 或 Python 代码。
- 研究区域使用暖白/衬线/细规则/Mono 元数据；操作区域保留蓝灰高密度交互风格。
- 暗色主题必须保持现有 chart surface 与页面背景可区分。
- 不新增外部依赖，不复制 `quant-market-research` 代码或数据。
- 所有前端测试和 build 必须从 `apps/dashboard/web` 的现有 workspace 脚本验证。

---

### Task 1: Add failing visual contracts

**Files:**
- Create: `apps/dashboard/web/src/marketResearchEditorial.test.mjs`
- Test: `apps/dashboard/web/src/marketResearchEditorial.test.mjs`

**Interfaces:** Tests read the source of `editorial.css`, `research.css`, `App.tsx`, and `StrategyResearchView.tsx`; they do not render or mutate data.

- [ ] **Step 1: Write failing tests** asserting that:
  - `editorial.css` defines warm research paper, muted terracotta research accent, serif research heading, mono metadata, and a research panel rule token;
  - `research.css` defines `.research-editorial` and removes the research section's default rounded-card treatment through scoped selectors;
  - `StrategyResearchView.tsx` marks its root with `research-editorial`;
  - `App.tsx` still imports `styles.css` before `editorial.css` and does not remove the operation page shell.
- [ ] **Step 2: Run `pnpm --filter wu-t0-dashboard-web test` and confirm the new contract tests fail only because the new tokens/class are absent.**
- [ ] **Step 3: Keep tests semantic and source-based; do not assert exact browser pixel values or implementation-specific selector ordering.**

### Task 2: Implement research editorial layer

**Files:**
- Modify: `apps/dashboard/web/src/editorial.css`
- Modify: `apps/dashboard/web/src/research.css`
- Modify: `apps/dashboard/web/src/components/StrategyResearchView.tsx`
- Modify: `apps/dashboard/web/src/components/ResearchPanel.tsx` only if a semantic research wrapper is required
- Modify: `apps/dashboard/web/src/components/ContextualResearchPanel.tsx` only if a semantic research wrapper is required

**Interfaces:** Preserve all component props and data flow. The only new interface is the CSS class `research-editorial` on the strategy research root, consumed by scoped CSS selectors.

- [ ] **Step 1: Add the minimal light/dark research tokens to `editorial.css`**: warm paper, warm surface, terracotta research accent, serif heading family, Mono metadata family, and a rule color. Keep `--editorial-blue` as the operation accent and keep current dark chart tokens.
- [ ] **Step 2: Add scoped `.research-editorial` rules to `research.css`**: squared research cards with thin borders, editorial section heading treatment, Mono metadata/status labels, terracotta active research underline, and flat KPI/table surfaces. Do not alter `.market-switcher`, chart controls, or live quote state styles outside the scope.
- [ ] **Step 3: Add the `research-editorial` class to the existing `StrategyResearchView` root without changing its children or state logic.**
- [ ] **Step 4: Run the new visual contract test and confirm it passes.**
- [ ] **Step 5: Run `pnpm --filter wu-t0-dashboard-web test` and confirm all existing tests pass.**

### Task 3: Verify responsive and production behavior

**Files:**
- Modify: only files required to correct a verified regression

- [ ] **Step 1: Run `pnpm --filter wu-t0-dashboard-web build` and confirm TypeScript/Vite build succeeds.**
- [ ] **Step 2: Run `git diff --check` and inspect the changed file list; confirm no data, route, Python, lockfile, or generated asset changed.**
- [ ] **Step 3: Review the dark-theme selectors in `editorial.css` and the mobile media queries in `research.css`; confirm the research modifier does not remove horizontal scrolling from dense tables or make chart controls inaccessible.**
- [ ] **Step 4: Commit the implementation with `git add apps/dashboard/web/src docs/superpowers/specs/2026-09-11-market-research-editorial-layer-design.md docs/superpowers/plans/2026-09-11-market-research-editorial-layer.md && git commit -m "feat: add market research editorial layer"`.**
