export type IntelSourceStatus = 'loading' | 'available' | 'missing' | 'invalid' | 'error' | 'stale';
export type IntelSourceKind = 'market' | 'context' | 'research' | 'paper-portfolio' | 'daily-note';
export type IntelDestination = 'overview' | 'workspace' | 'research' | 'agent' | 'external';

export interface MarketIntelSource {
  id: string;
  label: string;
  kind: IntelSourceKind;
  status: IntelSourceStatus;
  dataDate: string | null;
  generatedAt: string | null;
  schemaVersion: string | null;
  sourcePath: string;
  destination: IntelDestination;
  detail: string;
}

export interface MarketIntelSnapshot {
  schemaVersion: 'trading_research.market_intel_view.v1';
  dataDate: string;
  generatedAt: string;
  timingNote: string;
  sources: MarketIntelSource[];
}

export function buildMarketIntelSnapshot(
  dataDate: string,
  generatedAt: string,
  sources: readonly MarketIntelSource[],
): MarketIntelSnapshot {
  return {
    schemaVersion: 'trading_research.market_intel_view.v1',
    dataDate,
    generatedAt,
    timingNote: '各来源数据日期与生成时间可能不同，按来源分别查看。',
    sources: sources.map((source) => ({ ...source })),
  };
}
