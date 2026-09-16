export const DAILY_NOTE_TEXT = '存储撑住了，半导体隔夜偏弱，盘中反弹没能延续。';

export const DAILY_NOTE_REPORTS = {
  schema_version: 'market_intel_pages.reports.v1',
  reports: [
    { id: '2026-09-14-evening', date: '2026-09-14', kind: 'evening', sections: [{ paragraphs: ['生成时间: 2026-09-14 19:08'] }] },
    { id: '2026-09-14-morning', date: '2026-09-14', kind: 'morning', sections: [{ paragraphs: ['生成时间: 2026-09-15 07:03'] }] },
  ],
};

export const DAILY_NOTE_SUMMARIES = {
  schema_version: 'market_intel_pages.daily_summaries.v1',
  summaries: [{
    date: '2026-09-14',
    text: DAILY_NOTE_TEXT,
    morning_report_id: '2026-09-14-morning',
    evening_report_id: '2026-09-14-evening',
    generated_at: '2026-09-16T08:00:00+08:00',
    model: 'MiniMax-M2.7',
    prompt_version: 'daily-commentary-v1',
  }],
};

export async function installDailyNoteRoutes(page, {
  reports = DAILY_NOTE_REPORTS,
  summaries = DAILY_NOTE_SUMMARIES,
  reportsStatus = 200,
  summariesStatus = 200,
} = {}) {
  await page.route('https://runchengxie.github.io/market-intel-pages/data/reports.json', (route) => route.fulfill({
    status: reportsStatus,
    contentType: 'application/json',
    body: JSON.stringify(reports),
  }));
  await page.route('https://runchengxie.github.io/market-intel-pages/data/daily_summaries.json', (route) => route.fulfill({
    status: summariesStatus,
    contentType: 'application/json',
    body: JSON.stringify(summaries),
  }));
}
