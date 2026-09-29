# Quant Trading Workbench

[中文 README](README.zh-CN.md)

`quant-trading-workbench` is an interactive workbench for quantitative research and trading decisions. It combines market observation, intraday research probes, intraday playbooks, execution experiments, research snapshots, and paper-portfolio experiments. It connects observations, events, instruments, and research evidence so researchers can inspect where a conclusion holds, which samples support it, and how it changes over time.

The workbench observes, experiments, and replays intraday ideas. A candidate can enter the canonical strategy layer in `quant-research` only after its assumptions, post-cost results, out-of-sample behavior, and robustness have been reviewed. The web application remains under `apps/dashboard/` as a stable path.

## Maintenance status

This repository is the unified maintenance line for `quant-trading-workbench`. It incorporates the Dashboard, strategy research, and shared contracts from `wu-t0-trading-dashboard` and `niu-men-line-strategy`. New development, fixes, releases, and operations use this repository; the two legacy repositories remain available for historical tracing and rollback.

See [Workbench boundaries](docs/workbench-boundary.md) for the boundary around intraday research objects.

## Where to start

- [Getting started](docs/getting-started.md)
- [Project structure](docs/architecture/project-structure.md)
- [Current roadmap](docs/roadmap/README.md)
- [Runtime cutover runbook](docs/operations/runtime-cutover.md)
- [Agent paper-portfolio experiment](docs/agent-paper-portfolio.md)

## Repository layout

```text
apps/dashboard/                 Data processing, strategy research, and web dashboard
apps/market-data-service/       US real-time and historical market-data service
packages/research-core/         Research snapshots and JSON Schema
packages/niu-men-line-strategy/ Niu Men strategy and research tools
docs/                           Architecture, configuration, deployment, and maintenance docs
tests/                          Root contracts and workflow tests
apps/dashboard/web/public/agent/ Agent paper-portfolio snapshots
```

The dashboard supports A-share, Hong Kong, and US stocks and ETFs. Generator defaults include AAPL, MSFT, NVDA, and TSLA. The repository also includes runnable demo snapshots for 宝莱特 and TSLA. R-Breaker research results are available in the strategy research area.

Live dashboard: <https://trading-research-dashboard.xiaowang01.workers.dev>

## Quick start

Requirements: Python 3.11+, `uv`, Node.js 22, and `pnpm` 11.

```bash
uv sync
(cd apps/dashboard && uv run --extra backtest pytest -q)
pnpm install
pnpm --filter wu-t0-dashboard-web test
pnpm --filter wu-t0-dashboard-web build
```

The static demo snapshot at `apps/dashboard/web/public/data.json` is deployable and currently contains 宝莱特 and TSLA. It may lag the latest trading day. Regenerate it from `apps/dashboard` with:

```bash
MARKET_DATA_SERVICE_URL=http://127.0.0.1:8000 \
  uv run python -m trading_research.dashboard.astock_tech \
  --codes sz300246,TSLA.US --json web/public/data.json
```

The Dashboard also has an `Agent Portfolio` page for low-frequency A-share paper-investment experiments, including NAV, holdings, decisions, and fills. GitHub Actions runs the experiment on each business day and uses Tushare for ETF prices by default. It does not connect to a broker or send live orders. See [Agent paper-portfolio experiment](docs/agent-paper-portfolio.md) for configuration and boundaries.

The market-data service uses FastAPI with named Pydantic response models for the `health`, `ready`, `quote`, and `bars` REST endpoints. FastAPI uses these models to generate the OpenAPI schema. Export it for frontend code generation or other tools with:

```bash
cd apps/market-data-service
uv run --locked python scripts/export_openapi.py /tmp/market-data-openapi.json
```

The web dashboard prefers static snapshots. Setting `VITE_MARKET_DATA_URL` additionally checks market-data service health and connects the existing WebSocket. If the service is unavailable, the page stays in static fallback mode.

Scheduled runtime reports default to `shadow` mode. If a provider temporarily lacks a baseline instrument, the workflow keeps available candidates and records the missing instrument. `authoritative` mode requires full baseline coverage and is intended for strict publication after production cutover.

Create a safe source bundle for private sharing:

```bash
uv run python scripts/package_share.py --output /tmp/quant-trading-workbench-share.zip
```

The bundle includes source, workflows, the static Dashboard snapshot, and `SHARE-MANIFEST.json`, while excluding `.env`, real keys, raw caches, and build artifacts. Raw data from the external `market-data-platform` and `etf-minute-fetcher` projects is not included; the manifest records those sources, environment variables, and their excluded status.

To show US instruments on the same page, generate a snapshot with explicit US tickers such as `--codes sz300246,AAPL.US,MSFT.US,NVDA.US,TSLA.US`. Without a US snapshot, the US filter remains an empty state and does not fabricate quotes.

## Boundaries

`research-workspace`, `market-data-platform`, and `etf-minute-fetcher` are separate repositories outside this project. The repository has no Git submodules. Raw market data, credentials, and large backtest artifacts stay outside Git.

## Current status

- M0 through M4 are complete, including one real R-Breaker Tushare snapshot publication.
- M5 code and the yfinance historical fallback are complete. Real Redis, provider, and deployment-failure validation remains pending.
- M6 shadow runtime and safety checks are complete. Production cutover and continuous runtime observation still require real execution evidence.
- M6b declares the two legacy repositories as a unified maintenance line. Freeze, caller audit, and archive remain operational tasks.

See [`docs/roadmap/README.md`](docs/roadmap/README.md) for the detailed status. This project supports strategy research and engineering validation. Historical data and backtest results do not imply future returns.
