import { expect, test } from '@playwright/test';
import {
  DAILY_NOTE_REPORTS,
  DAILY_NOTE_TEXT,
  DAILY_NOTE_SUMMARIES,
  installDailyNoteRoutes,
} from './market-intel-fixtures.mjs';

async function openIntel(page, dailyNoteOptions) {
  await installDailyNoteRoutes(page, dailyNoteOptions);
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await page.waitForLoadState('networkidle');
}

test('Intel is the default view and shows a daily note linked to its morning and preceding evening sources', async ({ page }) => {
  await openIntel(page);

  await expect(page.getByRole('heading', { name: '今日市场情报' })).toBeVisible();
  await expect(page.getByText('各来源数据日期与生成时间可能不同，按来源分别查看。')).toBeVisible();
  await expect(page.locator('[data-source-id="daily-note"]')).toContainText(DAILY_NOTE_TEXT);
  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('2026-09-14-morning');
  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('2026-09-14-evening');
  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('2026-09-14');
});

test('a missing provider note does not hide the other Intel sources', async ({ page }) => {
  await openIntel(page, { summaries: { ...DAILY_NOTE_SUMMARIES, summaries: [] } });

  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('暂无可用每日短评');
  await expect(page.locator('[data-source-id="market-state"]')).toBeVisible();
  await expect(page.locator('[data-source-id="strategy-niu-men-line"]')).toBeVisible();
});

test('a source-date mismatch is shown as invalid and does not hide market data', async ({ page }) => {
  const invalidSummaries = {
    ...DAILY_NOTE_SUMMARIES,
    summaries: [{ ...DAILY_NOTE_SUMMARIES.summaries[0], date: '2026-09-13' }],
  };
  await openIntel(page, { summaries: invalidSummaries });

  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('快照格式无效');
  await expect(page.locator('[data-source-id="market-state"]')).toBeVisible();
});

test('one failed paper portfolio does not hide the other portfolio or other Intel sections', async ({ page }) => {
  await page.route('**/agent/stocks/latest.json', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
  await openIntel(page);

  await expect(page.locator('[data-source-id="agent-etf"]')).toContainText('ETF 配置组合');
  await expect(page.locator('[data-source-id="agent-stocks"]')).toContainText('加载失败');
  await expect(page.locator('[data-source-id="market-state"]')).toBeVisible();
  await expect(page.locator('[data-source-id="strategy-niu-men-line"]')).toBeVisible();
});

test('Intel links back to the existing Monitor, Research and Agent sections', async ({ page }) => {
  await openIntel(page);

  await page.getByRole('button', { name: '查看 Monitor', exact: true }).click();
  await expect(page.getByRole('heading', { name: '标的概览' })).toBeVisible();

  await page.getByRole('button', { name: 'Intel · 每日情报' }).click();
  await page.getByRole('button', { name: '查看 Research', exact: true }).click();
  await expect(page.getByRole('heading', { name: /牛门线全市场样本外研究/ })).toBeVisible();

  await page.getByRole('button', { name: 'Intel · 每日情报' }).click();
  await page.getByRole('button', { name: '查看 Agent', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Agent Portfolio' })).toBeVisible();
});

test('Intel 在手机宽度下不会撑出横向滚动条', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openIntel(page);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
