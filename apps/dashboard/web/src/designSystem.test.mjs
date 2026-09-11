import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const editorial = readFileSync(new URL('./editorial.css', import.meta.url), 'utf8');

test('Workbench exposes one semantic palette for both themes', () => {
  for (const token of ['--surface-canvas', '--surface-primary', '--text-primary', '--border-default', '--accent-primary', '--market-up', '--market-down', '--evidence-accent']) {
    assert.match(styles, new RegExp(`${token}\\s*:`));
  }
  assert.match(styles, /\[data-theme=["']dark["']\]/);
  assert.doesNotMatch(editorial, /--research-paper\\s*:/);
  assert.doesNotMatch(editorial, /--research-surface\\s*:/);
});
