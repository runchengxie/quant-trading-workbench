# Market State Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a validated, reusable market-state research layer with rolling state features, episode-aware multi-horizon outcomes, censoring and capital-occupancy diagnostics, plus a safe Dashboard panel.

**Architecture:** Keep the new state-probe contract separate from contextual and conditional research. Put pure calculation and JSON Schema validation in `research-core`; add a parser/selector in the web app; render an optional panel from the existing Research view using static `DashboardData.stateProbe` data. No provider, strategy, Agent, or paper-portfolio changes.

**Tech Stack:** Python 3.11+, `research-core`, JSON Schema Draft 2020-12, pytest, React 19, TypeScript, Node test runner, existing Tailwind/CSS classes.

**Spec:** `docs/superpowers/specs/2026-09-14-market-state-probe-design.md`

## Global Constraints

- Preserve `trading_research.conditional_research.v1` and all existing snapshot contracts.
- Do not commit raw market data, complete OOS output, credentials, or machine-local paths.
- Treat unavailable and censored outcomes as `null`/counts; never substitute zero.
- A state probe is research evidence only; it must not place orders or alter Agent/paper-portfolio behavior.
- Follow TDD: each production behavior is preceded by a failing test and a verified red run.

---

### Task 1: Add state-probe calculations and contract validation

**Files:**
- Create: `packages/research-core/src/research_core/state_probe.py`
- Create: `packages/research-core/src/research_core/schemas/state-probe.v1.schema.json`
- Modify: `packages/research-core/src/research_core/__init__.py`
- Test: `packages/research-core/tests/test_state_probe.py`
- Test: `packages/research-core/tests/test_state_probe_contract.py`

**Interfaces:**
- Produces `STATE_PROBE_VERSION`, `build_state_probe(...)`, `validate_state_probe(payload)`, and `load_state_probe(path)`.
- `build_state_probe(observations, *, probe_id, feature_id, short_window, long_window, thresholds, horizons, generated_at, baseline_returns=None, episode_min_false_days=1, capital_per_event=1.0) -> dict[str, Any]` consumes date-sorted mappings with `date`, `value`, optional `forwardReturns`, `mfe`, `mae`, and optional `capital` fields.
- The returned mapping contains `schemaVersion`, `generatedAt`, `probe`, `current`, `events`, `outcomes`, `quality`, and `provenance`.

- [ ] **Step 1: Write failing tests for rolling features and condition states**

```python
def test_build_state_probe_reports_ratio_percentile_zscore_and_slope() -> None:
    result = build_state_probe(
        [
            {"date": "2026-01-01", "value": 100},
            {"date": "2026-01-02", "value": 60},
            {"date": "2026-01-03", "value": 40},
        ],
        probe_id="liquidity",
        feature_id="turnover_ratio",
        short_window=2,
        long_window=3,
        thresholds={"compressed": 0.8},
        horizons=[1],
        generated_at="2026-01-03T00:00:00Z",
    )
    assert result["current"]["value"] == 0.75
    assert result["current"]["state"] == "compressed"
    assert result["current"]["slope"] < 0
    assert result["events"][-1]["condition"] is True
```

- [ ] **Step 2: Run the focused test and verify the expected missing-symbol failure**

Run: `uv run pytest packages/research-core/tests/test_state_probe.py::test_build_state_probe_reports_ratio_percentile_zscore_and_slope -q`

Expected: FAIL because `research_core.state_probe` does not exist.

- [ ] **Step 3: Write failing tests for episodes, censoring, baseline excess, and occupancy**

```python
def test_outcomes_separate_episodes_censored_rows_and_overlapping_occupancy() -> None:
    observations = [
        {"date": f"2026-01-0{day}", "value": value, "forwardReturns": {"1d": 0.02}}
        for day, value in [(1, 70), (2, 60), (3, 70), (4, 100), (5, 60)]
    ]
    result = build_state_probe(
        observations,
        probe_id="liquidity",
        feature_id="turnover_ratio",
        short_window=1,
        long_window=1,
        thresholds={"compressed": 0.8},
        horizons=[1, 5],
        generated_at="2026-01-05T00:00:00Z",
        baseline_returns={"1d": {"2026-01-01": 0.01, "2026-01-02": 0.01}},
    )
    one_day = next(item for item in result["outcomes"] if item["horizon"] == "1d")
    five_day = next(item for item in result["outcomes"] if item["horizon"] == "5d")
    assert one_day["sampleCount"] == 4
    assert one_day["episodeCount"] == 3
    assert one_day["eligibleCount"] == 3
    assert one_day["censoredCount"] == 1
    assert one_day["meanExcessReturn"] == 0.01
    assert five_day["eligibleCount"] == 0
    assert five_day["censoredCount"] == 4
    assert five_day["coverage"] == 0.0
```

- [ ] **Step 4: Run the new test to verify it fails for the intended missing implementation**

Run: `uv run pytest packages/research-core/tests/test_state_probe.py::test_outcomes_separate_episodes_censored_rows_and_overlapping_occupancy -q`

Expected: FAIL because `build_state_probe` is not implemented.

- [ ] **Step 5: Implement the minimal pure calculation engine**

Implement date validation, rolling ratio (`mean(short_window) / mean(long_window)`), percentile and population z-score over available long-window ratios, slope over the last two available ratios, threshold classification, false-to-true episode starts, horizon lookup, eligible/censored counts, mean/median/win rate, baseline excess, and occupancy intervals. Reject duplicate/non-increasing dates, non-positive windows/horizons, invalid thresholds, and missing values needed for a result.

- [ ] **Step 6: Add schema and validator wiring**

Define the required envelope, current-state object, event objects, outcome objects, non-negative count constraints, horizon enum/string pattern, and count/coverage consistency using JSON Schema. Add recursive semantic checks in Python for sorted dates and `eligibleCount + censoredCount == sampleCount`; export the loader and validator from `research_core.__init__`.

- [ ] **Step 7: Run focused tests and package lint**

Run: `uv run pytest packages/research-core/tests/test_state_probe.py packages/research-core/tests/test_state_probe_contract.py -q`

Expected: all new tests pass with exit code 0.

Run: `uv run ruff check packages/research-core/src/research_core/state_probe.py packages/research-core/tests/test_state_probe.py packages/research-core/tests/test_state_probe_contract.py`

Expected: no lint errors.

- [ ] **Step 8: Commit the core implementation**

```bash
git add packages/research-core/src/research_core packages/research-core/tests/test_state_probe.py packages/research-core/tests/test_state_probe_contract.py
git commit -m "feat: add market state probe research core"
```

### Task 2: Add Dashboard parsing and selection

**Files:**
- Create: `apps/dashboard/web/src/stateProbe.ts`
- Create: `apps/dashboard/web/src/stateProbe.test.mjs`
- Modify: `apps/dashboard/web/src/types.ts`
- Modify: `apps/dashboard/web/src/App.tsx`

**Interfaces:**
- Produces `parseStateProbe(value: unknown): StateProbeSnapshot | null` and `selectStateProbe(snapshot, probeId?): StateProbeSnapshot | null`.
- `DashboardData` gains optional `stateProbe?: unknown`; parser output includes typed `current`, `events`, and `outcomes` arrays.

- [ ] **Step 1: Write failing parser tests**

```javascript
test('parses a valid state probe and rejects inconsistent outcome counts', () => {
  const parsed = parseStateProbe(validStateProbe());
  assert.equal(parsed.current.state, 'compressed');
  assert.equal(selectStateProbe(parsed, 'liquidity')?.probe.id, 'liquidity');
  assert.equal(parseStateProbe({ ...validStateProbe(), outcomes: [{ ...validStateProbe().outcomes[0], eligibleCount: 2, censoredCount: 0, sampleCount: 1 }] }), null);
});
```

- [ ] **Step 2: Run the parser test and verify it fails**

Run: `pnpm --dir apps/dashboard/web exec node --test src/stateProbe.test.mjs`

Expected: FAIL because `stateProbe.ts` and parser functions do not exist.

- [ ] **Step 3: Implement strict runtime parser and optional Dashboard data field**

Validate schema version, probe id, current numeric fields/nullability, event dates, horizon and all count invariants. Return `null` for invalid or absent input. Keep parser independent of React.

- [ ] **Step 4: Run parser tests and TypeScript check**

Run: `pnpm --dir apps/dashboard/web exec node --test src/stateProbe.test.mjs`

Expected: PASS.

Run: `pnpm --dir apps/dashboard/web exec tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Commit the parser layer**

```bash
git add apps/dashboard/web/src/stateProbe.ts apps/dashboard/web/src/stateProbe.test.mjs apps/dashboard/web/src/types.ts apps/dashboard/web/src/App.tsx
git commit -m "feat: parse market state probe snapshots"
```

### Task 3: Render the optional state-probe research panel

**Files:**
- Create: `apps/dashboard/web/src/components/StateProbePanel.tsx`
- Create: `apps/dashboard/web/src/components/StateProbePanel.test.mjs`
- Modify: `apps/dashboard/web/src/App.tsx`
- Modify: `apps/dashboard/web/src/styles.css` (or the existing stylesheet containing `.workspace-panel`)

**Interfaces:**
- `StateProbePanel({ snapshot }: { snapshot: StateProbeSnapshot })` renders current state metrics and one outcome row per horizon.
- The panel must be reachable from the existing `Research` view and remain absent when `stateProbe` is unavailable.

- [ ] **Step 1: Write the failing component contract test**

```javascript
test('state probe panel exposes coverage and occupancy warnings', async () => {
  const source = await readFile('src/components/StateProbePanel.tsx', 'utf8');
  assert.match(source, /censoredCount/);
  assert.match(source, /peakCapitalOccupancy/);
  assert.match(source, /当前状态/);
});
```

- [ ] **Step 2: Run the component contract test and verify it fails**

Run: `pnpm --dir apps/dashboard/web exec node --test src/components/StateProbePanel.test.mjs`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the panel and wire it into Research**

Show `value`, percentile, z-score, slope, state, event-day count, episode count, eligible/censored/coverage, mean/median/excess return, and average/peak occupancy. Render `—` for null values and a warning badge when coverage is below 80%, censored rows are present, or peak occupancy exceeds 1.0. Use existing panel/table classes and Chinese copy consistent with the Dashboard.

- [ ] **Step 4: Run frontend unit tests and build**

Run: `pnpm --dir apps/dashboard/web test`

Expected: all unit tests pass.

Run: `pnpm --dir apps/dashboard/web build`

Expected: TypeScript compilation and Vite build exit 0.

- [ ] **Step 5: Commit the Dashboard panel**

```bash
git add apps/dashboard/web/src/components/StateProbePanel.tsx apps/dashboard/web/src/components/StateProbePanel.test.mjs apps/dashboard/web/src/App.tsx apps/dashboard/web/src/styles.css
git commit -m "feat: show market state probe research"
```

### Task 4: Add documentation, integration fixtures, and full verification

**Files:**
- Create: `apps/dashboard/web/public/state-probe.example.json`
- Modify: `docs/architecture/project-structure.md`
- Modify: `docs/README.md`
- Test: `tests/test_state_probe_integration.py`

**Interfaces:**
- The example fixture is a small synthetic, non-production snapshot suitable for parser/UI development and is not loaded as live research data.
- The integration test validates the fixture through `research_core.load_state_probe` and confirms the Dashboard-facing shape has all required warning metrics.

- [ ] **Step 1: Write the failing integration test**

```python
def test_example_state_probe_is_a_valid_research_snapshot() -> None:
    payload = load_state_probe("apps/dashboard/web/public/state-probe.example.json")
    assert payload["schemaVersion"] == STATE_PROBE_VERSION
    assert payload["outcomes"][0]["eligibleCount"] + payload["outcomes"][0]["censoredCount"] == payload["outcomes"][0]["sampleCount"]
```

- [ ] **Step 2: Run it and verify it fails because the fixture is absent**

Run: `uv run pytest tests/test_state_probe_integration.py::test_example_state_probe_is_a_valid_research_snapshot -q`

Expected: FAIL with a missing-file error.

- [ ] **Step 3: Add the synthetic fixture and concise documentation**

Document the optional `stateProbe` field, the distinction between event-day and episode-entry statistics, and the meaning of censored outcomes and occupancy. Ensure no production claims are made from the synthetic fixture.

- [ ] **Step 4: Run all focused and full checks**

Run: `uv run pytest packages/research-core/tests/test_state_probe.py packages/research-core/tests/test_state_probe_contract.py tests/test_state_probe_integration.py -q`

Expected: all state-probe tests pass.

Run: `pnpm --dir apps/dashboard/web test && pnpm --dir apps/dashboard/web build`

Expected: frontend tests and build pass.

Run: `uv run pytest -q`

Expected: no new failures; existing baseline workflow failures may remain and must be reported exactly.

- [ ] **Step 5: Inspect diff and commit documentation/fixture**

```bash
git diff --check
git status --short
git add apps/dashboard/web/public/state-probe.example.json docs/architecture/project-structure.md docs/README.md tests/test_state_probe_integration.py
git commit -m "docs: document market state probe contract"
```
