import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('./editorial.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const button = readFileSync(new URL('./components/ui/button.tsx', import.meta.url), 'utf8');

test('quiet workstation removes SaaS decoration and legacy dashboard identity', () => {
  assert.match(styles, /--accent-primary:\s*#365f78/i);
  assert.match(styles, /--radius-control:\s*5px/);
  assert.match(styles, /--shadow:\s*none/);
  assert.doesNotMatch(styles, /#1890ff|#40a9ff/);
  assert.doesNotMatch(editorial, /background-image:\s*linear-gradient/);
  assert.doesNotMatch(app, /TRADING DASHBOARD|Trading Dashboard/);
  assert.match(app, /QUANT TRADING WORKBENCH/);
  assert.match(app, /Monitor · 盘前概览/);
  assert.match(app, /Workspace · 日内工作台/);
  assert.match(app, /Research · 策略研究/);
  assert.match(app, /Agent · 纸面交易/);
  assert.match(index, /<title>Quant Trading Workbench<\/title>/);
  assert.doesNotMatch(button, /bg-blue-|ring-blue-|slate-300/);
});

test('market palette keeps brand and market semantics separate', () => {
  const theme = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
  assert.match(theme, /paletteFor\(mode: ThemeMode, market\?: Market\)/);
  assert.match(theme, /market === 'CN'/);
  assert.match(theme, /market\?: Market/);
  assert.match(styles, /--semantic-positive:/);
  assert.match(styles, /--semantic-negative:/);
});
