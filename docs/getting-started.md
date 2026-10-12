# Getting started

[简体中文](zh-CN/getting-started.md)

`quant-trading-workbench` supports market observation, intraday research probes and playbooks, execution experiments, and interactive research snapshots. Its web application lives at the stable `apps/dashboard/` path.

## Prepare the environment

Use Python 3.11+, `uv`, Node.js 22, and `pnpm` 11. Run from the repository root:

```bash
uv sync --locked
pnpm install --frozen-lockfile
```

## Run the Dashboard

The checked-in `apps/dashboard/web/public/data.json` supports a static demo with 宝莱特 and TSLA. It may lag the latest trading day. Start the frontend from the repository root:

```bash
pnpm --filter wu-t0-dashboard-web dev
```

To regenerate data, run from the Dashboard directory with the market-data service available for US instruments:

```bash
cd apps/dashboard
MARKET_DATA_SERVICE_URL=http://127.0.0.1:8000 \
  uv run --locked python -m trading_research.dashboard.astock_tech \
  --codes sz300246,AAPL.US,TSLA.US \
  --json web/public/data.json
```

Run frontend commands from the repository root after returning with `cd ../..`. Omit `--output-root` to use the configured external data root rather than a directory inside the checkout.

## Run local checks

Run these commands from the repository root:

```bash
uv run --locked --extra dev pytest -q
(cd apps/dashboard && uv run --locked --extra backtest pytest -q)
(cd apps/dashboard && uv run --locked ruff check src scripts tests)
(cd apps/market-data-service && uv run --locked pytest -q)
(cd apps/market-data-service && uv run --locked ruff check src tests)
pnpm --filter wu-t0-dashboard-web test
pnpm --filter wu-t0-dashboard-web build
```

These are focused checks. `.github/workflows/foundation.yml` defines the full manual foundation gate, including package checks, Dashboard and Niu Men coverage gates, type checks, dependency audits, and boundary checks. `.github/workflows/pr-ci.yml` defines the path-filtered Dashboard PR checks. A documentation change does not automatically run the manual foundation workflow.

## Credentials and data

US real-time quotes require `APCA_API_KEY_ID` and `APCA_API_SECRET_KEY` in the market-data service process. R-Breaker downloads require `TUSHARE_TOKEN`. Keep credentials out of frontend settings and Git.

For US historical daily or recent minute bars, `MARKET_DATA_HISTORICAL_PROVIDER=auto` can use yfinance without Alpaca credentials. Copy the root `.env.example` to `.env` for local settings when needed. See the component documentation and [roadmap](roadmap/README.md) for providers and publication.

The default project cache, research artifacts, and runtime outputs live outside the checkout at `~/data/quant/quant-trading-workbench`. External `quant-market-data-platform` and `etf-minute-fetcher` repositories own A-share and ETF raw data; their raw stores are not copied into this project data root.

## Deployments

The Dashboard deployment workflow publishes one frontend build to Cloudflare Workers Static Assets and a GitHub Pages static mirror. The runtime publication workflow currently fixes the US instrument scope to `TSLA.US`; it does not automatically publish the other generator defaults.

Enable GitHub Actions as the Pages source in repository settings before the first publication. Manual deployment and the existing weekday runtime workflows use the same `apps/dashboard/web/dist` build.

GitHub Pages serves reviewed static JSON snapshots and does not run the Python market-data service. Set the public `VITE_MARKET_DATA_URL` at build time for live quotes, with CORS permitting the Pages origin. Keep Alpaca, Tushare, and model credentials out of `VITE_*` variables.

## Share a source bundle

Run from the repository root:

```bash
uv run --locked python scripts/package_share.py --output /tmp/quant-trading-workbench-share.zip
```

The archive includes source, workflows, static snapshots, `.env.example`, and `SHARE-MANIFEST.json`. It excludes `.env`, real credentials, raw caches, `node_modules`, and build artifacts. The manifest records external data sources and their environment variables; raw data from `market-data-platform` and `etf-minute-fetcher` is excluded.

Recipients can run the static demo immediately after installing dependencies. To regenerate data, configure external data paths and the service's yfinance or Alpaca historical provider. The browser does not call either provider directly. The displayed markets follow the current snapshot.
