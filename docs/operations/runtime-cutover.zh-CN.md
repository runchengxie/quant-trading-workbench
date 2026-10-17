# 运行时切换手册

[English page](runtime-cutover.md)

本页记录 Dashboard 快照实验迁移到 `quant-trading-workbench` 的事实、验收与回滚边界。Dashboard 是实验界面，不构成投资建议。workflow 定义本身不等于部署证据。

## 当前职责与状态

Dashboard 源码、构建配置和静态 `data.json` fallback 由 monorepo 维护。`Dashboard runtime report` 的工作日定时模式是 `authoritative`，负责更新 Cloudflare Worker 和 GitHub Pages。这个封闭实验不要求连续五天观察。旧仓库已归档，旧 workflow 不再是可用的回滚入口；实时行情服务的生产验收仍是独立事项，不是静态快照实验的前置条件。Niu Men 发布也由 monorepo 维护。

## 固定回滚提交

下列 SHA 在 2026-08-27 准备 M6 冻结 PR 前从旧仓库读取。后续文档或冻结提交不改变这些标记。回滚时明确选择冻结前实现或另一个经过审核的冻结提交。

| 仓库 | 最后已知可用实现 SHA | 状态 |
| --- | --- | --- |
| `runchengxie/wu-t0-trading-dashboard` | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` | 已冻结并归档；SHA 仅用于历史追溯 |
| `runchengxie/niu-men-line-strategy` | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` | 已冻结并归档；SHA 仅用于历史追溯 |

## 工作流

切换前的旧 Dashboard 生产入口是 `.github/workflows/report.yml`，调度为 `0 1 * * 1-5`，当时允许正常写入。旧仓库现在已归档，历史手动回滚 workflow 无法触发，旧 Worker 入口也已关闭。上述 SHA 只用于追溯，不是当前部署方式。

当前 monorepo 使用：

```text
repository: runchengxie/quant-trading-workbench
workflow: .github/workflows/dashboard-report.yml
schedule: 10 1 * * 1-5
scheduled mode: authoritative
manual modes: shadow | authoritative
```

`shadow` 保留审核后的 fallback，生成候选数据，验证静态快照并拒绝运行时回退，运行前端测试与构建，写入 runtime manifest，并上传本次运行的 Actions evidence artifact；GitHub Pages 和 Cloudflare 发布步骤都会跳过。GitHub Pages artifact 上传与部署仅在 `authoritative` 模式运行。PR #38 之前的 shadow 运行曾发布到公开地址 `https://runchengxie.github.io/quant-trading-workbench/`；修复不会删除或更改现有 Pages 站点。shadow 不会推送 Git 仓库或提交原始缓存，manifest 中的 `publicUrl` 为 `null`。`authoritative` 仍要求 Cloudflare token、account 和公开 URL，部署同一候选数据并运行 smoke 检查。

研究快照发布 workflow 区分同仓与跨仓 artifact。跨仓认证和研究发布有各自的验收，不是 Dashboard 快照实验切换的门槛。

## 切换前验收

目前有六次定时 shadow 成功完成候选生成、快照校验、运行时安全检查、前端测试与构建，并上传了 evidence artifact。这些是有用的预检证据，不要求连续观察五天。10 月 16 日及之前的运行使用 PR #38 合并前的 workflow，因此 shadow 也发布了 GitHub Pages。PR #38 已限制后续 shadow 发布 Pages，但没有删除现有页面。以下 shadow 运行均跳过 Cloudflare 部署。

| 交易日 | Workflow run | 候选 `generatedAt` 日期 | Artifact | 验证与构建 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 1 | [2026-10-09 run 37898533589](https://github.com/runchengxie/quant-trading-workbench/actions/runs/37898533589) | 2026-10-09 | `dashboard-runtime-candidate-37898533589` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 2 | [2026-10-12 run 38217075308](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38217075308) | 2026-10-12 | `dashboard-runtime-candidate-38217075308` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 3 | [2026-10-13 run 38364174737](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38364174737) | 2026-10-13 | `dashboard-runtime-candidate-38364174737` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 4 | [2026-10-14 run 38520333682](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38520333682) | 2026-10-14 | `dashboard-runtime-candidate-38520333682` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 5 | [2026-10-15 run 38689167134](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38689167134) | 2026-10-15 | `dashboard-runtime-candidate-38689167134` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 6 | [2026-10-16 run 38857741547](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38857741547) | 2026-10-16（Pages 已核对） | `dashboard-runtime-candidate-38857741547` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |

10 月 16 日运行使用提交 `aa1595077a1978a65fb6aa2cd77a5e4c47abd330`，早于 PR #38 于 `4d596af1adb3ec2a3a7e4c4699cfa611200986cf` 合并。该次 Pages 发布不能证明 Cloudflare authoritative 部署成功。检查时 Pages 的 `/data.json` 返回 `generatedAt: 2026-10-16`。

## 切换当天

一次性 authoritative 切换已由运行 [#38917305897](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38917305897) 完成，使用提交 `601819b9c574010da62ec626b427f230734a13c0`。候选校验、前端测试与构建、GitHub Pages 部署、Cloudflare 部署和部署 smoke 均通过。两个公开 `/data.json` 端点都返回 HTTP 200、非空股票快照及 `generatedAt: 2026-10-16`。这个封闭实验不要求观察五天。

本 PR 将定时 `SCHEDULE_MODE` 从 `shadow` 改为 `authoritative`。第一次定时运行作为运行检查，不再是切换门槛。

切换提交：`601819b9c574010da62ec626b427f230734a13c0`；authoritative run、公开数据日期和部署 smoke 均已记录。Pages 和 Worker 的 `/data.json` 均返回 `generatedAt: 2026-10-16`、HTTP 200 和非空快照。调度激活 PR #41 的 merge SHA 为 `5d4bfe65c85cb661a865852ce203b523bc0dcc7a`。旧仓库冻结 PR 已分别合并：Dashboard #44，merge SHA `dd24ac3da3ef45f5ad57ddbf5271b64c4ac8a0f4`；Niu Men #22，merge SHA `cbeea806239500b0aaea1d8b47f5010938bb7d86`。

2026-08-28 手动静态 demo 检查曾确认根页面可访问，`/data.json` 包含宝莱特与 `TSLA.US`，TSLA 有日线和分时数据。这是历史静态部署证据，不能替代正式切换或连续观察。

## 切换后

本实验不要求连续观察五个交易日。截至 2026-10-17，最近一次成功 authoritative 部署是手动运行 [#38917305897](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38917305897)，部署 smoke 通过，服务的非空数据日期为 2026-10-16。10 月 17 日是周六，当天不应有工作日行情运行；下一次定时运行是 10 月 19 日周一。当前审计环境的网络代理阻止了对公开地址的直连，因此最新直接响应证据仍是 10 月 16 日部署 smoke。研究发布和实时行情服务的验收是独立事项。

## 回滚条件与步骤

遇到以下情况应评估回滚：连续 2 个交易日运行失败且当天无法修复；候选数据为空或落后于最近审核日期；部署或 smoke 失败导致生产不可用；实时模式故障同时破坏静态 fallback；研究发布无法更新且无法安全继续展示上一有效快照。

1. 撤销调度激活 PR #41，停止后续生产发布并让定时运行回到 `shadow`。
2. 如果最新 Cloudflare Worker 部署导致回归，在 monorepo 根目录运行 `pnpm dlx wrangler@4 rollback --config apps/dashboard/wrangler.jsonc`，确认 Wrangler 选择的上一版本后再执行。该命令会用旧 Worker 版本创建新的部署，详见 [Cloudflare Wrangler rollback](https://developers.cloudflare.com/workers/wrangler/commands/workers/#rollback)。
3. 用 `apps/dashboard/scripts/check_deployment.py` 验证恢复后的 Worker，并检查保留的运行 artifact。如果上一版本不是所需快照，应通过 monorepo PR 恢复审核过的静态快照，再按 monorepo workflow 发布。
4. 研究快照单独回滚：通过 monorepo PR 恢复之前审核过的 `apps/dashboard/web/public/research.json`，再校验并部署。
5. 保留失败 artifact 与运行 URL，记录事故后再继续实验。

已归档的旧仓库和它们的手动 workflow 不属于当前回滚路径。Dashboard runtime 回滚不会改变研究快照的维护权。

## M6b 退役边界

此前引用的 #19 和 #21 实际是 PR，不是 M6/M6b 跟踪 issue（#19 已关闭，#21 已合并）。M6 runtime cutover 和 M6b 退役均已完成：两个旧仓库已归档，旧 Dashboard Worker 入口已关闭，GitHub、本机 cron、systemd 和仓库 self-hosted runner 调用方审计均未发现活跃调用。旧 GitHub Pages 页面按用户选择继续公开。详见[退役说明](legacy-retirement.md)。
