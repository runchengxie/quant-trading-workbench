# quant-trading-workbench 项目路线图

本文记录 Quant Trading Workbench 尚未完成的主要工作、实施顺序和验收边界。状态以当前代码和真实运行证据为准；workflow、脚本或 PR 的存在本身不等于生产 gate 已经发生。

## 当前状态总览

| 阶段 | 工作内容 | 状态 | 当前说明 |
| --- | --- | --- | --- |
| M0 | monorepo 基础和协作规则 | 已完成 | 根目录治理、目录边界、手动质量检查和独立 PR/worktree 规则已建立 |
| M1 | Dashboard 历史导入 | 已完成 | 代码位于 `apps/dashboard/`，由本仓库构建和部署 |
| M1 | Niu Men 历史导入 | 已完成 | 源码、测试和 producer 位于 `packages/niu-men-line-strategy/`；旧仓库已冻结，runtime authority 已随 M6 切换到 monorepo |
| M2 | `research-core` 共享包 | 已完成 | canonical Niu Men contract、generic strategy snapshot、fixture 和校验工具已进入共享包 |
| M2b | 跨策略快照契约 | 已完成 | `trading_research.strategy_snapshot.v1` 已落地，Niu Men 保留旧 wire adapter，R-Breaker 有 generic producer/consumer |
| M3 | Python workspace 和 package 依赖 | 已完成 | 根 `uv.lock` 是唯一锁文件，成员通过 uv workspace 统一解析 |
| M4 | 研究快照自动发布 | 已完成 | Niu Men publisher 与 R-Breaker artifact→generator→独立 snapshot PR 链路均已进入 `main`；R-Breaker 已完成一次真实 Tushare publication |
| M5 | 实时行情服务 | 基础 Redis 集成已验证，故障恢复与部署验证待执行 | Redis 7 CI 已验证实际读写、旧报价拒写、心跳、Pub/Sub 和同步 collector 写入；Redis/provider 断线恢复、WebSocket 重连、readiness 和静态 fallback 故障验证仍未执行 |
| M6 | runtime cutover | 已完成 | 手动 authoritative run #38917305897 在 SHA `601819b9c574010da62ec626b427f230734a13c0` 上通过；Pages 与 Cloudflare Worker 均返回非空数据，`generatedAt` 为 2026-10-16。工作日 schedule 已设为 authoritative；本封闭实验不要求五天观察 |
| M6b | legacy freeze / retirement | 外部调用方审计基本完成，归档决定待定 | 两个旧仓库的常规定时/推送入口已冻结。GitHub 代码搜索、本机 cron、落盘和已加载的 systemd 单元均未发现实际调用方。旧 `wu-t0` Worker 仍提供 2026-08-28 的陈旧快照，需决定是否下线及是否放弃旧回滚入口。Workbench 中指向旧 Niu Men 的默认 artifact 仓库已移除，来源需由操作者显式选择 |

## 已完成能力

当前 `main` 已具备：

- Dashboard 位于 `apps/dashboard/`
- 盘前概览、日内工作台和策略研究三个一级区域
- editorial research UI：暖白/深色研究主题、分隔线布局和更克制的 ECharts palette
- A 股/ETF 静态行情链路、港股兼容层和美股历史 bars 接入
- Dashboard 默认标的宝莱特、AAPL、MSFT、NVDA、TSLA；`--codes` 支持显式传入任意带市场标记的美股 ticker
- 日线、分时、ATR、VWAP、ORB、KMeans 支撑阻力和交易风格展示
- `data.json` 静态 fallback
- Niu Men `research_snapshot.v1/v2` parser/adapter
- `trading_research.strategy_snapshot.v1` generic strategy envelope
- R-Breaker 策略、输入 artifact 校验、snapshot generator、前端 registry，以及独立 strategy target publisher/workflow
- Cloudflare Workers Static Assets 部署
- Playwright PNG 图表导出和 `trading_research.chart_export.v1` manifest
- Alpaca 美股实时 collector、内存 QuoteStore、HTTP quote API 和 WebSocket overlay
- Alpaca US daily/1-minute historical provider、`GET /v1/bars/{symbol}` 和 Dashboard `market_compat` 映射
- Redis latest quote、Pub/Sub、collector heartbeat、runtime wiring，以及原子 monotonic quote write
- HK/US market metadata、币种和时区支持
- M6 shadow runtime candidate 校验、runtime manifest 和 evidence artifact
- 可直接部署的静态 demo 快照，当前包含宝莱特和 TSLA 的日线、分时与指标数据
- cross-repository research artifact token gate
- 静态资产校验、部署检查、前端测试、Python 测试和 foundation check

## 下一阶段

### M4：真实多策略发布

R-Breaker 生产发布代码链路已经进入 `main`，目标保持为所有策略通过明确 target 发布，不允许一个策略覆盖另一个策略的静态文件。

当前路径：

```text
Niu Men snapshot artifact
        ↓
shared publisher
        ↓
apps/dashboard/web/public/research.json

R-Breaker input artifact
        ↓
R-Breaker artifact validation
        ↓
generate_rbreaker_snapshot
        ↓
trading_research.strategy_snapshot.v1
        ↓
shared publisher (strategy_id=r-breaker)
        ↓
apps/dashboard/web/public/rbreaker-research.json
```

R-Breaker 已完成一次真实 Tushare publication，当前发布链路包括：

1. 使用真实 `trading_research.rbreaker_input.v1` artifact，文件大小和 SHA-256 校验通过。
2. generator 产出 generic snapshot 并记录 producer run id 与 input hash。
3. publisher 校验 schema、strategy identity、quality 和 provenance，并只修改 `rbreaker-research.json`。
4. 原始 minute bars 不进入 Git。
5. 真实发布证据已记录在 [`rbreaker-publication-verification-note.md`](../superpowers/specs/2026-08-27-rbreaker-publication-verification-note.md)。

### M5：完成实时行情运行时

已经进入 `main` 的能力包括：

- CN/HK/US symbol 与 market metadata
- 港股历史日线和近期分钟兼容层
- Alpaca StockDataStream 美股实时采集
- 当前单实例内存 QuoteStore
- `GET /v1/quotes/{symbol}` 与 WebSocket quote stream
- Dashboard 实时价格 overlay、stale 标记和静态 fallback
- Alpaca US daily/1-minute historical provider 与 `GET /v1/bars/{symbol}`
- yfinance US daily/1-minute historical fallback，无 Alpaca key 时可用
- 同一页面的 A股/港股/美股筛选；没有对应快照时显示明确空态
- Dashboard `market_compat` US daily/minute 映射和缓存 fallback
- Redis latest state、fixed-channel Pub/Sub、collector heartbeat、finite heartbeat TTL
- Redis-side 原子 monotonic quote write 与 subscription failure cleanup

代码已收口，但以下事项仍未完成：

1. **真实环境故障恢复验证**：Redis 7 CI 已覆盖读写、单调报价更新、心跳、Pub/Sub 和同步 collector 写入；仍需在集成环境覆盖 Redis loss、provider loss、reconnect、stale 和静态 fallback。
2. **readiness 运行验证**：确认 API alive、Redis unavailable、collector stale 和 upstream stale 在部署环境中返回正确状态。
3. **WebSocket Redis 验证**：确认 Redis snapshot bootstrap、Pub/Sub 更新、断线清理和重连行为。
4. **进程边界**：collector 与 API 按批准设计拆分运行，避免把当前 Alpaca stream thread/event loop 与单个 async Redis client 不安全地跨线程共享。

静态 `data.json` 在 M5 完整稳定前继续是安全 fallback。

仓库内的静态 `data.json` 也承担公开 demo 的基础数据。当前快照包含宝莱特和 TSLA，数据允许滞后于最新交易日，但页面功能应保持可演示。Worker 不会在浏览器端自动调用 yfinance 或 Alpaca，更新数据需要重新生成快照并部署。

### M6：runtime cutover 已完成

手动 authoritative run #38917305897 已通过 candidate generation、validation、build、Cloudflare deploy 和 smoke；Pages 与 Worker 均提供非空数据，数据日期与候选一致。工作日 schedule 已切换为 authoritative。实验是封闭环境中的 Dashboard 快照实验，不要求连续五天观察，也不构成投资建议。完整记录见 [运行切换手册](../operations/runtime-cutover.md)。

### M6b：legacy retirement

维护权声明、freeze 与 archive 是三个不同阶段。维护权声明已在两个旧仓库 README 完成，freeze 已合并，M6 authoritative cutover 也已完成。GitHub-visible 调用审计、本机 cron 和 systemd 运行态均未发现调用方。归档前仍须决定是否关闭旧 Worker，以及是否放弃旧 workflow 回滚能力。

freeze 后旧仓库成为 rollback mirror；真正 archive 还需要：

- Dashboard/Niu Men 冻结后的 no-write 状态已通过 GitHub Actions 记录核对；
- GitHub-visible caller audit 未发现旧仓库的实际代码调用方；
- cron、落盘 systemd 配置和已加载的 systemd 用户单元均未发现引用；
- `wu-t0-trading-dashboard` 的 Cloudflare Worker 仍公开响应，但 `data.json` 停留在 2026-08-28；需决定是否关闭该旧站点及回滚能力；
- Workbench 研究快照 workflow 不再默认使用旧 Niu Men 仓库；实际 artifact 来源由操作者显式指定；
- rollback SHA 和 procedure 可验证；
- repository setting 实际变成 archived 后才能记录 `archived`。

在这些条件发生前，文档必须保持 `not-yet-run`、`in-progress` 或具体阻塞原因，不提前写成完成。

## UI 设计改造

editorial research UI 已合并到 `main`。Dashboard 保留自己的业务内容和三段式信息架构，采用暖白研究底色、弱网格、细分隔线、减少圆角/阴影、蓝色结构强调、高密度研究表格以及更克制的 ECharts palette；深色主题和移动端无页面横向溢出已有浏览器回归覆盖。

UI 改造没有引入虚构的行业权重、市场 regime、打分或其他当前数据契约没有的内容，后续 UI 变更继续与 M5/M6 数据和运行时逻辑保持独立 PR 边界。

## 明确暂不做的事情

- 不把 `research-workspace`、`market-data-platform` 或 `etf-minute-fetcher` 作为 Git submodule 引入。
- 不把原始行情、完整 OOS 或 R-Breaker minute artifact 提交到 monorepo。
- 不在 R-Breaker publication PR 中修改策略逻辑或顺手做参数优化。
- 不把实时 tick 当作美股历史 provider。
- 不在没有真实 cutover/rollback 证据前停用或 archive 旧仓库。

## 相关文档

- [项目结构说明](../architecture/project-structure.md)
- [行情与图表导出能力](../capabilities/market-data-and-chart-export.md)
- [Runtime cutover runbook](../operations/runtime-cutover.md)
- [研究快照](../../apps/dashboard/docs/research-snapshot.md)
- [R-Breaker production publication design](../superpowers/specs/2026-08-27-rbreaker-production-publication-design.md)
