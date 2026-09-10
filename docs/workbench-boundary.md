# Workbench 边界

`quant-trading-workbench` 是 quant 系列中的交互式研究与交易工作台。它的价值不在于把仓库里的每条规则都包装成策略，而在于让研究者从市场现象出发，观察事件、切分样本、回放个例，并判断一个现象是否值得进入更严格的研究流程。

## Workbench 负责什么

Workbench 负责以下类型的工作：

- 市场观察：查看行情、指标、状态、事件和跨标的上下文。
- `research_probe`：用低门槛规则探测某个市场行为是否存在条件差异。
- `intraday_playbook`：把可重复的盘中 setup、触发条件、风险边界和复盘记录组织起来。
- `execution_experiment`：研究成交、滑点、点差、持仓时间、MAE/MFE 和执行约束。
- 交互式 drilldown：从市场或 cohort 进入事件、标的、历史序列和研究快照。
- paper-agent review：展示纸面实验的决策、持仓、成交和净值，不连接券商。

这里的规则是研究工具和观察入口。目录里存在一段规则代码，不等于它已经是可晋升的 alpha strategy。

## 与 `quant-research` 的边界

`quant-research` 负责更严格的 alpha research lifecycle：明确 hypothesis、实验设计、样本外验证、成本建模、稳健性分析、策略比较、证据归档和生命周期管理。

Workbench 可以消费 `quant-research` 已发布的研究快照，也可以为它提供事件和候选假设；但 Workbench 不替代 canonical strategy validation，也不因为一个 setup 在单个市场或单段时间内表现良好就宣称它有 alpha。

## 日内研究对象的默认分类

日内对象默认按研究目的分类：

| 分类 | 主要问题 | 典型输出 |
| --- | --- | --- |
| `research_probe` | 这个现象在什么条件下出现，后续行为是否不同？ | 事件样本、条件统计、分布和回放 |
| `intraday_playbook` | 交易者如何识别 setup、定义入场和风险边界？ | 触发规则、观察清单、MAE/MFE、复盘记录 |
| `execution_experiment` | 执行条件如何影响成交和结果？ | 成本敏感性、滑点、点差、成交概率和 break-even |

只有研究对象的证据标准已经满足时，才应在 `quant-research` 中作为 research candidate 管理。

## 从 probe 晋升为 alpha candidate

晋升前至少需要具备：

1. 可复现的假设和明确的入场、退出、样本定义。
2. 可审查的验证协议，包含训练/验证/样本外边界和避免前视的规则。
3. 手续费、点差、滑点和合理成交约束下的成本后结果。
4. 足够的样本外证据，而不是只依赖单一时期或单一标的。
5. 参数扰动、替代定义和阈值敏感性分析。
6. 跨标的、市场状态或交易阶段的稳定性检查，并记录失败条件。

这套门槛不是要求每个 Workbench probe 都必须变成 alpha，而是防止把探索性数字误写成策略结论。

## 运行与生产边界

Workbench 的 Agent 页面只展示纸面组合实验；Workbench 不发送真实订单，也不保存券商凭据。原始行情、完整 OOS 产物和运行凭据继续放在仓库外。现有 `apps/dashboard/`、Python distribution、workflow 和 `niu_men.research_snapshot.v2` 契约保持稳定，产品改名不改变这些技术边界。
