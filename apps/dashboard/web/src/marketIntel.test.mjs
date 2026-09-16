import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMarketIntelSnapshot } from './marketIntel.ts';

test('builds a versioned view from sources without collapsing their dates', () => {
  const sources = [
    {
      id: 'market-state', label: '市场状态', kind: 'market', status: 'available',
      dataDate: '2026-09-15', generatedAt: '2026-09-16T07:00:00+08:00',
      schemaVersion: 'trading_research.state_probe.v1', sourcePath: 'data.json', destination: 'overview', detail: '偏弱',
    },
    {
      id: 'contextual', label: 'Contextual Research', kind: 'research', status: 'stale',
      dataDate: '2026-09-14', generatedAt: '2026-09-15T18:00:00+08:00',
      schemaVersion: 'trading_research.contextual_snapshot.v1', sourcePath: 'data.json', destination: 'workspace', detail: '研究日期较早',
    },
  ];

  const snapshot = buildMarketIntelSnapshot('2026-09-16', '2026-09-16T08:00:00+08:00', sources);

  assert.equal(snapshot.schemaVersion, 'trading_research.market_intel_view.v1');
  assert.equal(snapshot.dataDate, '2026-09-16');
  assert.equal(snapshot.generatedAt, '2026-09-16T08:00:00+08:00');
  assert.equal(snapshot.sources[0].dataDate, '2026-09-15');
  assert.equal(snapshot.sources[1].status, 'stale');
  assert.equal(snapshot.timingNote, '各来源数据日期与生成时间可能不同，按来源分别查看。');
});

test('supports a valid view with no optional sources', () => {
  const snapshot = buildMarketIntelSnapshot('2026-09-16', '2026-09-16T08:00:00+08:00', []);
  assert.deepEqual(snapshot.sources, []);
});
