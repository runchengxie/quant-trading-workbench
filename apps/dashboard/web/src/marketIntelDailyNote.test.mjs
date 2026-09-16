import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadMarketIntelDailyNote,
  parseMarketIntelDailyNote,
} from './marketIntelDailyNote.ts';

const reports = {
  schema_version: 'market_intel_pages.reports.v1',
  reports: [
    { id: '2026-09-14-evening', date: '2026-09-14', kind: 'evening', sections: [{ paragraphs: ['生成时间: 2026-09-14 19:08'] }] },
    { id: '2026-09-14-morning', date: '2026-09-14', kind: 'morning', sections: [{ paragraphs: ['生成时间: 2026-09-15 07:03'] }] },
  ],
};

const summaries = {
  schema_version: 'market_intel_pages.daily_summaries.v1',
  summaries: [{
    date: '2026-09-14',
    text: '存储撑住了，半导体隔夜偏弱，盘中反弹没能延续。',
    morning_report_id: '2026-09-14-morning',
    evening_report_id: '2026-09-14-evening',
    generated_at: '2026-09-16T08:00:00+08:00',
    model: 'MiniMax-M2.7',
    prompt_version: 'daily-commentary-v1',
  }],
};

function response(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

test('accepts a concise note only when morning and preceding evening sources match', () => {
  const result = parseMarketIntelDailyNote(reports, summaries);

  assert.equal(result.status, 'available');
  assert.equal(result.note.date, '2026-09-14');
  assert.equal(result.note.text, summaries.summaries[0].text);
  assert.equal(result.note.morningReportId, '2026-09-14-morning');
  assert.equal(result.note.eveningReportId, '2026-09-14-evening');
  assert.equal(result.note.generatedAt, '2026-09-16T08:00:00+08:00');
});

test('treats an empty summary index as missing', () => {
  assert.deepEqual(
    parseMarketIntelDailyNote(reports, { ...summaries, summaries: [] }),
    { status: 'missing' },
  );
});

test('selects the latest generated note when one date has multiple source revisions', () => {
  const earlier = { ...summaries.summaries[0], text: '较早版本', generated_at: '2026-09-16T07:00:00+08:00' };
  const later = { ...summaries.summaries[0], text: '最新版本', generated_at: '2026-09-16T08:00:00+08:00' };
  const result = parseMarketIntelDailyNote(reports, { ...summaries, summaries: [earlier, later] });

  assert.equal(result.status, 'available');
  assert.equal(result.note.text, '最新版本');
});

test('rejects a summary whose date differs from the source morning report', () => {
  const mismatched = {
    ...summaries,
    summaries: [{ ...summaries.summaries[0], date: '2026-09-13' }],
  };
  assert.deepEqual(parseMarketIntelDailyNote(reports, mismatched), { status: 'invalid' });
});

test('rejects a summary that pairs a non-evening report', () => {
  const mismatched = {
    ...summaries,
    summaries: [{ ...summaries.summaries[0], evening_report_id: '2026-09-14-morning' }],
  };
  assert.deepEqual(parseMarketIntelDailyNote(reports, mismatched), { status: 'invalid' });
});

test('rejects an evening report generated after its paired morning report', () => {
  const lateEvening = {
    ...reports,
    reports: [
      { ...reports.reports[0], sections: [{ paragraphs: ['生成时间: 2026-09-15 19:08'] }] },
      { ...reports.reports[1], sections: [{ paragraphs: ['生成时间: 2026-09-15 07:03'] }] },
    ],
  };
  assert.deepEqual(parseMarketIntelDailyNote(lateEvening, summaries), { status: 'invalid' });
});

test('distinguishes absent provider data from HTTP errors', async () => {
  const missing = await loadMarketIntelDailyNote(async () => response({}, 404));
  const error = await loadMarketIntelDailyNote(async () => response({}, 503));
  assert.deepEqual(missing, { status: 'missing' });
  assert.deepEqual(error, { status: 'error' });
});

test('marks unreadable provider JSON as invalid', async () => {
  let requestCount = 0;
  const result = await loadMarketIntelDailyNote(async () => {
    requestCount += 1;
    return {
      ok: true,
      status: 200,
      json: async () => {
        if (requestCount === 1) return reports;
        throw new SyntaxError('invalid JSON');
      },
    };
  });

  assert.deepEqual(result, { status: 'invalid' });
});

test('isolates a provider network failure as error', async () => {
  const result = await loadMarketIntelDailyNote(async () => { throw new TypeError('offline'); });
  assert.deepEqual(result, { status: 'error' });
});
