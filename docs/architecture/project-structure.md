# Project structure

[简体中文](project-structure.zh-CN.md)

`quant-trading-workbench` integrates the Dashboard, Niu Men, `research-core`, and the real-time market-data service. `apps/dashboard/` remains the stable boundary for the web application and Dashboard Python package. Product naming does not rename runtime packages or persisted contracts.

## Current directories

```text
apps/dashboard/src/trading_research/        Dashboard data processing and research
apps/dashboard/web/                         React, TypeScript, and reviewed static snapshots
apps/market-data-service/src/market_data_service/  FastAPI market-data service
packages/research-core/src/research_core/    Shared schemas, validation, and research mechanisms
packages/niu-men-line-strategy/src/niu_men/  Niu Men strategy and publication tools
docs/                                       Cross-application architecture, operations, and migration
scripts/                                    Root validation and publication entry points
tests/                                      Monorepo boundaries and cross-component contracts
```

Python applications and packages keep their own `src/`, tests, and documentation. Root `pyproject.toml` and `uv.lock` manage the Python workspace. Root `pnpm-workspace.yaml` and `pnpm-lock.yaml` manage the frontend. Do not create a separate Dashboard `package-lock.json`.

The market-data service already lives in its own `apps/market-data-service/` application. Its FastAPI endpoints use named response models and expose an OpenAPI schema. Real Redis, provider, and deployment-failure validation remain separate operational tasks; merged source is not production acceptance.

## Components and contracts

The Dashboard prefers static JSON. Setting the public `VITE_MARKET_DATA_URL` enables service-health checks and the WebSocket connection. Unavailable services retain static fallback. Raw market data and service credentials do not belong in the browser.

`research-core` owns research snapshot schemas, validation, provenance, and state probes. Migration preserves `niu_men.research_snapshot.v2`. Other versioned contracts retain their identifiers as well; display names and locale do not rename them.

`research_core.state_probe` studies cross-day states and forward outcomes. It distinguishes event hits, independent episodes, evaluable samples, and right-censored observations. The Dashboard consumes the optional `stateProbe` field. `censoredCount` is excluded from return, win-rate, and mean denominators; `averageCapitalOccupancy` and `peakCapitalOccupancy` measure capital needed by overlapping windows. `state-probe.example.json` is a synthetic contract/UI fixture, not production market data or an investment conclusion.

Observation rules are research tools by default. The Workbench can consume published `quant-research` snapshots and supply candidate hypotheses. Strategy promotion and formal validation remain owned by `quant-research`; see [Workbench boundaries](../workbench-boundary.md). The Agent page presents paper portfolios and does not send real orders.

## Documentation and runtime boundaries

The root README provides purpose, status, short startup commands, and validation entry points. Application/package READMEs describe their own responsibilities, configuration, and commands. `docs/` maintains cross-component facts. `docs/superpowers/` and migration records preserve dated designs, paths, and evidence rather than replacing current status.

Source, schemas, and workflows have moved into this repository. External market-data projects remain independent repositories, and this monorepo has no submodules. Production cutover and continuous observation still require the gates in the [cutover runbook](../operations/runtime-cutover.md); completed directory migration does not pass those gates.

See [Getting started](../getting-started.md) for startup and focused checks. `foundation.yml` defines the full manual gate, while `pr-ci.yml` defines path-filtered Dashboard PR checks. Documentation changes do not automatically execute production checks or deployment.
