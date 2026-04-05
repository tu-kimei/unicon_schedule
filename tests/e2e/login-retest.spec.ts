import { test } from '@playwright/test';

test('retest schedule login network', async ({ page }) => {
  const logs: string[] = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/auth/') || url.includes('/login') || url.includes('localhost:3001')) {
      logs.push(`REQUEST ${req.method()} ${url} body=${req.postData() || ''}`);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/auth/') || url.includes('/login') || url.includes('localhost:3001')) {
      let body = '';
      try { body = await res.text(); } catch {}
      logs.push(`RESPONSE ${res.status()} ${url} body=${body.slice(0, 300)}`);
    }
  });

  page.on('requestfailed', (req) => {
    logs.push(`FAILED ${req.method()} ${req.url()} error=${req.failure()?.errorText || 'unknown'}`);
  });

  await page.goto('https://schedule.unicon.ltd/login');
  await page.waitForLoadState('networkidle');

  const inputs = page.locator('input');
  await inputs.nth(0).fill('admin@unicon.ltd');
  await inputs.nth(1).fill('Unicon@2026');
  await page.locator('button[type="submit"]').click();

  await page.waitForTimeout(5000);

  console.log('=== LOGIN RETEST LOGS START ===');
  for (const line of logs) console.log(line);
  console.log('=== LOGIN RETEST LOGS END ===');
  console.log('=== FINAL URL ===');
  console.log(page.url());
  console.log('=== BODY ===');
  console.log((await page.locator('body').innerText()).slice(0, 2000));
});
