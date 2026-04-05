import { test } from '@playwright/test';

const BASE = 'https://schedule.unicon.ltd';

test('debug login network flow', async ({ page }) => {
  const logs: string[] = [];

  page.on('request', (req) => {
    if (req.url().includes('/auth/') || req.url().includes('/api/') || req.url().includes('/operations/') || req.url().includes('/login')) {
      logs.push(`REQUEST ${req.method()} ${req.url()} body=${req.postData() || ''}`);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/auth/') || url.includes('/api/') || url.includes('/operations/') || url.includes('/login')) {
      let body = '';
      try {
        body = await res.text();
      } catch {}
      logs.push(`RESPONSE ${res.status()} ${url} body=${body.slice(0, 500)}`);
    }
  });

  page.on('requestfailed', (req) => {
    logs.push(`FAILED ${req.method()} ${req.url()} error=${req.failure()?.errorText || 'unknown'}`);
  });

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');

  const inputs = page.locator('input');
  await inputs.nth(0).fill('admin@unicon.ltd');
  await inputs.nth(1).fill('Unicon@2026');
  await page.locator('button[type="submit"]').click();

  await page.waitForTimeout(5000);

  console.log('=== LOGIN DEBUG LOGS START ===');
  for (const line of logs) console.log(line);
  console.log('=== LOGIN DEBUG LOGS END ===');

  const cookies = await page.context().cookies();
  console.log('=== COOKIES START ===');
  console.log(JSON.stringify(cookies, null, 2));
  console.log('=== COOKIES END ===');

  console.log('=== FINAL URL ===');
  console.log(page.url());
  console.log('=== PAGE CONTENT SNIPPET ===');
  console.log((await page.locator('body').innerText()).slice(0, 2000));
});
