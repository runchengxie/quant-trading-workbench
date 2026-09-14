import assert from 'node:assert/strict';
import test from 'node:test';

import { parseStateProbe, selectStateProbe } from './stateProbe.ts';

function validStateProbe() {
  return {
    schemaVersion: 'trading_research.state_probe.v1',
    generatedAt: '2026-01-05T00:00:00Z',
    probe: {
      id: 'liquidity',
      featureId: 'turnover_ratio',
      shortWindow: 1,
      longWindow: 2,
      thresholds: { compressed: 0.8 },
      horizons: ['1d'],
      episodeMinFalseDays: 1,
    },
    current: { date: '2026-01-05', value: 0.7, percentile: 0.1, zScore: -1, slope: -0.1, state: 'compressed', condition: true },
    events: [],
    outcomes: [{
      horizon: '1d', sampleCount: 1, eligibleCount: 1, censoredCount: 0, coverage: 1,
      episodeCount: 1, winRate: 1, meanReturn: 0.02, medianReturn: 0.02,
      baselineMeanReturn: 0.01, meanExcessReturn: 0.01, meanMfe: null, meanMae: null,
      averageCapitalOccupancy: 1, peakCapitalOccupancy: 1,
    }],
    quality: { status: 'pass', warnings: [] },
    provenance: { source: 'fixture', definitionVersion: 'state-probe.v1' },
  };
}

test('parses a valid state probe and rejects inconsistent outcome counts', () => {
  const value = validStateProbe();
  const parsed = parseStateProbe(value);
  assert.equal(parsed?.current.state, 'compressed');
  assert.equal(selectStateProbe(parsed, 'liquidity')?.probe.id, 'liquidity');
  const invalid = structuredClone(value);
  invalid.outcomes[0].eligibleCount = 2;
  assert.equal(parseStateProbe(invalid), null);
});

test('absent or unsupported state probe degrades to null', () => {
  assert.equal(parseStateProbe(undefined), null);
  assert.equal(parseStateProbe({ ...validStateProbe(), schemaVersion: 'trading_research.state_probe.v99' }), null);
});
