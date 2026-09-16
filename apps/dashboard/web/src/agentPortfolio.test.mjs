import assert from 'node:assert/strict';
import test from 'node:test';

import { displayInstrument, parseAgentPortfolio } from './agentPortfolio.ts';

function validSnapshot() {
  return {
    schemaVersion: 'trading_research.agent_portfolio.v1',
    generatedAt: '2026-09-01T22:00:00Z',
    asOf: '2026-09-01',
    agent: {
      id: 'glm-daily',
      provider: 'zhipu',
      model: 'glm-4.7-flash',
      promptVersion: 'agent-paper-v1',
      inputHash: 'a'.repeat(64),
    },
    portfolio: {
      initialEquity: 100000,
      equity: 100000,
      cash: 100000,
      nav: 1,
      totalReturn: 0,
      maxDrawdown: 0,
    },
    metrics: { totalReturn: 0, maxDrawdown: 0 },
    decision: { targetWeights: { CASH: 1 }, reasoningSummary: '观望。' },
    positions: [],
    trades: [],
    history: [],
  };
}

test('loads a valid agent portfolio snapshot', () => {
  const snapshot = parseAgentPortfolio(validSnapshot());
  assert.equal(snapshot.schemaVersion, 'trading_research.agent_portfolio.v1');
  assert.equal(snapshot.portfolio.nav, 1);
});

test('rejects an unsupported agent portfolio version', () => {
  assert.throws(
    () => parseAgentPortfolio({ ...validSnapshot(), schemaVersion: 'v9' }),
    /不支持的 Agent 组合快照版本/,
  );
});

test('rejects non-finite portfolio metrics', () => {
  assert.throws(
    () => parseAgentPortfolio({ ...validSnapshot(), portfolio: { ...validSnapshot().portfolio, nav: NaN } }),
    /Agent 组合快照字段无效/,
  );
});

test('rejects malformed positions and agent metadata', () => {
  const snapshot = validSnapshot();
  snapshot.agent.inputHash = 'invalid';
  snapshot.positions = [{ symbol: 'SPY', shares: 1.5, price: 100, marketValue: 100, weight: 1 }];
  assert.throws(() => parseAgentPortfolio(snapshot), /Agent 组合快照字段无效/);
});

test('shows the Chinese name beside known A-share instruments', () => {
  assert.equal(displayInstrument('159915.SZ'), '159915.SZ · 创业板ETF');
  assert.equal(displayInstrument('510300.SH'), '510300.SH · 沪深300ETF');
  assert.equal(displayInstrument('UNKNOWN'), 'UNKNOWN');
});

test('loads a portfolio from an explicit static snapshot path', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(input, 'agent/stocks/latest.json');
    return new Response(JSON.stringify(validSnapshot()), { status: 200 });
  };
  try {
    const { loadAgentPortfolio } = await import('./agentPortfolio.ts');
    const snapshot = await loadAgentPortfolio('agent/stocks/latest.json');
    assert.equal(snapshot.portfolio.nav, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loads an agent portfolio result with a status instead of rejecting', async () => {
  const originalFetch = globalThis.fetch;
  const { loadAgentPortfolioResult } = await import('./agentPortfolio.ts');
  try {
    globalThis.fetch = async () => new Response('{}', { status: 404 });
    assert.equal((await loadAgentPortfolioResult('agent/etf/latest.json')).status, 'missing');

    globalThis.fetch = async () => new Response('<html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    assert.equal((await loadAgentPortfolioResult('agent/etf/latest.json')).status, 'missing');

    globalThis.fetch = async () => new Response(JSON.stringify({ schemaVersion: 'v9' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    assert.equal((await loadAgentPortfolioResult('agent/etf/latest.json')).status, 'invalid');

    globalThis.fetch = async () => new Response('{}', { status: 503 });
    assert.equal((await loadAgentPortfolioResult('agent/etf/latest.json')).status, 'error');

    globalThis.fetch = async () => { throw new Error('network down'); };
    assert.equal((await loadAgentPortfolioResult('agent/etf/latest.json')).status, 'error');

    globalThis.fetch = async () => new Response(JSON.stringify(validSnapshot()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const available = await loadAgentPortfolioResult('agent/etf/latest.json');
    assert.equal(available.status, 'available');
    if (available.status === 'available') assert.equal(available.snapshot.portfolio.nav, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
