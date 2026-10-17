# Legacy Repository Retirement Record

本记录汇总两个旧仓库的冻结、调用方审计和退役执行状态。GitHub 仓库已归档；旧 Dashboard Worker 的 `workers.dev` 与预览入口均已关闭。新 authoritative Worker 仍保持启用。

## wu-t0-trading-dashboard

| Field | Status |
| --- | --- |
| Repository | `runchengxie/wu-t0-trading-dashboard` |
| Maintenance authority | `trading-research-dashboard`（README 已声明） |
| Current retirement state | `workflow-frozen / archived` |
| Last-known-good rollback SHA | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` |
| Freeze PR | [#44](https://github.com/runchengxie/wu-t0-trading-dashboard/pull/44), merged 2026-08-28; `dd24ac3da3ef45f5ad57ddbf5271b64c4ac8a0f4` |
| Production writes | scheduled/push triggers removed; manual rollback requires exact acknowledgement |
| External caller audit | GitHub code search, local cron, systemd config/loaded units, and repository self-hosted runners found no active caller; legacy Cloudflare Worker still responds HTTP 200 with `data.json` generated 2026-08-28, versus 2026-10-16 on the current Worker |
| Archive decision | archived after confirming no active caller and documenting the loss of the old manual rollback workflow |
| Archive operation | completed 2026-10-17; GitHub reports `archived=true` |
| Legacy Worker route | `workers.dev` and preview routes disabled via Cloudflare API; read-back confirms both are disabled |

## niu-men-line-strategy

| Field | Status |
| --- | --- |
| Repository | `runchengxie/niu-men-line-strategy` |
| Maintenance authority | `trading-research-dashboard/packages/niu-men-line-strategy`（README 已声明） |
| Current retirement state | `workflow-frozen / archived` |
| Last-known-good rollback SHA | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` |
| Freeze PR | [#22](https://github.com/runchengxie/niu-men-line-strategy/pull/22), merged 2026-08-28; `cbeea806239500b0aaea1d8b47f5010938bb7d86` |
| Scheduled Dashboard publication | replaced by explicit rollback-only workflow |
| Research publication cycles | no qualifying real cycles recorded here |
| External caller audit | GitHub code search and repository self-hosted runners found no caller; Workbench's stale default artifact repository was removed, and source must now be selected explicitly; no rollback-publication workflow runs or artifact producers found |
| Archive decision | archived; no GitHub code caller, rollback-publication run, local scheduled caller, or artifact producer was found; this disables its manual rollback workflow |
| Archive operation | completed 2026-10-17; GitHub reports `archived=true` |

## Gate interpretation

- README 维护声明已经完成，因此后续开发主线只有 monorepo。
- 旧仓库的 freeze workflow 已合并。Dashboard 实验的 authoritative 部署和公开数据日期核对也已完成，不要求五天观察。
- M6b 的 GitHub-visible、cron 和 systemd 运行态审计未发现实际调用方；旧 Worker 的 Workers 和预览入口已在 Cloudflare API 关闭并读回确认。关闭前的数据快照停留在 2026-08-28。
- 两个 GitHub 仓库已分别归档。归档是 GitHub 仓库设置，不是普通 Git commit；仓库内容仍保留。
