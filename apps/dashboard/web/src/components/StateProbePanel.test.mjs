import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('state probe panel exposes coverage and occupancy warnings', async () => {
  const source = await readFile(new URL('./StateProbePanel.tsx', import.meta.url), 'utf8');
  assert.match(source, /censoredCount/);
  assert.match(source, /peakCapitalOccupancy/);
  assert.match(source, /当前状态/);
});
