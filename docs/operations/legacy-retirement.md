# Legacy Repository Retirement Record

本记录区分“生产 workflow 已冻结”和“外部调用方审计、GitHub archive 已完成”。后两项仍需真实证据；本地代码变更不会替代这些证据。

## wu-t0-trading-dashboard

| Field | Status |
| --- | --- |
| Repository | `runchengxie/wu-t0-trading-dashboard` |
| Maintenance authority | `trading-research-dashboard`（README 已声明） |
| Current retirement state | `workflow-frozen / archive-pending` |
| Last-known-good rollback SHA | `e03617a6d6922e2b3fec66a96f1ae3b51f66c38e` |
| Freeze PR | [#44](https://github.com/runchengxie/wu-t0-trading-dashboard/pull/44), merged 2026-08-28; `dd24ac3da3ef45f5ad57ddbf5271b64c4ac8a0f4` |
| Production writes | scheduled/push triggers removed; manual rollback requires exact acknowledgement |
| External caller audit | not-yet-run |
| Archive operation | not-yet-run |

## niu-men-line-strategy

| Field | Status |
| --- | --- |
| Repository | `runchengxie/niu-men-line-strategy` |
| Maintenance authority | `trading-research-dashboard/packages/niu-men-line-strategy`（README 已声明） |
| Current retirement state | `workflow-frozen / archive-pending` |
| Last-known-good rollback SHA | `1be7f725772fa824ce34e2bb833867cb4c3e9fcb` |
| Freeze PR | [#22](https://github.com/runchengxie/niu-men-line-strategy/pull/22), merged 2026-08-28; `cbeea806239500b0aaea1d8b47f5010938bb7d86` |
| Scheduled Dashboard publication | replaced by explicit rollback-only workflow |
| Research publication cycles | no qualifying real cycles recorded here |
| External caller audit | not-yet-run |
| Archive operation | not-yet-run |

## Gate interpretation

- README 维护声明已经完成，因此后续开发主线只有 monorepo。
- 旧仓库的 freeze workflow 已合并。Dashboard 实验仍需一次成功的 authoritative 部署和公开数据日期核对，不要求五天观察。
- M6b 还需逐仓库完成 GitHub-visible、cron/systemd/Hermes/self-hosted runner、Cloudflare 和本地自动化调用方审计。
- 本仓库不删除旧仓库、不提交旧仓库凭据，也不把 archive 当作普通 Git commit。
