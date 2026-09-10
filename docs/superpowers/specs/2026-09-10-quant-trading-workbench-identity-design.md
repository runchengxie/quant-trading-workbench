# `quant-trading-workbench` 身份迁移设计

## 背景

当前仓库名为 `trading-research-dashboard`，内部已经是一个包含行情服务、策略研究、研究契约、Agent 纸面组合和 React Web 应用的 monorepo。它的实际职责已经超出单纯的 Dashboard：用户在这里观察市场现象、运行日内规则探针、查看 playbook 和执行实验，并沿着标的、事件和研究快照进行交互式钻取。

本次改造的目标是让仓库名称和产品边界表达这一事实，同时保留现有运行路径和兼容契约，避免把一次品牌迁移扩大成代码所有权迁移。

## 目标

1. 将仓库的 canonical 产品身份统一为 `quant-trading-workbench`。
2. 在 README 和核心架构文档中明确 Workbench 与 `quant-research` 的边界：Workbench 负责 observation、research probe、intraday playbook、execution experiment 和交互式 drilldown；经过严格验证的 alpha candidate 才进入 `quant-research`。
3. 保持代码和部署的稳定边界：继续使用现有 `apps/`、`packages/`、workflow 路径、Python import 包名、Cloudflare 线上 URL 和 `niu_men.research_snapshot.v2`。
4. 为未来的 GitHub 仓库改名和本地目录迁移提供清晰的迁移说明。

## 非目标

- 不在仓库内部新增 `quant/` 父目录。
- 不把 Python distribution `trading-research-dashboard-app` 改名。
- 不把 `trading_research` Python import namespace 改成 `quant_*`。
- 不拆分 `apps/dashboard`、`apps/market-data-service` 或现有 packages。
- 不把日内策略迁移到 `quant-research`，也不新增 cohort explorer、research series chart 等功能；这些属于后续产品迭代。
- 不修改线上 Cloudflare URL、静态资产格式、workflow 触发策略或已有研究契约。

## 方案

### 仓库身份

目标 GitHub 仓库名为 `quant-trading-workbench`，目标本地 checkout 目录为 `/home/richard/code/quant-trading-workbench`。在代码 PR 中先更新仓库内可发布的名称和文档；GitHub repository rename、remote URL 更新和最终本地目录迁移作为独立的运维步骤处理。

仓库内的 `package.json` 根项目名称改为 `quant-trading-workbench`，因为它是项目元数据而不是运行时 Python 包。分享包输出示例和 manifest format 同步使用 `quant-trading-workbench`，但历史格式校验和已有消费方不在本次强制迁移范围内；如果已有代码对旧 format 有严格依赖，则保留兼容读取。

### 文档定位

根 README 的标题、开场定位、项目结构说明、快速开始和分享包示例使用 Workbench 作为主称谓。保留“Dashboard”作为具体 Web 应用和历史迁移语境中的技术称谓，避免把现有 `apps/dashboard` 路径误解为需要重命名。

新增一份 Workbench 边界文档，内容固定包括：

- Workbench 的职责：观察、探针、playbook、执行实验、事件级分析、回放和 paper agent 展示。
- `quant-research` 的职责：明确 hypothesis、OOS、成本、稳健性、跨标的验证和 alpha 生命周期。
- 日内规则策略的默认分类：`research_probe`、`intraday_playbook` 或 `execution_experiment`，不因目录中存在代码就自动宣称为 alpha strategy。
- 晋升条件：研究对象必须有可复现假设、明确验证协议、成本后结果、样本外证据、参数敏感性和跨市场/状态稳定性，之后才进入 `quant-research`。
- 生产边界：Workbench 不发送真实订单；现有 Agent 页面仍然是纸面组合实验。

架构文档和 roadmap 只做必要的名称与定位更新，不重写历史迁移记录；历史文件继续保留原项目名，并在需要时注明它们是历史记录。

### 兼容性与校验

代码改动应优先通过文档和元数据测试保护以下行为：

- 运行时包名、workspace package filter 和 workflow command 保持不变。
- `apps/dashboard`、`packages/research-core`、静态快照和部署配置路径保持不变。
- `niu_men.research_snapshot.v2` 以及现有前端 fixture 继续可读。
- 新的 Workbench 文档不包含凭据、原始行情、大型回测结果或本机绝对数据路径。

## 交付顺序

1. 在独立任务分支中提交本设计和实现计划。
2. 更新项目元数据、README、架构/上手文档和 Workbench 边界文档。
3. 增加针对 canonical identity、兼容 package name 和边界文档的自动化断言。
4. 运行前端单元测试、前端构建、相关 Python 契约测试和 foundation 检查；把基线中与本次变更无关的环境失败单独记录。
5. 提交并推送 PR；PR 合并后再执行 GitHub repository rename、remote 更新和本地 checkout 迁移。

## 回滚

代码回滚只需 revert 本次身份/文档 PR，不触及生产数据和研究快照。若 GitHub rename 已完成，GitHub 的旧仓库 URL 重定向仍作为外部迁移状态处理；本地目录迁移失败时保留旧 checkout 和新 worktree，不删除任何包含唯一未提交内容的工作树。
