import { test, expect } from '@playwright/test';

test('GET / returns 200', async ({ request }) => {
  expect((await request.get('/')).status()).toBe(200);
});

test('home H1 visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
});

test('primary CTA visible', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('a,button').filter({ hasText: /track|invest|portfolio|start|analyze/i }).first()
  ).toBeVisible({ timeout: 10_000 });
});

test('mobile no overflow', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  ).toBe(false);
  await ctx.close();
});
