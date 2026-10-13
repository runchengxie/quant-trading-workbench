# 项目结构

[English page](project-structure.md)

`quant-trading-workbench` 集成 Dashboard、Niu Men、`research-core` 和实时行情服务。`apps/dashboard/` 仍是 Web 应用和 Dashboard Python 包的稳定边界，产品名称不改变运行时包名或持久化契约。

## 当前目录

```text
apps/dashboard/src/trading_research/        Dashboard 数据处理和研究
apps/dashboard/web/                         React、TypeScript 和审核后的静态快照
apps/market-data-service/src/market_data_service/  FastAPI 行情服务
packages/research-core/src/research_core/    共享 schema、校验和研究机制
packages/niu-men-line-strategy/src/niu_men/  Niu Men 策略与发布工具
docs/                                       跨应用架构、操作和迁移说明
scripts/                                    根级验证与发布入口
tests/                                      monorepo 边界和跨组件契约测试
```

各 Python 应用和 package 使用自己的 `src/`、测试和文档。根 `pyproject.toml` 与 `uv.lock` 管理 Python workspace，根 `pnpm-workspace.yaml` 与 `pnpm-lock.yaml` 管理前端。不要在 Dashboard 子目录另建 `package-lock.json`。

行情服务已经位于独立的 `apps/market-data-service/`，并非待建目录。FastAPI 提供命名的响应模型和 OpenAPI schema。真实 Redis、provider 和部署失败验证仍是独立运维事项，源码合并不代表生产验收。

## 组件与契约

Dashboard 优先消费静态 JSON，设置公开 `VITE_MARKET_DATA_URL` 后可检查服务健康并连接 WebSocket。服务不可用时保留静态 fallback。原始行情和服务凭据不进入浏览器。

`research-core` 保存研究快照 schema、校验、provenance 和状态探针。迁移期间保留 `niu_men.research_snapshot.v2`。其他版本化契约也须保留自己的标识，不能因展示名称或语言变化而重命名。

`research_core.state_probe` 研究跨交易日状态及 forward outcome，区分事件命中、独立 episode、有效样本和右截尾样本。Dashboard 通过可选 `stateProbe` 消费结果。`censoredCount` 不进入收益、胜率或均值分母；`averageCapitalOccupancy` 和 `peakCapitalOccupancy` 表示重叠窗口的资金需求。`state-probe.example.json` 是合成契约与 UI fixture，不是生产行情或投资结论。

观察规则默认是研究工具。Workbench 可以读取 `quant-research` 发布的快照并提供候选假设，但策略晋升与正式验证仍由 `quant-research` 管理，见[Workbench 边界](../workbench-boundary.md)。Agent 页面展示纸面组合，不发送真实订单。

## 文档与运行边界

根 README 提供用途、状态、最短启动和验证入口。应用与 package 的 README 记录各自职责、配置和命令。`docs/` 保存持续维护的跨组件事实；`docs/superpowers/` 和迁移记录保存当时的设计、路径与证据，不能代替当前状态。

代码、schema 和 workflow 已迁入本仓库，外部行情项目保持独立仓库，本项目没有 submodule。生产切换和连续观察仍按[切换手册](../operations/runtime-cutover.md)逐项验收，不因目录迁移完成而标成通过。

启动与局部检查见[新人上手](../zh-CN/getting-started.md)。`foundation.yml` 定义完整手动门禁，`pr-ci.yml` 定义按路径筛选的 Dashboard PR 检查。文档修改不会自动执行完整生产检查或部署。
