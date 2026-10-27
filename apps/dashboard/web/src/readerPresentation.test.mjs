import assert from 'node:assert/strict';
import test from 'node:test';

test('source times distinguish a date from a zoned timestamp', async () => {
  const { formatSourceTime } = await import('./readerPresentation.ts');
  assert.equal(formatSourceTime('2026-10-26T18:30:00-04:00'), '2026-10-27 06:30（北京时间）');
  assert.equal(formatSourceTime('2026-10-26'), '2026-10-26（未提供时刻）');
  assert.equal(formatSourceTime(null), '未提供');
  assert.equal(formatSourceTime('unknown'), 'unknown');
});
