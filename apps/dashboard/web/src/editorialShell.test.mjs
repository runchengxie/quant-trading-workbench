import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

test('Dashboard loads the editorial research shell after the base stylesheet', () => {
  const source = readFileSync(join(here, 'main.tsx'), 'utf8');

  assert.match(source, /import '\.\/styles\.css';\s*import '\.\/editorial\.css';/);
});

test('Workbench opens on Intel and retains existing Monitor and Agent navigation', () => {
  const source = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  assert.match(source, /useState<ViewId>\('intel'\)/);
  assert.match(source, /label: 'Intel · 每日情报'/);
  assert.match(source, /label: 'Agent · 纸面交易'/);
  assert.match(source, /label: 'Monitor · 盘前概览'/);
});
