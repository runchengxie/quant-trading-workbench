# Reader navigation and source explanations

The user approved the 2026-10-27 Pages audit. Keep all source data, status checks, routes and research assumptions intact.

- Use task names for main navigation and source actions. Keep the existing Chinese-only UI scope, with new presentation copy in a small catalog.
- Explain unavailable market/context analysis in plain language. Retain protocol names and paths inside labelled technical details.
- Show zoned generation timestamps in Beijing time, retain date-only values as dates and explicitly say time is not supplied. Never infer a generation time from a date.
- Wrap mobile navigation so every section is discoverable; increase source explanation and date text sizes.
- Verify date edge cases, technical details disclosure, all five mobile destinations, existing unit tests and production build. Preserve source evidence in downloads.
- Open PR, review and merge only after current-base checks. Deploy existing reviewed snapshots only; do not run research or paper trades.

部署前发现仓库示例行情日期为 2026-08-28，线上发布为 2026-10-27。界面单独发布时，`Deploy Dashboard` 可传入已成功完成的主分支运行编号 `published_run_id`，同时设置 `enable_rbreaker=false`。流程核对来源仓库、主分支和成功状态，下载该次 Pages 产物，只恢复其中 JSON 原始字节，再执行现有快照校验和界面构建。该模式禁止附加历史数据或重新生成研究结果。发布前须确认选中的运行仍是当前线上版本。

恢复程序拒绝路径越界、链接、重复文件和缺少行情数据的产物。测试覆盖旧 JSON 清理与非 JSON 文件保留，防止混用不同版本。未选择此模式时，原有发布流程继续适用。
