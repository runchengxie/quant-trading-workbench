import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const agent = readFileSync(new URL('./components/AgentPortfolioView.tsx', import.meta.url), 'utf8');

test('Workbench shell exposes persistent research context', () => {
  assert.match(app, /className="workbench-context"/);
  assert.match(app, /当前工作上下文/);
  assert.match(app, /data\.generatedAt/);
  assert.match(app, /serviceStatusLabel/);
});

test('operational surfaces consume shared semantic tokens', () => {
  assert.match(styles, /\.workbench-context/);
  assert.match(styles, /var\(--surface-(canvas|primary|secondary)/);
  assert.match(styles, /var\(--border-default\)/);
  assert.match(agent, /paletteFor\(theme\)/);
  assert.doesNotMatch(agent, /lineStyle: \{ color: ['"]#1267d6/);
});
