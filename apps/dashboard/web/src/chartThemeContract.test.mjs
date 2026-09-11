import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const theme = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
const stock = readFileSync(new URL('./components/StockChart.tsx', import.meta.url), 'utf8');
const intraday = readFileSync(new URL('./components/IntradayChart.tsx', import.meta.url), 'utf8');
const agent = readFileSync(new URL('./components/AgentPortfolioView.tsx', import.meta.url), 'utf8');

test('all chart consumers use the theme palette contract', () => {
  assert.match(theme, /export function paletteFor/);
  assert.match(stock, /paletteFor\(theme\)/);
  assert.match(intraday, /paletteFor\(theme\)/);
  assert.match(agent, /paletteFor\(theme\)/);
  assert.doesNotMatch(agent, /#[0-9a-fA-F]{6}/);
});

test('semantic tokens and numeric typography are defined centrally', () => {
  const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
  for (const token of ['--market-up', '--market-down', '--state-warning', '--evidence-accent', '--font-mono']) {
    assert.match(styles, new RegExp(`${token}\\s*:`));
  }
  assert.match(styles, /font-variant-numeric:\s*tabular-nums/);
});
