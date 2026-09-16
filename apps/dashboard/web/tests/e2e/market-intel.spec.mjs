import { expect, test } from '@playwright/test';

async function openIntel(page) {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await page.waitForLoadState('networkidle');
}

test('Intel is the default view and explains source timing and the missing daily note provider', async ({ page }) => {
  await openIntel(page);

  await expect(page.getByRole('heading', { name: '今日市场情报' })).toBeVisible();
  await expect(page.getByText('各来源数据日期与生成时间可能不同，按来源分别查看。')).toBeVisible();
  await expect(page.getByText('尚未接入；等待 market-intel-pages provider 合并后再显示。')).toBeVisible();
  await expect(page.locator('[data-source-id="daily-note"]')).toContainText('尚未接入');
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
