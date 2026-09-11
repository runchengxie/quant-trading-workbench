import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const research = readFileSync(new URL('./research.css', import.meta.url), 'utf8');
const strategy = readFileSync(new URL('./components/StrategyResearchView.tsx', import.meta.url), 'utf8');

test('research mode is a layout grammar over shared surfaces', () => {
  assert.match(strategy, /research-editorial/);
  assert.match(research, /var\(--surface-primary\)/);
  assert.match(research, /var\(--border-default\)/);
  assert.match(research, /var\(--evidence-accent\)/);
  assert.match(research, /var\(--research-heading-family\)/);
  assert.doesNotMatch(research, /--research-paper\s*:/);
  assert.doesNotMatch(research, /--research-surface\s*:/);
});
