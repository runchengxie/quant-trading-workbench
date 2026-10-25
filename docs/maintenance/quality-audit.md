# 维护性审查记录

## 2026 年 10 月 26 日 Dashboard 类型工具锁定

Dashboard 的开发依赖将 `ty` 固定为 `0.0.74`，由 workspace `uv.lock` 管理。
PR 和完整质量 workflow 均使用该锁定版本，避免 `--with ty` 在锁文件之外解析工具。
本地在 `apps/dashboard` 目录运行相同命令：

```bash
uv run --locked --extra backtest --extra alpaca ty check src
```

同一份源码和业务依赖下，`ty 0.0.63` 曾报告五项诊断，涉及字典值窄化、
`Timestamp` 返回值、JSON 标的键和可选的 `backtrader` 导入；`0.0.74` 检查通过。
运行时已拒绝缺失或无时区的时间戳，JSON 输入中的标的键也是字符串。
本次保留现有业务实现和检查范围，通过锁定已验证工具消除版本差异。

## 2026 年 9 月 4 日 runtime report 修复

定时 `Dashboard runtime report` 在 provider 只返回部分标的时，原先会先保留可用候选，随后因为候选缺少基线标的而失败。现在校验脚本接收 `--mode shadow|authoritative`。`shadow` 模式允许记录缺失标的并继续发布候选，`authoritative` 模式仍会拒绝不完整候选。两种模式都会拒绝生成日期回退、交易日回退和空候选。

本次修复覆盖实际失败场景：2026 年 9 月 4 日的运行中，TSLA provider 返回缺失，候选只包含宝莱特，失败原因是 `candidate is missing baseline instrument TSLA.US`。同一次运行中的 `yfinance` 弃用警告来自上游库，当前没有项目内直接调用点。

本轮维护还将 R-Breaker 的纯 Sharpe 计算移到 `strategies/rbreaker_metrics.py`。旧的 `rbreaker.annualized_sharpe_from_returns` 导入路径继续保留，回测参数和结果口径不变。`instrument_config.py` 与 `provider_policy.py` 新增边界测试，后续拆分大模块时可以沿用相同的纯函数优先方式。

## 2026 年 9 月 1 日工程整理

本次整理以当前 `main` 和 `feat/modern-web-api-foundation` 的代码为准。仓库仍不使用 Git submodule，外部研究仓库保持同级独立目录。前端已迁移到根目录 `pnpm` workspace，使用根目录 `pnpm-lock.yaml`，并引入 Tailwind CSS 4 和本地 `shadcn/ui` `Button` 组件。ECharts、静态 `data.json` fallback、FastAPI 行情服务和 WebSocket 实时价格链路继续保留。

FastAPI 行情接口现在使用命名的 Pydantic response model，OpenAPI schema 可由 `apps/market-data-service/scripts/export_openapi.py` 导出。Dashboard 通过 `marketDataApi.ts` 检查服务状态，并将无法确认的状态显示为未知，不把一次健康检查失败直接判断为服务故障。

前端 CI 已统一使用 `pnpm/action-setup`、`pnpm install --frozen-lockfile`、workspace filter 和 `pnpm audit`。历史迁移文档中的旧命令保留原始记录，当前操作说明以 README、`docs/getting-started.md` 和各组件现行文档为准。

## 2026 年 8 月 28 日收尾补充

本次收尾将仓库静态 demo 快照补齐为宝莱特和 TSLA。TSLA 快照包含 667 条日线和 390 条 1 分钟数据，静态资源校验通过，线上 Worker 的 `/data.json` 已确认返回两个标的。线上 demo 检查属于部署验证，不代表 M6 authoritative runtime cutover 已完成。

本次验证结果：Dashboard Python 测试 104 个通过，根目录测试 83 个通过，前端测试 49 个通过，前端生产构建通过，分享包检查确认不包含凭据、缓存、`node_modules` 或测试产物。

本段记录 2026 年 8 月 27 日审计时的状态，后续已发生变化：Dashboard authoritative cutover 已完成，不要求五个交易日 shadow 观察；两个旧仓库已归档，旧 Dashboard Worker 入口已关闭，历史 GitHub Pages 页面按用户选择保留公开。Redis 故障注入、provider 故障与重连仍需真实环境验证，详见 [Runtime Cutover Runbook](../operations/runtime-cutover.md)。

本文记录 2026 年 8 月 27 日对仓库文档、测试和代码结构的审查结果。它区分已经修复的问题和仍需要单独安排的重构，避免把建议误读为已完成工作。

## 仓库边界

当前仓库没有 Git submodule，也没有 gitlink。`git submodule status` 和 gitlink 检查均为空。

以下目录是同级的独立仓库，不属于当前项目的 submodule：

- `research-workspace`
- `market-data-platform`
- `etf-minute-fetcher`
- `wu-t0-trading-dashboard`
- `niu-men-line-strategy`

当前仓库只通过稳定的 Python package、文件目录、API 和 GitHub artifact 与它们协作。

## 本次已处理

- 行情服务 README 改成快速开始页，接口、运行配置和 Dashboard 接入说明移到 `apps/market-data-service/docs/`。
- 根 README 补充行情服务测试入口和当前仓库边界。
- 迁移文档、能力文档和路线图修正过期状态。
- foundation workflow 新增行情服务测试、行情服务 Ruff、Dashboard Ruff 和 research-core 测试。
- Dashboard Ruff 增加 `B` 和 `UP` 检查。
- 修复 Dashboard 循环中的闭包捕获变量问题。
- 删除不再需要的 Python UTF-8 编码声明和失效的 `noqa`。
- 修正 Niu Men 文档中指向未提交研究产物的失效链接，并明确研究产物的外部存储边界。
- Redis runtime 代码增加独立的同步 collector sink、异步 API store、Pub/Sub WebSocket 路径和 `/readyz` 基础检查。
- Dashboard 动态 `vwap_dev_k`、固定长度输入元组和可选 `backtrader` 的类型边界已收敛，Dashboard `ty check` 已加入 CI。
- Dashboard coverage 当前约为 64%，CI 暂以 60% 作为防回退基线。R-Breaker 策略类已拆到 `strategies/rbreaker_strategy.py`，数据加载器和指标计算也已分别拆出。
- 已增加真实 Redis 集成测试和独立 workflow。workflow 会启动 Redis 7，验证状态单调写入、心跳、同步 collector sink 和 Pub/Sub。
- R-Breaker 六个价位的纯计算已移到 `strategies/rbreaker_math.py`，Dashboard 配置已移到 `dashboard/instrument_config.py`。
- R-Breaker 的数据下载、加载和交易日查询已移到 `strategies/rbreaker_data.py`，旧模块继续提供兼容名称。
- `data_sources.py` 的运行时 CSV 缓存已移到 `data/cache.py`，provider 重试和配额分类已移到 `data/provider_policy.py`，数据源选择和字段标准化仍留在原模块。
- 两个 OOS 脚本共用的 PIT 数据处理已移到 `niu_men_line_strategy.oos_support`，旧脚本入口保持兼容。
- market-data-service 测试已改用 Starlette 推荐的 `httpx2` 依赖。

## 仍需单独处理的代码问题

### 类型检查

market-data-service、Dashboard 和 Niu Men 的 `ty check` 当前通过。Dashboard 同时使用 `--extra backtest --extra alpaca` 检查可选的回测与 Alpaca 路径，运行时仍会在依赖缺失时给出明确错误。

### 大模块

以下文件仍然体量较大，后续可以按职责拆分：

- `apps/dashboard/src/trading_research/dashboard/astock_tech.py`
- `apps/dashboard/src/trading_research/data/data_sources.py`
- `apps/dashboard/src/trading_research/strategies/rbreaker.py`，保留 CLI、回测运行和输出职责
- `packages/niu-men-line-strategy/portfolio.py`
- `packages/niu-men-line-strategy/scripts/run_industry_context_oos.py`
- `packages/niu-men-line-strategy/scripts/run_portfolio_oos.py`

建议先提取纯函数和数据结构，再移动文件。不要在拆分时同时修改策略参数、数据字段或研究结果。

### 兼容入口与一次性脚本

`apps/dashboard/backtest/rbreaker.py`、Niu Men 的 snapshot wrapper、历史数据源适配器和多个 OOS 脚本可能包含迁移期兼容代码。当前不能只根据文件名删除。删除前需要搜索仓库内调用方，并检查兄弟仓库、cron、systemd、Hermes 和手动 workflow。

### 测试覆盖

- Dashboard 全量测试当前为 102 个通过，coverage 报告约为 64%，R-Breaker 策略实现拆分后主文件覆盖率约为 17%，策略类约为 71%。已覆盖突破、反转、止损、收盘平仓、信号评估和采集失败测试，CI 继续使用 60% 防回退阈值。后续应优先覆盖完整 Backtrader 多日运行和数据源失败路径。
- market-data-service 当前有 65 个单元测试，另有 2 个真实 Redis 集成测试，并由独立 workflow 启动 Redis 7 执行。默认测试仍不要求本地安装 Redis，集成测试通过 `REDIS_URL` 显式启用。
- Niu Men 已有 80% coverage gate。
- 前端有单元测试和生产构建，Playwright E2E 受 Actions 配额限制，需单独运行。

真实 Redis workflow 目前覆盖状态写入、心跳和 Pub/Sub。Redis 断线、provider 断线以及 WebSocket 重连的部署环境故障注入仍待执行。过期心跳、连接失败和客户端重连已有单元测试。

### 调用方审计结果

已检查当前仓库以及同级的 `research-workspace`、`niu-men-line-strategy` 和 `wu-t0-trading-dashboard`。当前发现的实际调用主要来自本仓库 workflow、Dashboard 前端和旧版 Dashboard 测试。`wu-t0-trading-dashboard` 仍保留旧版 `astock_tech`、`data_sources` 和 R-Breaker 副本，不能视为当前仓库的 submodule。

当前没有找到可安全删除的 wrapper 或 OOS 脚本。`cron` 调度位于旧版 Dashboard 和当前 workflow 中，当前仓库没有 systemd 配置，也没有 Hermes 配置文件。删除历史入口前仍应让外部部署方确认调用关系。

## lint 配置说明

当前代码保留中文用户界面字符串和中文注释。Ruff 的 `RUF001`、`RUF002`、`RUF003` 会把中文全角标点当作可疑字符，因此不适合直接作为中文项目的全局强制规则。`B`、`UP`、导入顺序和基础错误检查适合继续开启。

当前 CI 已覆盖：

- 根契约和 workflow 测试
- Dashboard Python 测试、Ruff、前端测试和构建
- market-data-service 测试、Ruff
- research-core 测试、Ruff
- Niu Men 测试、Ruff、ty 和 coverage
- Python 依赖审计与前端 `pnpm audit`

真实 provider、Redis 断线与重连、WebSocket 重连、生产 R-Breaker 发布和浏览器 E2E 仍属于独立验证任务。

### 已知测试警告

market-data-service 测试目前只剩 `websockets.legacy` 一条上游弃用警告。它来自 Alpaca SDK 的内部兼容层，项目没有直接导入。后续升级 Alpaca SDK 时，应重新评估是否能迁移到新的 websockets API。

## 2026-10-17 工作区审计

本次保持 `niu_men.research_snapshot.v2`、Market Data Service OpenAPI 和生成的 API client 不变，修复了以下已复现的问题：

- 配置 collector 后，Redis 心跳读取失败会使 `/readyz` 返回 500。现在返回既有结构的 503，并标记 Redis 不可用、collector 过期。测试覆盖 ping 同时失败和仅心跳读取失败，且检查故障恢复后的状态。
- foundation 检查遗漏已经提交的 API client 文件，导致当前仓库检查及三个根测试失败。现在只登记六个既有路径，新增测试同时保留未审阅文件的拒绝行为。
- 发布脚本为设置源码导入路径而产生 Ruff E402。将安装函数的导入移至调用位置，保留现有入口和路径解析；发布预检测试继续通过。
- `pnpm audit --audit-level high` 在锁文件中发现三个高危、一个中危记录。仅刷新兼容范围内的间接依赖：`fast-uri` 3.1.6 → 3.1.8，`source-map-js` 1.2.1 → 1.2.2。前者位于开发依赖 `ajv` 路径，涉及 GHSA-qw65-cvwx-89v3（修复范围 ≥3.1.7）和 GHSA-58mr-gqgx-xq4g（报告受影响版本 =3.1.6）；后者位于 Tailwind/Vite、PostCSS 构建路径，涉及 GHSA-68fv-2mgg-jv7q（修复范围 ≥1.2.2）。未改变直接依赖声明；更新后审计报告未发现已知漏洞。

实际验证包括 Research Core、Dashboard、Niu Men、market-data-service 和根测试，Dashboard 覆盖率为 73%（门槛 60%）；API 生成一致性、API exporter 测试、111 项前端测试与 TypeScript/Vite 构建通过。隔离环境的 Dashboard 和 Niu Men 类型检查通过。默认沙盒下 TestClient 线程挂起、共享临时目录写入空间不足不作为源码失败处理；使用独立数据目录和允许线程运行的环境复验。生产 provider、真实 Redis 集成和浏览器 E2E 未在本次执行。

Python 审计还报告 `urllib3` 2.7.0 的 PYSEC-2026-4177、PYSEC-2026-4176 和 PYSEC-2026-4175，修复版本均为 2.8.0。本次仅刷新该锁定间接依赖，不修改直接依赖范围。根测试复制仓库的 fixture 会重复复制 `node_modules`，安装前端依赖后可耗尽临时盘；现在仅在测试副本中排除该生成目录，源码边界检查和拒绝未审阅文件的断言继续执行。

Niu Men 覆盖率为 92%（门槛 80%）。其原有 snapshot exporter 未满足全包格式检查；本次仅格式化该文件，AST 前后相同，52 个文件的格式检查现已通过。完整外部依赖锁定清单的严格 Python 审计未发现已知漏洞。

PR 质量检查现在也运行根目录 foundation 测试、边界检查和 Market Data Service 全部无凭据测试及 lint，`scripts/**`、`tests/**` 的变更会触发该检查。独立的真实 Redis integration workflow 保留原有隔离服务；普通 readiness 回归不再只依赖手动 foundation workflow。

### 退役后复核

当前主分支复跑 `uv run --locked --extra dev pytest -q tests/test_foundation.py`，55 项通过；`uv run --locked python scripts/check_foundation.py` 也通过。API client 六个精确路径的 allowlist 是 PR #44 修复后的有意限制；新增未审阅文件仍由测试拒绝，因此本次无需再改规则。

旧仓库归档及旧 Worker 入口关闭状态已记录在[退役记录](../operations/legacy-retirement.md)。authoritative Worker 控制面仍启用。2026-10-17 的 Agent paper portfolio workflow #38987305011 后来成功部署了同一 Worker；检查该次运行源码里的静态 `data.json` 发现日期为 2026-08-28，因此该发布很可能把 Worker 最新运行数据覆盖成旧仓库快照。当前审计环境无法直连公开 Worker URL，不能直接确认响应体；但 Cloudflare 部署时间、成功的 Agent 发布步骤及其输入快照共同表明这是实际发布风险。

已修复 Agent workflow：发布前必须从当前 Worker 取回 `data.json` 并保留到构建产物；没有配置公开 URL 时跳过 Pages/Worker 发布；已配置但取回市场快照或旧 Agent 状态失败时则失败退出，不再以旧静态种子静默降级。回归测试覆盖市场快照保留和两个发布目标的门控。

修复合并后已手动运行 [Dashboard runtime report #39000823904](https://github.com/runchengxie/quant-trading-workbench/actions/runs/39000823904)，authoritative 发布、Pages 部署和 `Verify authoritative deployment` 均通过。运行 manifest 确认 `dataGeneratedAt` 为 `2026-10-16`；Cloudflare 控制面显示该次 Worker deployment 于 `2026-10-17T03:59:45Z` 创建且版本流量为 100%。这是周六发布，市场数据日期仍是前一交易日 10 月 16 日。最新部署记录和运行证据已恢复一致。

本次文档审计修正了旧 Worker/Pages 状态、M6b 归档状态、Niu Men 导入状态和跨仓库快照发布说明。Superpowers 计划与设计文件保留为历史记录，不改写当时的决策和执行步骤。
