# 文档目录

- [新人上手](getting-started.md)
- [项目结构](architecture/project-structure.md)
- [当前路线图](roadmap/README.md)
- [维护性审查](maintenance/quality-audit.md)
- [生产切换手册](operations/runtime-cutover.md)
- [行情与图表导出](capabilities/market-data-and-chart-export.md)
- [Agent 纸面组合实验](agent-paper-portfolio.md)
- [Market State Probe 设计](superpowers/specs/2026-09-14-market-state-probe-design.md)

Dashboard 和行情服务的详细技术文档分别位于 [`apps/dashboard/docs/`](../apps/dashboard/docs/) 和 [`apps/market-data-service/docs/`](../apps/market-data-service/docs/)。

跨日市场状态研究使用独立的 `trading_research.state_probe.v1` 契约；它用于研究状态与 forward outcome，不会自动升级为交易策略或订单。
