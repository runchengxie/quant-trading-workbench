# Market State Probe 设计

## 目标

为 Quant Trading Workbench 增加一个独立的市场状态研究层，用于把滚动相对状态转化为可复核的条件事件与多周期前向结果。第一阶段只产出研究证据，不把状态直接变成交易信号，也不发送真实订单。

## 背景与边界

现有 `research-core` 能校验 contextual、conditional 和 strategy snapshot，Dashboard 能展示固定的 setup outcome，但缺少跨交易日状态变量研究的统一语义。新能力应复用现有静态快照发布边界，避免把日内 setup 事件和跨日市场状态混在 `conditional_research.v1` 中。

本阶段包含：

- 独立的 `trading_research.state_probe.v1` 研究快照契约；
- 以序列观测计算 rolling ratio、历史 percentile、z-score 和 slope；
- 条件命中、连续命中 episode、事件日与 episode-entry 两种统计；
- `1d/5d/20d/60d/120d/250d` 等可配置 horizon 的收益、胜率、median、MFE、MAE、baseline excess；
- 对 horizon 右截尾的 `eligibleCount`、`censoredCount` 和 coverage；
- 基于持有窗口的平均/峰值并发与资金占用；
- Dashboard parser/selector 与研究面板，明确展示低 coverage、样本重叠和占用风险。

本阶段不包含：

- bootstrap 置信区间、Newey-West 或 walk-forward 的完整统计推断；
- 参数网格和 heatmap UI；
- 实际行情 provider、原始行情或完整 OOS 数据提交；
- 将状态探针接入 Agent、策略执行或 paper portfolio。

## 设计

### 数据流

```text
按日期的观测序列
  -> rolling state feature
  -> condition matches
  -> event-day / episode-entry samples
  -> forward outcome surface
  -> baseline / coverage / occupancy diagnostics
  -> validated static research snapshot
  -> Dashboard state probe panel
```

### 核心模型

`research-core` 提供无副作用的纯函数，输入为带 `date`、`value`、可选 `forwardReturns`/`mfe`/`mae` 的观测记录和探针配置，输出普通 JSON-compatible mapping。所有未来结果必须只使用当前日期之后已存在且完整的 horizon 数据；缺失或超出数据尾部的结果计入 censored，不计入收益分母。

状态特征统一包含：

```json
{
  "value": 0.8225,
  "percentile": 0.11,
  "zScore": -1.42,
  "slope": -0.018,
  "state": "compressed"
}
```

统计结果统一包含：

```json
{
  "horizon": "20d",
  "sampleCount": 1106,
  "eligibleCount": 1106,
  "censoredCount": 0,
  "coverage": 1.0,
  "episodeCount": 143,
  "winRate": 0.7174,
  "meanReturn": 0.032,
  "medianReturn": 0.021,
  "baselineMeanReturn": 0.014,
  "meanExcessReturn": 0.018,
  "meanMfe": null,
  "meanMae": null,
  "averageCapitalOccupancy": 0.52,
  "peakCapitalOccupancy": 2.83
}
```

`sampleCount` 表示条件命中的事件日数量；`episodeCount` 表示条件从 false 进入 true 的独立 episode 数量。默认一个 episode 持续到条件变为 false，配置允许指定最小连续 false 天数作为结束确认。occupancy 使用每个事件在其 horizon 内占用的单位资本计算，不能隐式假设事件互斥。

### 契约与兼容性

新契约使用独立 schema version，不修改现有 `trading_research.conditional_research.v1`。快照至少包含 `schemaVersion`、`generatedAt`、`quality`、`provenance`、当前状态、探针配置、历史序列摘要和 outcome surface。校验器必须拒绝非法 horizon、非递增日期、负数计数、`eligibleCount + censoredCount != sampleCount` 以及 coverage 与计数不一致的结果。

Dashboard 对缺失或不合法快照返回 `null`/缺失状态，不渲染猜测值。当前状态表按 cohort 展示 instrument、ratio、percentile、slope 和 transition；结果面板按 horizon 展示收益和 coverage，并显式标记 censoring、episode overlap 与 capital occupancy 风险。

### 测试策略

- `research-core`：先以失败测试锁定 rolling feature、episode 去重、右截尾、baseline excess 和 occupancy 的边界行为，再实现纯函数；补契约校验测试。
- Dashboard Python/TypeScript：验证 parser 拒绝坏快照、selector 选择正确探针，以及缺失数据的可解释状态。
- 使用小型人工序列覆盖：连续命中、条件恢复、最后若干日期不足长期 horizon、未来收益为零/负数、缺失未来值和重叠持有窗口。
- 运行新增测试、相关 Python 测试、Dashboard web test/build；记录现有 workflow 基线失败，不将其归因于本功能。

## 后续扩展

在第一阶段契约稳定后，再单独设计 baseline variant/参数稳定性实验、bootstrap 与时间序列稳健标准误，以及通过验证的 state feature 到 Agent context 的增量实验。
