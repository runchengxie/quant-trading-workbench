export interface StateProbeEvent {
  date: string;
  value: number | null;
  percentile: number | null;
  zScore: number | null;
  slope: number | null;
  state: string;
  condition: boolean;
}

export interface StateProbeOutcome {
  horizon: string;
  sampleCount: number;
  eligibleCount: number;
  censoredCount: number;
  coverage: number;
  episodeCount: number;
  winRate: number | null;
  meanReturn: number | null;
  medianReturn: number | null;
  baselineMeanReturn: number | null;
  meanExcessReturn: number | null;
  meanMfe: number | null;
  meanMae: number | null;
  averageCapitalOccupancy: number | null;
  peakCapitalOccupancy: number | null;
}

export interface StateProbeSnapshot {
  schemaVersion: 'trading_research.state_probe.v1';
  generatedAt: string;
  probe: {
    id: string;
    featureId: string;
    shortWindow: number;
    longWindow: number;
    thresholds: Record<string, number>;
    horizons: string[];
    episodeMinFalseDays: number;
  };
  current: StateProbeEvent;
  events: StateProbeEvent[];
  outcomes: StateProbeOutcome[];
  quality: { status: 'pass' | 'warning'; warnings: string[] };
  provenance: { source: string; definitionVersion: string };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function count(value: Record<string, unknown>, key: string): number | null {
  return nonNegativeInteger(value[key]) ? value[key] : null;
}

function validEvent(value: unknown): value is StateProbeEvent {
  if (!isObject(value)) return false;
  return (
    typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    finiteOrNull(value.value) && finiteOrNull(value.percentile) &&
    (value.percentile === null || (value.percentile >= 0 && value.percentile <= 1)) &&
    finiteOrNull(value.zScore) && finiteOrNull(value.slope) &&
    typeof value.state === 'string' && value.state.length > 0 && typeof value.condition === 'boolean'
  );
}

function validOutcome(value: unknown): value is StateProbeOutcome {
  if (!isObject(value)) return false;
  const sampleCount = count(value, 'sampleCount');
  const eligibleCount = count(value, 'eligibleCount');
  const censoredCount = count(value, 'censoredCount');
  const episodeCount = count(value, 'episodeCount');
  if (sampleCount === null || eligibleCount === null || censoredCount === null || episodeCount === null) return false;
  if (eligibleCount + censoredCount !== sampleCount) return false;
  const coverage = sampleCount === 0 ? 0 : eligibleCount / sampleCount;
  return (
    typeof value.horizon === 'string' && /^[1-9]\d*d$/.test(value.horizon) &&
    typeof value.coverage === 'number' && Number.isFinite(value.coverage) && Math.abs(value.coverage - coverage) < 1e-9 &&
    finiteOrNull(value.winRate) && finiteOrNull(value.meanReturn) && finiteOrNull(value.medianReturn) &&
    finiteOrNull(value.baselineMeanReturn) && finiteOrNull(value.meanExcessReturn) &&
    finiteOrNull(value.meanMfe) && finiteOrNull(value.meanMae) &&
    finiteOrNull(value.averageCapitalOccupancy) && finiteOrNull(value.peakCapitalOccupancy)
  );
}

export function parseStateProbe(value: unknown): StateProbeSnapshot | null {
  if (!isObject(value) || value.schemaVersion !== 'trading_research.state_probe.v1') return null;
  const probe = value.probe;
  const quality = value.quality;
  const provenance = value.provenance;
  if (!isObject(probe) || !isObject(quality) || !isObject(provenance)) return null;
  if (
    typeof value.generatedAt !== 'string' || typeof probe.id !== 'string' || typeof probe.featureId !== 'string' ||
    !Number.isInteger(probe.shortWindow) || (probe.shortWindow as number) < 1 || !Number.isInteger(probe.longWindow) || (probe.longWindow as number) < 1 ||
    !isObject(probe.thresholds) || !Array.isArray(probe.horizons) || !probe.horizons.every((item) => typeof item === 'string' && /^[1-9]\d*d$/.test(item)) ||
    !Number.isInteger(probe.episodeMinFalseDays) || (probe.episodeMinFalseDays as number) < 1 ||
    !validEvent(value.current) || !Array.isArray(value.events) || !value.events.every(validEvent) ||
    !Array.isArray(value.outcomes) || !value.outcomes.every(validOutcome) ||
    (quality.status !== 'pass' && quality.status !== 'warning') || !Array.isArray(quality.warnings) ||
    typeof provenance.source !== 'string' || typeof provenance.definitionVersion !== 'string'
  ) return null;
  const snapshot = value as unknown as StateProbeSnapshot;
  return snapshot;
}

export function selectStateProbe(snapshot: StateProbeSnapshot | null, probeId?: string): StateProbeSnapshot | null {
  if (!snapshot || (probeId && snapshot.probe.id !== probeId)) return null;
  return snapshot;
}
