# 运行时切换手册

[English page](runtime-cutover.md)

本页记录 M6 从旧运行时切换到 `quant-trading-workbench` 的事实、验收与回滚边界。未实际执行的门槛保留 `not-yet-run`，workflow 定义不构成生产证据。

## 当前职责与状态

Dashboard 源码、构建配置和静态 `data.json` fallback 由 monorepo 维护。手动部署及研究快照验证、发布入口可用。工作日数据生成仍使用 monorepo 的 `shadow` 流程，目标是经过验收的 `authoritative` 流程；旧 workflow 只用于回滚。实时行情服务已经合并到 `apps/market-data-service/`，生产验证仍待完成。Niu Men 发布也使用 monorepo 路径，旧入口只用于回滚。

## 固定回滚提交

下列 SHA 在 2026-08-27 准备 M6 冻结 PR 前从旧仓库读取。后续文档或冻结提交不改变这些标记。回滚时明确选择冻结前实现或另一个经过审核的冻结提交。

| 仓库 | 最后已知可用实现 SHA | 状态 |
| --- | --- | --- |
| `runchengxie/wu-t0-trading-dashboard` | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` | 冻结已合并，保留回滚镜像 |
| `runchengxie/niu-men-line-strategy` | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` | 冻结已合并，保留回滚镜像 |

## 工作流

切换前的旧 Dashboard 生产入口是 `.github/workflows/report.yml`，调度为 `0 1 * * 1-5`，当时允许正常写入。该入口现在只允许手动回滚，并要求显式确认。旧本地检出不再是正常开发依赖，远端仍保留回滚镜像。

当前 monorepo 使用：

```text
repository: runchengxie/quant-trading-workbench
workflow: .github/workflows/dashboard-report.yml
schedule: 10 1 * * 1-5
scheduled mode: shadow
manual modes: shadow | authoritative
```

`shadow` 保留审核后的 fallback，生成候选数据，验证静态快照并拒绝运行时回退，运行前端测试与构建，写入 runtime manifest，上传证据 artifact。workflow 授予 `contents: read`、`pages: write` 和 `id-token: write` 权限，以便把构建结果发布到公开的 GitHub Pages 地址 `https://runchengxie.github.io/quant-trading-workbench/`，应将其视为公开的 shadow 预览。shadow 不会推送 Git 仓库或提交原始缓存。Cloudflare authoritative 部署与 smoke 步骤在 shadow 模式下会跳过，manifest 中的 `publicUrl` 为 `null`。`authoritative` 另外要求 Cloudflare token、account 和公开 URL，部署同一候选数据并运行 smoke 检查。

`publish-research-snapshot.yml` 区分同仓与跨仓 artifact。同仓使用 `github.token`，跨仓必须配置 `RESEARCH_ARTIFACT_TOKEN`，权限仅需满足目标仓库 Actions 读取和 `actions/download-artifact`。当前真实跨仓下载证据为 `not-yet-run`，凭据名称或 workflow 定义不能证明私有跨仓访问成功。切换前应记录真实成功运行，或采用不依赖跨仓下载的 monorepo 本地发布路径。

## 切换前验收

连续 5 个交易日的定时 shadow 运行已完成，逐次核对了 workflow 步骤与 evidence artifact。候选数据和 manifest 的 `generatedAt` 日期一致，静态快照校验、运行时安全检查、前端测试与构建均通过。Cloudflare authoritative 部署步骤按 shadow 模式跳过。

| 交易日 | Workflow run | 候选 `generatedAt` 日期 | Artifact | 验证与构建 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 1 | [2026-10-09 run 37898533589](https://github.com/runchengxie/quant-trading-workbench/actions/runs/37898533589) | 2026-10-09 | `dashboard-runtime-candidate-37898533589` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 2 | [2026-10-12 run 38217075308](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38217075308) | 2026-10-12 | `dashboard-runtime-candidate-38217075308` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 3 | [2026-10-13 run 38364174737](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38364174737) | 2026-10-13 | `dashboard-runtime-candidate-38364174737` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 4 | [2026-10-14 run 38520333682](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38520333682) | 2026-10-14 | `dashboard-runtime-candidate-38520333682` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |
| 5 | [2026-10-15 run 38689167134](https://github.com/runchengxie/quant-trading-workbench/actions/runs/38689167134) | 2026-10-15 | `dashboard-runtime-candidate-38689167134` | 快照校验、测试和构建通过 | shadow 通过，已发布 GitHub Pages，Cloudflare 步骤跳过 |

以下验收仍为 `not-yet-run`，只有对应运行存在时才填写：

- 至少 2 次同日 shadow 与生产页面对照，保存 artifact、生产页面与数据日期、结果。
- 至少 3 个研究发布周期，保存 monorepo 或研究提交、发布路径和结果。其中至少 1 次必须真实发布，dry run 不能替代全部周期。

## 切换当天

当前状态为 `not-yet-run`，按以下顺序执行：

1. 从已审核、包含 shadow workflow 的 monorepo `main` 开始。
2. 手动运行 `dashboard-report.yml` 的 `authoritative` 模式。
3. 要求数据生成、安全验证、前端测试与构建、Cloudflare 部署及 smoke 全部成功。
4. 核对生产 URL 的数据日期与候选一致。
5. 合并旧 Dashboard 的冻结 PR。
6. 只有 monorepo 研究发布权威性已得到证明，才能合并旧 Niu Men 发布冻结 PR。
7. 单独通过小 PR 将定时 `SCHEDULE_MODE` 从 `shadow` 改为 `authoritative`。
8. 再次运行仓库与部署 smoke，记录提交、运行 URL 和结果。

切换提交、authoritative run、数据日期验证、旧仓库冻结合并 SHA、调度激活 PR/SHA 和切换后 smoke 均尚未记录。文档中的 Worker 地址是 `https://trading-research-dashboard.xiaowang01.workers.dev`，实际验收仍须核对运行中配置的 `CLOUDFLARE_PUBLIC_URL`。

2026-08-28 手动静态 demo 检查曾确认根页面可访问，`/data.json` 包含宝莱特与 `TSLA.US`，TSLA 有日线和分时数据。这是历史静态部署证据，不能替代正式切换或连续观察。

## 切换后观察

在 issue #19 追踪验收，要求切换后连续 5 个交易日的 authoritative 定时运行，逐日记录部署与 smoke、旧运行时无写入、结果。当前逐日记录均为 `not-yet-run`。切换后的 monorepo 研究发布和实时服务缺失时的静态 fallback 验证也均为 `not-yet-run`。

## 回滚条件与步骤

遇到以下情况应评估回滚：连续 2 个交易日运行失败且当天无法修复；候选数据为空或落后于最近审核日期；部署或 smoke 失败导致生产不可用；实时模式故障同时破坏静态 fallback；研究发布无法更新且无法安全继续展示上一有效快照。

1. 撤销调度激活 PR，使定时模式回到 `shadow`。
2. 使用旧 Dashboard 手动回滚 workflow，确认值必须为 `legacy-dashboard-rollback`。
3. 必要时检出上表固定的 Dashboard SHA。
4. 研究发布单独使用审核后的 Niu Men 回滚路径，必要时检出上表 Niu Men SHA。
5. 保留失败 artifact 与运行 URL，记录事故后再恢复 shadow 观察。

Dashboard 回滚不自动将研究发布权转回旧 Niu Men 仓库。

## M6b 退役边界

issue #19 的观察完成后，在 issue #21 追踪退役。旧本地检出已不是正常开发依赖；远端归档或只读仍是独立 GitHub 操作。旧 README 已说明维护统一到 monorepo，正常 workflow 仅作为回滚入口。这不等同于 GitHub Archive。M6b 的观察与调用方审计仍独立验收，见[退役说明](legacy-retirement.md)。
