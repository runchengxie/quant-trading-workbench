# Quant Trading Workbench Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将仓库公开身份更新为 `quant-trading-workbench`，明确 Workbench 与 `quant-research` 的边界，并保持现有运行时包、目录和研究契约兼容。

**Architecture:** 只修改仓库元数据、当前文档和契约测试，不移动 `apps/` 或 `packages/`，不改 Python import namespace，不改部署 URL。GitHub rename、remote 更新和本地 checkout 迁移作为合并后的运维步骤。

**Tech Stack:** Markdown、JSON package metadata、Python pytest、现有 pnpm/uv workspace。

**Spec:** `docs/superpowers/specs/2026-09-10-quant-trading-workbench-identity-design.md`

## Global Constraints

- 不新增仓库内 `quant/` 父目录。
- 不改名 `trading-research-dashboard-app` 或 `trading_research`。
- 不修改 Cloudflare URL、静态资产格式、workflow 触发策略或 `niu_men.research_snapshot.v2`。
- 不提交原始行情、凭据、大型回测产物或本机数据目录。
- 历史迁移文档保留原项目名。

---

### Task 1: Add identity and compatibility contract tests

**Files:** Create `tests/test_workbench_identity.py`.

**Interfaces:** Tests read `package.json`, `apps/dashboard/pyproject.toml`, `.github/workflows/*.yml`, `README.md`, `docs/architecture/project-structure.md`, and `docs/workbench-boundary.md`.

- [ ] **Step 1: Write failing tests** covering four behaviors:
  1. root package name is `quant-trading-workbench` while `apps/dashboard/pyproject.toml` still contains `name = "trading-research-dashboard-app"`;
  2. boundary doc contains `research_probe`, `intraday_playbook`, `execution_experiment`, `quant-research`, `样本外`, `成本`, and `不发送真实订单`;
  3. README starts with `# Quant Trading Workbench` and architecture docs mention `quant-trading-workbench`;
  4. workflows still contain `trading-research-dashboard-app` and `apps/dashboard/`, the Python package still contains `trading_research`, and the root schema still contains `niu_men.research_snapshot.v2`.
- [ ] **Step 2: Run `uv run --project apps/dashboard pytest tests/test_workbench_identity.py -q` and confirm failure is caused by the missing identity changes, not a test import error.**
- [ ] **Step 3: Keep assertions limited to current identity and compatibility; allow historical `Dashboard` wording and stable `apps/dashboard` paths.**
- [ ] **Step 4: Re-run the same command after Task 2 and expect four passing tests.**
- [ ] **Step 5: Commit with `git add tests/test_workbench_identity.py && git commit -m "test: protect workbench identity boundaries"`.**

### Task 2: Update project metadata and current-facing documentation

**Files:** Modify `package.json`, `README.md`, `docs/architecture/project-structure.md`, `docs/getting-started.md`, and the current section of `docs/roadmap/README.md`; create `docs/workbench-boundary.md`.

**Interfaces:** Preserve all executable commands and runtime identifiers; produce current-facing docs that use Workbench as the product name.

- [ ] **Step 1: Change only root `package.json` name to `quant-trading-workbench`; keep `web:test`, `web:build`, workspace filters, and package manager unchanged.**
- [ ] **Step 2: Change the root README title to `# Quant Trading Workbench` and explain that it is the interactive surface for observation, research probes, intraday playbooks, execution experiments, research snapshots, and paper-agent review. State that the Web UI remains under `apps/dashboard/`.**
- [ ] **Step 3: Add `docs/workbench-boundary.md` with sections for Workbench responsibilities, the `quant-research` boundary, default intraday classifications, promotion criteria, and production boundary. State that rules are not automatically alpha strategies and promotion requires reproducible hypothesis, explicit protocol, costs, out-of-sample evidence, parameter sensitivity, and cross-instrument/regime stability.**
- [ ] **Step 4: Update only current naming in architecture, getting-started, and roadmap docs; keep actual paths, runtime package names, Cloudflare URL, and historical migration records unchanged.**
- [ ] **Step 5: Run `uv run --project apps/dashboard pytest tests/test_workbench_identity.py -q` and expect four passing tests.**
- [ ] **Step 6: Commit with `git add package.json README.md docs/workbench-boundary.md docs/architecture/project-structure.md docs/getting-started.md docs/roadmap/README.md && git commit -m "docs: establish quant trading workbench identity"`.**

### Task 3: Validate compatibility and prepare handoff

**Files:** No additional files unless a current-facing command is discovered to be inaccurate.

- [ ] **Step 1: Run `uv run --project apps/dashboard pytest tests/test_workbench_identity.py tests/test_research_contract_sync.py -q`.**
- [ ] **Step 2: Run `uv run --project apps/dashboard python scripts/check_foundation.py`; record any pre-existing workflow/environment failure without changing unrelated deployment behavior.**
- [ ] **Step 3: Run `pnpm --filter wu-t0-dashboard-web test` and `pnpm --filter wu-t0-dashboard-web build`; do not alter the filter or runtime package name to make them pass.**
- [ ] **Step 4: Run `git diff --check`, `git status --short`, and `git diff --name-only origin/main...HEAD`; confirm no generated dependency directory, secret, raw data, or large artifact is tracked.**
- [ ] **Step 5: Prepare the PR description with purpose, changed files, compatibility guarantees, exact verification results, and `no deployment required`. After merge, rename the GitHub repository, update `origin`, move the checkout to `/home/richard/code/quant-trading-workbench`, and verify remote, status, and worktree list.**
