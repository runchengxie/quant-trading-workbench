# Runtime Cutover Runbook

[简体中文](runtime-cutover.zh-CN.md)

This runbook records M6 migration from the legacy runtime to `quant-trading-workbench`, including evidence and rollback boundaries. Unexecuted acceptance gates remain `not-yet-run`. Workflow definitions alone do not establish production evidence.

## Current ownership

| Responsibility | Current authority | Target authority | Status |
| --- | --- | --- | --- |
| Dashboard source/build config | monorepo | monorepo | active |
| Manual Dashboard deploy | monorepo | monorepo | available |
| Weekday market-data generation + deploy | monorepo shadow workflow | monorepo authoritative workflow | shadow; legacy workflow rollback-only |
| Reviewed static `data.json` fallback | monorepo | monorepo | active |
| Research snapshot validation/publication | monorepo | monorepo | available |
| Legacy Niu Men Dashboard publication | monorepo publication path | monorepo publication path | legacy workflow rollback-only |
| Realtime market-data service | `apps/market-data-service/` | monorepo service | code merged, production verification pending |

## Exact rollback SHAs

These SHAs were read from the legacy repositories immediately before preparing the M6 freeze PRs on 2026-08-27.

| Repository | Last-known-good legacy SHA | Freeze state |
| --- | --- | --- |
| `runchengxie/wu-t0-trading-dashboard` | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` | freeze merged; rollback mirror |
| `runchengxie/niu-men-line-strategy` | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` | freeze merged; rollback mirror |

Do not move these rollback markers merely because the legacy branches receive documentation/freeze commits. A later rollback decision must explicitly choose whether it wants the pre-freeze legacy implementation SHA above or a reviewed freeze commit.

## Runtime workflows

### Legacy Dashboard

Current production workflow before cutover:

```text
repository: runchengxie/wu-t0-trading-dashboard
workflow: .github/workflows/report.yml
schedule: 0 1 * * 1-5
normal production writes: enabled
```

The legacy workflow is now manual and requires explicit rollback acknowledgement. It is not a normal data-generation or deployment path. The local legacy checkout may be removed after verifying the monorepo migration; the remote repository remains available as a rollback mirror.

### Monorepo shadow workflow

Current monorepo workflow:

```text
repository: runchengxie/quant-trading-workbench
workflow: .github/workflows/dashboard-report.yml
schedule: 10 1 * * 1-5
scheduled mode: shadow
manual modes: shadow | authoritative
```

Shadow mode performs:

```text
preserve reviewed fallback
→ generate runtime candidate
→ validate static snapshots
→ reject runtime regressions
→ pnpm --filter wu-t0-dashboard-web test
→ pnpm --filter wu-t0-dashboard-web build
→ write runtime manifest
→ upload evidence artifact
```

Shadow mode has `contents: read` and no deploy, push or raw-cache commit path. Authoritative mode additionally requires Cloudflare token/account/public URL, deploys the same candidate and runs the deployment smoke check.

## Cross-repository research artifact authentication

`publish-research-snapshot.yml` now distinguishes same-repository and cross-repository artifacts:

- same repository: `github.token`;
- cross repository: `RESEARCH_ARTIFACT_TOKEN` is mandatory and must have the minimum target-repository Actions read access needed by `actions/download-artifact`.

Current real-run evidence: `not-yet-run`.

A workflow definition or secret name alone does not prove cross-private-repository access. Before cutover, record a successful real artifact run or switch production publication to a direct/local monorepo path that does not need the cross-repository download.

## Pre-cutover shadow evidence

Five successful consecutive trading-day scheduled shadow runs are required. Fill a row only after the corresponding run exists.

| Trading day | Workflow run | Candidate data date | Artifact | Validation/build | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | not-yet-run | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 2 | not-yet-run | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 3 | not-yet-run | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 4 | not-yet-run | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 5 | not-yet-run | not-yet-run | not-yet-run | not-yet-run | not-yet-run |

Required manual same-day comparisons with current production:

| Comparison | Shadow artifact | Production page/date | Result |
| --- | --- | --- | --- |
| 1 | not-yet-run | not-yet-run | not-yet-run |
| 2 | not-yet-run | not-yet-run | not-yet-run |

Research publication evidence before cutover:

| Cycle | Monorepo/research commit | Publication path | Result |
| --- | --- | --- | --- |
| 1 | not-yet-run | not-yet-run | not-yet-run |
| 2 | not-yet-run | not-yet-run | not-yet-run |
| 3 | not-yet-run | not-yet-run | not-yet-run |

At least one cycle must be a real publication. Dry runs can supplement lower-frequency research cycles but cannot replace every real publication.

## Cutover-day gate

Cutover day status: `not-yet-run`.

Required order:

1. Start from reviewed monorepo `main` with the shadow workflow merged.
2. Manually run `dashboard-report.yml` in `authoritative` mode.
3. Require candidate generation, runtime safety validation, web tests/build, Cloudflare deploy and smoke check to succeed.
4. Verify the production URL serves the candidate data date.
5. Merge the prepared legacy Dashboard freeze PR.
6. Merge the prepared legacy Niu Men publication freeze PR only after monorepo research publication authority is proven.
7. Open and merge a separate small PR changing scheduled `SCHEDULE_MODE` from `shadow` to `authoritative`.
8. Run repository/deployment smoke again and record all SHAs/run URLs here.

Evidence fields:

```text
monorepo cutover SHA: not-yet-run
authoritative workflow run: not-yet-run
production URL: https://trading-research-dashboard.xiaowang01.workers.dev
production data date verification: not-yet-run
legacy Dashboard freeze merge SHA: not-yet-run
legacy Niu Men freeze merge SHA: not-yet-run
schedule activation PR/SHA: not-yet-run
post-cutover smoke: not-yet-run
```

The public URL above is the current monorepo Worker documented by this repository. The actual cutover check must still verify the configured `CLOUDFLARE_PUBLIC_URL` used by the authoritative run.

A manual static-demo check on 2026-08-28 found the root page reachable and `/data.json` containing 宝莱特 and `TSLA.US`, including TSLA daily and intraday data. That dated check establishes static-demo availability only; it does not replace authoritative cutover or continuous observation.

## Post-cutover observation

Track post-cutover acceptance in issue #19. It requires five consecutive trading-day authoritative runs after cutover.

| Trading day | Scheduled run | Deploy/smoke | Legacy writes absent | Result |
| --- | --- | --- | --- | --- |
| 1 | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 2 | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 3 | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 4 | not-yet-run | not-yet-run | not-yet-run | not-yet-run |
| 5 | not-yet-run | not-yet-run | not-yet-run | not-yet-run |

Post-cutover research publication through monorepo: `not-yet-run`.

Static fallback verification with realtime service absent/offline: `not-yet-run`.

## Rollback triggers

Evaluate rollback when any of these occurs:

- scheduled monorepo report fails on two consecutive trading days and cannot be repaired that day;
- candidate `data.json` is empty or regresses behind the last reviewed/known-good date;
- Cloudflare deploy/smoke failures leave production unavailable;
- realtime mode failure also breaks static fallback;
- research publication cannot update snapshots and the previous valid snapshot cannot remain safely served.

## Rollback procedure

1. Revert the schedule-activation PR so the monorepo schedule returns to shadow.
2. Use the legacy Dashboard manual rollback workflow with exact acknowledgement `legacy-dashboard-rollback`.
3. When needed, checkout Dashboard legacy SHA `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e`.
4. For research publication rollback, use the independently reviewed Niu Men rollback path and, when needed, legacy SHA `1be7f725772fa824ce34e2bb833867cb4c3e9fcb`.
5. Preserve failing workflow artifacts/run URLs and record the incident before restarting shadow observation.

Dashboard runtime rollback does not automatically transfer research publication authority back to the legacy Niu Men repository.

## M6b retirement boundary

Track retirement in issue #21 after the post-cutover observation in issue #19 is complete. The local legacy checkouts are no longer required for normal development and can be removed; remote repository archive/read-only decisions remain an external GitHub operation.

The two legacy READMEs now state that maintenance is unified in this monorepo, and their normal workflows are rollback-only. This is separate from a GitHub Archive operation. The M6b observation and caller-audit requirements remain independent gates; see [`legacy-retirement.md`](legacy-retirement.md).
