# 项目结构说明

当前仓库是 `quant-trading-workbench` 的集成 monorepo。Workbench、Niu Men、`research-core` 和实时行情服务核心已经进入仓库。仓库内部继续保留 `apps/dashboard/` 作为 Web 应用边界，不因为产品改名而移动目录或重命名运行时包。

## 当前结构

```text
quant-trading-workbench/
├── apps/
│   └── dashboard/
│       ├── src/trading_research/  # Dashboard Python 包
│       ├── tests/                 # Dashboard Python 测试
│       ├── web/src/               # React 和 TypeScript 源码
│       ├── web/public/            # 可发布静态 JSON
│       ├── scripts/               # Dashboard 检查和辅助脚本
│       └── docs/                  # Dashboard 技术说明
├── packages/
│   ├── research-core/             # 共享研究契约、状态探针和校验工具
│   └── niu-men-line-strategy/     # Niu Men 策略源码和发布工具
├── docs/                          # 跨应用架构、迁移和能力说明
├── scripts/                       # 根级检查脚本
├── tests/                         # monorepo 结构测试
├── pyproject.toml                 # 根级工具配置
└── uv.lock
```

## 推荐的长期结构

每个 Python 应用或 package 都使用自己的 `src/` 目录：

```text
apps/dashboard/src/trading_research/
packages/research-core/src/research_core/
packages/niu-men-line-strategy/src/niu_men/
```

这种结构可以让源码、测试、脚本和文档职责清楚，也能避免 Python 从仓库根目录直接导入未安装的模块。

前端继续使用 `apps/dashboard/web/src/`。这是 Web 工具链的标准目录，不需要为了和 Python 目录统一而移动到根级 `src/`。

## 文档分层

### 根 README

面向第一次接触项目的人，只保留项目用途、当前完成情况、最短启动路径、最基本的验证命令和详细文档入口。

### 应用和 package README

每个应用或 package 的 README 说明自己的职责、安装方式、常用命令和边界。它不承担完整的架构设计记录。

### `docs/`

这里保存需要持续维护的技术细节，包括数据源、缓存、字段契约、指标和策略逻辑、静态快照、研究快照、图片导出、Cloudflare 部署、跨项目迁移和实时行情 roadmap。

### `docs/superpowers/`

这里保留设计和实施过程中的历史记录。历史计划中的路径、测试数量和阶段状态可能属于当时的上下文，当前事实应以根 README、应用文档和现行 workflow 为准。

## 迁移顺序

目录调整应配合功能边界逐步进行：

1. Niu Men 导入 `packages/niu-men-line-strategy/src/`，保留可追溯历史。
2. 把共享 schema、fixture 和 provenance 校验放入 `packages/research-core/src/`。
3. 通过 Python workspace 声明本地 package 依赖。
4. 为实时行情服务建立独立应用或服务目录，不把长驻采集进程塞进 Dashboard Web 应用。
5. 运行稳定后，再评估旧仓库的 runtime cutover 和归档。

当前阶段先保持 Dashboard 的既有路径和部署方式稳定，不进行大范围目录移动。

## Market State Probe

`research-core.state_probe` 用于研究跨交易日的市场状态变量，例如短期均值相对长期均值的压缩程度。它输出当前状态和多个 forward horizon 的条件统计，并明确区分事件日命中数、独立 episode 数、可计算样本与右截尾样本。

Dashboard 通过可选的 `stateProbe` 字段读取该快照。`censoredCount` 表示数据尾部尚不足以计算指定 horizon 的命中，不进入收益、胜率或均值的分母；`averageCapitalOccupancy` 与 `peakCapitalOccupancy` 表示重叠持有窗口的资金需求，不能把命中数直接理解为独立交易机会。

仓库中的 `apps/dashboard/web/public/state-probe.example.json` 只是合约和 UI 的 synthetic fixture，不代表生产行情或投资结论。
