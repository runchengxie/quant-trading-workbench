import type { StateProbeOutcome, StateProbeSnapshot } from '../stateProbe.ts';

function number(value: number | null): string {
  return value === null || Number.isNaN(value) ? '—' : value.toFixed(2);
}

function percent(value: number | null): string {
  return value === null || Number.isNaN(value) ? '—' : `${(value * 100).toFixed(1)}%`;
}

function returnValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

function outcomeWarning(outcome: StateProbeOutcome): boolean {
  return outcome.coverage < 0.8 || outcome.censoredCount > 0 || (outcome.peakCapitalOccupancy ?? 0) > 1;
}

export default function StateProbePanel({ snapshot }: { snapshot: StateProbeSnapshot }) {
  const warning = snapshot.quality.status === 'warning' || snapshot.outcomes.some(outcomeWarning);
  return (
    <section className="research-card state-probe-panel" aria-labelledby="state-probe-title">
      <div className="research-card-head">
        <div>
          <p className="research-kicker">市场状态探针</p>
          <h3 id="state-probe-title">当前状态与 Forward Outcome</h3>
          <p>{snapshot.probe.featureId} · {snapshot.probe.shortWindow}d / {snapshot.probe.longWindow}d</p>
        </div>
        <span className={`research-status-group${warning ? ' warning' : ''}`}>
          {warning ? '存在研究警告' : '研究数据正常'}
        </span>
      </div>

      <div className="research-kpi-grid">
        <div className="research-kpi"><span>当前状态</span><strong>{snapshot.current.state}</strong><small>{number(snapshot.current.value)}</small></div>
        <div className="research-kpi"><span>历史百分位</span><strong>{percent(snapshot.current.percentile)}</strong><small>z-score {number(snapshot.current.zScore)}</small></div>
        <div className="research-kpi"><span>状态斜率</span><strong>{number(snapshot.current.slope)}</strong><small>{snapshot.current.condition ? '条件命中' : '条件未命中'}</small></div>
        <div className="research-kpi"><span>事件 / episode</span><strong>{snapshot.events.filter((event) => event.condition).length}</strong><small>episode 由后端统计</small></div>
      </div>

      <div className="research-table-wrap">
        <table className="research-table">
          <thead><tr><th>Horizon</th><th>样本</th><th>可用 / 截尾</th><th>覆盖率</th><th>胜率</th><th>平均收益</th><th>超额</th><th>资金占用</th></tr></thead>
          <tbody>
            {snapshot.outcomes.map((outcome) => (
              <tr key={outcome.horizon}>
                <td>{outcome.horizon}</td>
                <td>{outcome.sampleCount} / {outcome.episodeCount}</td>
                <td>{outcome.eligibleCount} / {outcome.censoredCount}</td>
                <td>{percent(outcome.coverage)}</td>
                <td>{percent(outcome.winRate)}</td>
                <td>{returnValue(outcome.meanReturn)}</td>
                <td>{returnValue(outcome.meanExcessReturn)}</td>
                <td>{number(outcome.averageCapitalOccupancy)} / {number(outcome.peakCapitalOccupancy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="research-subtitle">每行“样本 / episode”分别表示事件日命中数与独立状态段；“资金占用”显示平均 / 峰值，不能将重叠命中视为独立机会。</p>
    </section>
  );
}
