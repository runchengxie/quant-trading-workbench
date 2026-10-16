# Runtime Cutover Runbook

[简体中文](runtime-cutover.zh-CN.md)

This runbook records the dashboard snapshot experiment's migration to `quant-trading-workbench`, including evidence and rollback boundaries. The dashboard is an experimental interface, not investment advice. Workflow definitions alone do not establish deployment evidence.

## Current ownership

| Responsibility | Current authority | Target authority | Status |
| --- | --- | --- | --- |
| Dashboard source/build config | monorepo | monorepo | active |
| Manual Dashboard deploy | monorepo | monorepo | available |
| Weekday market-data generation + deploy | monorepo shadow workflow | monorepo authoritative workflow | authoritative schedule activated after successful manual run |
| Reviewed static `data.json` fallback | monorepo | monorepo | active |
| Research snapshot validation/publication | monorepo | monorepo | available |
| Legacy Niu Men Dashboard publication | monorepo publication path | monorepo publication path | legacy workflow rollback-only |
| Realtime market-data service | `apps/market-data-service/` | monorepo service | separate acceptance; not required by the static snapshot experiment |

## Exact rollback SHAs

These SHAs were read from the legacy repositories immediately before preparing the M6 freeze PRs on 2026-08-27.

| Repository | Last-known-good legacy SHA | Freeze state |
| --- | --- | --- |
| `runchengxie/wu-t0-trading-dashboard` | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` | freeze merged; rollback mirror |
| `runchengxie/niu-men-line-strategy` | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` | freeze merged; rollback mirror |

Do not move these rollback markers merely because the legacy branches receive documentation/freeze commits. A later rollback decision must explicitly choose whether it wants the pre-freeze legacy implementation SHA above or a reviewed freeze commit.

## Runtime workflows

### Legacy Dashboard

Legacy production workflow before its freeze:

```text
repository: runchengxie/wu-t0-trading-dashboard
workflow: .github/workflows/report.yml
schedule: 0 1 * * 1-5
normal production writes: disabled by merged freeze PR #44
```

The legacy workflow is manual and requires explicit rollback acknowledgement. It is not a normal data-generation or deployment path. Freeze PR #44 merged on 2026-08-28 at `dd24ac3da3ef45f5ad57ddbf5271b64c4ac8a0f4`.

### Monorepo shadow workflow

Current monorepo workflow:

```text
repository: runchengxie/quant-trading-workbench
workflow: .github/workflows/dashboard-report.yml
schedule: 10 1 * * 1-5
scheduled mode: authoritative
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

Shadow mode only builds and uploads a run-specific Actions evidence artifact; it skips both GitHub Pages and Cloudflare publication. The GitHub Pages artifact upload and deployment steps run only in `authoritative` mode. Historical shadow runs through 2026-10-16 did publish to the public GitHub Pages URL `https://runchengxie.github.io/quant-trading-workbench/`; this workflow fix does not remove or change that existing Pages site. Shadow mode does not push to the Git repository or commit raw caches, and its runtime manifest has `publicUrl: null`.

## Separate research publication workflow

`publish-research-snapshot.yml` now distinguishes same-repository and cross-repository artifacts:

- same repository: `github.token`;
- cross repository: `RESEARCH_ARTIFACT_TOKEN` is mandatory and must have the minimum target-repository Actions read access needed by `actions/download-artifact`.

Cross-repository artifact authentication is not a gate for the dashboard snapshot experiment. The research publication workflow has its own acceptance and must not block this cutover.

## Pre-cutover shadow evidence

Six scheduled runs completed candidate generation, snapshot validation, runtime safety checks, frontend tests/build and evidence upload. They are useful preflight evidence, not a required observation period. Runs through October 16 used the workflow version before PR #38; they also published GitHub Pages despite running in shadow mode. PR #38 gated future Pages publication to `authoritative`; it did not remove the existing Pages site. Cloudflare deployment was skipped in these shadow runs.

| Trading day | Workflow run | Candidate `generatedAt` date | Artifact | Validation/build | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | [2026-10-09 run 37898533589](https://github.com/runchengxie/quant-trading-workbench/actions/runs/37898533589) | 2026-10-09 | `dashboard-runtime-candidate-37898533589` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |
| 2 | [2026-10-12 run 38217075308](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38217075308) | 2026-10-12 | `dashboard-runtime-candidate-38217075308` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |
| 3 | [2026-10-13 run 38364174737](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38364174737) | 2026-10-13 | `dashboard-runtime-candidate-38364174737` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |
| 4 | [2026-10-14 run 38520333682](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38520333682) | 2026-10-14 | `dashboard-runtime-candidate-38520333682` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |
| 5 | [2026-10-15 run 38689167134](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38689167134) | 2026-10-15 | `dashboard-runtime-candidate-38689167134` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |
| 6 | [2026-10-16 run 38857741547](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38857741547) | 2026-10-16, verified on Pages | `dashboard-runtime-candidate-38857741547` | snapshot validation, tests and build passed | shadow passed, GitHub Pages deployed, Cloudflare skipped |

The October 16 run used commit `aa1595077a1978a65fb6aa2cd77a5e4c47abd330`, before PR #38 merged at `4d596af1adb3ec2a3a7e4c4699cfa611200986cf`. Its Pages deployment is historical behavior and does not establish a Cloudflare authoritative deployment. The deployed Pages `/data.json` reported `generatedAt: 2026-10-16` when checked.

## Cutover evidence

Cutover status: completed with the manual authoritative run below; weekday scheduling is activated by this PR.

The one-time authoritative cutover completed in run [#38917305897](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38917305897) on commit `601819b9c574010da62ec626b427f230734a13c0`. Candidate validation, web tests/build, GitHub Pages deployment, Cloudflare deployment and the deployment smoke check passed. Both public `/data.json` endpoints returned HTTP 200, a non-empty stock snapshot, and `generatedAt: 2026-10-16`. This closed experiment does not require five days of observation.

This PR changes scheduled `SCHEDULE_MODE` from `shadow` to `authoritative`. The first scheduled run remains an operational check; it is not a cutover gate.

Evidence fields:

```text
monorepo cutover SHA: 601819b9c574010da62ec626b427f230734a13c0
authoritative workflow run: https://github.com/runchengxie/quant-trading-workbench/actions/runs/38917305897 (success)
production URL: https://trading-research-dashboard.xiaowang01.workers.dev
GitHub Pages URL: https://runchengxie.github.io/quant-trading-workbench/
production data date verification: Pages and Worker `/data.json` both returned `generatedAt: 2026-10-16`, HTTP 200, non-empty stock data
schedule activation PR/SHA: this PR / recorded at merge
authoritative deployment smoke: passed in run #38917305897
```

The public URL above is the current monorepo Worker documented by this repository. The actual cutover check must still verify the configured `CLOUDFLARE_PUBLIC_URL` used by the authoritative run.

A manual static-demo check on 2026-08-28 found the root page reachable and `/data.json` containing 宝莱特 and `TSLA.US`, including TSLA daily and intraday data. That dated check establishes static-demo availability only; it does not replace authoritative cutover or continuous observation.

## After cutover

The experiment does not require five consecutive observation days. Review the first scheduled run for regressions and roll back to shadow if it fails the same runtime safety checks. Research publication and realtime service acceptance remain separate workstreams.

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
5. Preserve failing workflow artifacts/run URLs and record the incident before resuming the experiment.

Dashboard runtime rollback does not automatically transfer research publication authority back to the legacy Niu Men repository.

## M6b retirement boundary

The previously cited #19 and #21 are pull requests, not M6/M6b tracking issues (#19 is closed; #21 is merged). M6b retirement and external-caller audits remain separate work. The local legacy checkouts are no longer required for normal development and can be removed after a caller audit; remote repository archive/read-only decisions remain an external GitHub operation.

The two legacy READMEs now state that maintenance is unified in this monorepo, and their normal workflows are rollback-only. This is separate from a GitHub Archive operation. The M6b observation and caller-audit requirements remain independent gates; see [`legacy-retirement.md`](legacy-retirement.md).
