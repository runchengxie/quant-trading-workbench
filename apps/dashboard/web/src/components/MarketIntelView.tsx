import { useEffect, useMemo, useState } from 'react';
import type { DashboardData } from '../types.ts';
import type { ContextualResearchSnapshot } from '../contextualResearch.ts';
import type { StateProbeSnapshot } from '../stateProbe.ts';
import type { StrategyLoadResult } from '../api.ts';
import {
  loadAgentPortfolioResult,
  type AgentPortfolioLoadResult,
} from '../agentPortfolio.ts';
import {
  buildMarketIntelSnapshot,
  type IntelSourceStatus,
  type MarketIntelSource,
} from '../marketIntel.ts';
import {
  loadMarketIntelDailyNote,
  MARKET_INTEL_PAGES_BASE_URL,
  type MarketIntelDailyNoteResult,
} from '../marketIntelDailyNote.ts';

type Destination = 'overview' | 'workspace' | 'research' | 'agent';

interface MarketIntelViewProps {
  dashboard: DashboardData;
  contextualResearch: ContextualResearchSnapshot | null;
  stateProbe: StateProbeSnapshot | null;
  strategyResults: StrategyLoadResult[];
  strategiesLoaded: boolean;
  onNavigate: (view: Destination) => void;
}

interface PortfolioDefinition {
  id: 'agent-etf' | 'agent-stocks';
  label: string;
  path: string;
}

const PORTFOLIOS: PortfolioDefinition[] = [
  { id: 'agent-etf', label: 'ETF 配置组合', path: 'agent/etf/latest.json' },
  { id: 'agent-stocks', label: '个股选股组合', path: 'agent/stocks/latest.json' },
];

const STATUS_LABEL: Record<IntelSourceStatus, string> = {
  loading: '加载中',
  available: '可用',
  missing: '暂无快照',
  invalid: '快照格式无效',
  error: '加载失败',
  stale: '研究快照较旧',
};

function dashboardSource(dashboard: DashboardData): MarketIntelSource {
  return {
    id: 'market-data',
    label: '行情快照',
    kind: 'market',
    status: 'available',
    dataDate: dashboard.generatedAt,
    generatedAt: dashboard.generatedAt,
    schemaVersion: null,
    sourcePath: 'data.json',
    destination: 'overview',
    detail: `当前快照包含 ${dashboard.stocks.length} 个标的。`,
  };
}

function marketSource(dashboard: DashboardData, stateProbe: StateProbeSnapshot | null): MarketIntelSource {
  const rawStateProbe = dashboard.stateProbe;
  const status: IntelSourceStatus = stateProbe
    ? 'available'
    : rawStateProbe === undefined || rawStateProbe === null ? 'missing' : 'invalid';
  const stateText = stateProbe
    ? `当前状态：${stateProbe.current.state} · 条件${stateProbe.current.condition ? '命中' : '未命中'}`
    : status === 'missing' ? '当前没有已发布的 market state probe。' : 'market state probe 无法通过校验。';
  return {
    id: 'market-state',
    label: '市场状态',
    kind: 'market',
    status,
    dataDate: stateProbe?.current.date ?? null,
    generatedAt: stateProbe?.generatedAt ?? null,
    schemaVersion: stateProbe?.schemaVersion ?? null,
    sourcePath: 'data.json',
    destination: 'overview',
    detail: stateText,
  };
}

function contextualSource(snapshot: ContextualResearchSnapshot | null, raw: unknown): MarketIntelSource {
  const status: IntelSourceStatus = snapshot ? 'available' : raw === undefined || raw === null ? 'missing' : 'invalid';
  return {
    id: 'contextual-research',
    label: 'Contextual Research',
    kind: 'context',
    status,
    dataDate: snapshot?.dataDate ?? null,
    generatedAt: snapshot?.generatedAt ?? null,
    schemaVersion: snapshot?.schemaVersion ?? null,
    sourcePath: 'data.json',
    destination: 'workspace',
    detail: snapshot
      ? `${snapshot.coverage.evaluated}/${snapshot.coverage.requested} 个输入已评估 · ${snapshot.quality.status === 'pass' ? '质量检查通过' : '存在质量提示'}`
      : status === 'missing' ? '当前快照不包含 contextual research。' : 'Contextual Research 无法通过校验。',
  };
}

function strategySource(result: StrategyLoadResult): MarketIntelSource {
  const snapshot = result.snapshot;
  let status: IntelSourceStatus = result.status === 'available' ? 'available' : result.status;
  if (snapshot?.freshness === 'stale') status = 'stale';
  return {
    id: `strategy-${result.definition.id}`,
    label: result.definition.label,
    kind: 'research',
    status,
    dataDate: snapshot?.dataDate ?? null,
    generatedAt: snapshot?.generatedAt ?? null,
    schemaVersion: snapshot?.schemaVersion ?? null,
    sourcePath: result.definition.snapshotPath.replace(/^\.\//, ''),
    destination: 'research',
    detail: snapshot
      ? `${snapshot.freshness === 'current' ? '日期与行情同步' : snapshot.freshness === 'stale' ? '数据日期较旧' : '新鲜度未知'} · ${snapshot.quality === 'pass' ? '质量检查通过' : '存在质量提示'} · 覆盖 ${snapshot.coverage.evaluated}/${snapshot.coverage.requested}`
      : result.status === 'missing' ? '本次部署尚无该策略的研究快照。' : '研究快照加载或校验失败。',
  };
}

function portfolioSource(definition: PortfolioDefinition, result: AgentPortfolioLoadResult | null): MarketIntelSource {
  const snapshot = result?.status === 'available' ? result.snapshot : null;
  const detail = snapshot
    ? `${snapshot.positions.length} 个持仓 · 纸面组合累计收益 ${(snapshot.portfolio.totalReturn * 100).toFixed(2)}% · NAV ${snapshot.portfolio.nav.toFixed(4)}`
    : result?.status === 'missing' ? '当前没有已发布的纸面组合快照。'
      : result?.status === 'invalid' ? '组合快照格式无效。'
        : result?.status === 'error' ? '组合快照加载失败。' : '组合快照加载中。';
  return {
    id: definition.id,
    label: definition.label,
    kind: 'paper-portfolio',
    status: result?.status ?? 'loading',
    dataDate: snapshot?.asOf ?? null,
    generatedAt: snapshot?.generatedAt ?? null,
    schemaVersion: snapshot?.schemaVersion ?? null,
    sourcePath: definition.path,
    destination: 'agent',
    detail,
  };
}

function dailyNoteSource(result: MarketIntelDailyNoteResult): MarketIntelSource {
  const note = result.status === 'available' ? result.note : null;
  const detail = note ? note.text
    : result.status === 'missing' ? '暂无可用每日短评。'
      : result.status === 'invalid' ? '短评或来源报告无法通过校验。'
        : result.status === 'error' ? '每日短评服务暂不可用。'
          : '正在读取 market-intel-pages 短评。';
  return {
    id: 'daily-note',
    label: '每日资讯短评',
    kind: 'daily-note',
    status: result.status,
    dataDate: note?.date ?? null,
    generatedAt: note?.generatedAt ?? null,
    schemaVersion: note ? 'market_intel_pages.daily_summaries.v1' : null,
    sourcePath: 'market-intel-pages/data/daily_summaries.json',
    destination: 'external',
    detail,
  };
}

function dateText(value: string | null): string {
  return value ? value.replace('T', ' ') : '—';
}

function SourceStatus({ status }: { status: IntelSourceStatus }) {
  return <span className={`market-intel-status market-intel-status-${status}`}>{STATUS_LABEL[status]}</span>;
}

function SourceCard({ source, onNavigate }: {
  source: MarketIntelSource;
  onNavigate: (view: Destination) => void;
}) {
  const action = source.destination === 'external' ? null : {
    overview: '查看 Monitor',
    workspace: '查看 Workspace',
    research: '查看 Research',
    agent: '查看 Agent',
  }[source.destination];
  return (
    <article className="market-intel-source" data-source-id={source.id}>
      <div className="market-intel-source-heading">
        <h3>{source.label}</h3>
        <SourceStatus status={source.status} />
      </div>
      <p className="market-intel-source-detail">{source.detail}</p>
      <dl className="market-intel-source-meta">
        <div><dt>数据日期</dt><dd>{dateText(source.dataDate)}</dd></div>
        <div><dt>生成时间</dt><dd>{dateText(source.generatedAt)}</dd></div>
      </dl>
      {source.schemaVersion && <code className="market-intel-schema">{source.schemaVersion}</code>}
      <code className="market-intel-path">{source.sourcePath}</code>
      {action && (
        <button type="button" className="market-intel-link" onClick={() => onNavigate(source.destination as Destination)}>
          {action} →
        </button>
      )}
    </article>
  );
}

export default function MarketIntelView({
  dashboard,
  contextualResearch,
  stateProbe,
  strategyResults,
  strategiesLoaded,
  onNavigate,
}: MarketIntelViewProps) {
  const [portfolioResults, setPortfolioResults] = useState<Record<string, AgentPortfolioLoadResult | null>>({});
  const [dailyNoteResult, setDailyNoteResult] = useState<MarketIntelDailyNoteResult>({ status: 'loading' });
  const [viewCreatedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    let active = true;
    Promise.all(PORTFOLIOS.map(async (definition) => (
      [definition.id, await loadAgentPortfolioResult(definition.path)] as const
    ))).then((results) => {
      if (active) setPortfolioResults(Object.fromEntries(results));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    loadMarketIntelDailyNote().then((result) => {
      if (active) setDailyNoteResult(result);
    });
    return () => { active = false; };
  }, []);

  const view = useMemo(() => {
    const sources = [
      dashboardSource(dashboard),
      marketSource(dashboard, stateProbe),
      contextualSource(contextualResearch, dashboard.contextualResearch),
      ...strategyResults.map(strategySource),
      ...(!strategiesLoaded ? [{
        id: 'strategy-loading', label: '策略研究快照', kind: 'research' as const,
        status: 'loading' as const, dataDate: null, generatedAt: null, schemaVersion: null,
        sourcePath: 'research snapshots', destination: 'research' as const, detail: '策略研究快照加载中。',
      }] : []),
      ...PORTFOLIOS.map((definition) => portfolioSource(definition, portfolioResults[definition.id] ?? null)),
      dailyNoteSource(dailyNoteResult),
    ];
    return buildMarketIntelSnapshot(dashboard.generatedAt, viewCreatedAt, sources);
  }, [contextualResearch, dailyNoteResult, dashboard, portfolioResults, stateProbe, strategiesLoaded, strategyResults, viewCreatedAt]);

  const marketAndContext = view.sources.filter((source) => source.kind === 'market' || source.kind === 'context');
  const strategies = view.sources.filter((source) => source.kind === 'research');
  const portfolios = view.sources.filter((source) => source.kind === 'paper-portfolio');
  const dailyNote = view.sources.find((source) => source.kind === 'daily-note')!;

  return (
    <section className="market-intel-view" aria-labelledby="market-intel-title">
      <header className="market-intel-header">
        <div>
          <p className="section-kicker">DAILY INTELLIGENCE</p>
          <h2 id="market-intel-title">今日市场情报</h2>
          <p className="section-subtitle">将当前市场状态、研究证据和纸面组合放在同一处检查。</p>
        </div>
        <span className="market-intel-asof">数据日期 <b>{view.dataDate}</b></span>
      </header>

      <p className="market-intel-timing-note" role="note">{view.timingNote}</p>

      <div className="market-intel-grid">
        <section className="market-intel-group" aria-labelledby="market-intel-state-title">
          <div className="market-intel-group-heading"><p className="section-kicker">OBSERVE</p><h2 id="market-intel-state-title">市场状态</h2></div>
          <div className="market-intel-source-grid">{marketAndContext.map((source) => <SourceCard key={source.id} source={source} onNavigate={onNavigate} />)}</div>
        </section>

        <section className="market-intel-group" aria-labelledby="market-intel-research-title">
          <div className="market-intel-group-heading"><p className="section-kicker">RESEARCH</p><h2 id="market-intel-research-title">研究快照</h2></div>
          <div className="market-intel-source-grid">{strategies.map((source) => <SourceCard key={source.id} source={source} onNavigate={onNavigate} />)}</div>
        </section>

        <section className="market-intel-group" aria-labelledby="market-intel-agent-title">
          <div className="market-intel-group-heading"><p className="section-kicker">PAPER ONLY</p><h2 id="market-intel-agent-title">Agent 纸面组合</h2></div>
          <div className="market-intel-source-grid">{portfolios.map((source) => <SourceCard key={source.id} source={source} onNavigate={onNavigate} />)}</div>
        </section>

        <section className="market-intel-group market-intel-daily-note" aria-labelledby="market-intel-note-title">
          <div className="market-intel-group-heading"><p className="section-kicker">DAILY NOTE</p><h2 id="market-intel-note-title">每日短评</h2></div>
          <article className="market-intel-source" data-source-id={dailyNote.id}>
            <div className="market-intel-source-heading">
              <h3>{dailyNote.label}</h3>
              <SourceStatus status={dailyNote.status} />
            </div>
            <p className="market-intel-source-detail market-intel-note-text">{dailyNote.detail}</p>
            <dl className="market-intel-source-meta">
              <div><dt>短评日期</dt><dd>{dateText(dailyNote.dataDate)}</dd></div>
              <div><dt>生成时间</dt><dd>{dateText(dailyNote.generatedAt)}</dd></div>
            </dl>
            {dailyNoteResult.status === 'available' && (
              <>
                <p className="market-intel-note-sources">
                  基于晨报 <code>{dailyNoteResult.note.morningReportId}</code> 和前一晚晚报 <code>{dailyNoteResult.note.eveningReportId}</code>
                </p>
                <a className="market-intel-link" href={`${MARKET_INTEL_PAGES_BASE_URL}/`} target="_blank" rel="noreferrer">
                  打开 Market Intel 原始资讯 →
                </a>
              </>
            )}
            <code className="market-intel-path">{dailyNote.sourcePath}</code>
          </article>
        </section>
      </div>

      <nav className="market-intel-actions" aria-label="查看 Workbench 分区">
        <button type="button" onClick={() => onNavigate('overview')}>查看 Monitor</button>
        <button type="button" onClick={() => onNavigate('workspace')}>查看 Workspace</button>
        <button type="button" onClick={() => onNavigate('research')}>查看 Research</button>
        <button type="button" onClick={() => onNavigate('agent')}>查看 Agent</button>
      </nav>
    </section>
  );
}
