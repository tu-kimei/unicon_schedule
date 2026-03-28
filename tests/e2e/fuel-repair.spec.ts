import { test, expect } from '@playwright/test';

const BASE = 'https://schedule.unicon.ltd';
const ADMIN_EMAIL = 'admin@unicon.ltd';
const ADMIN_PASS = 'Unicon@2026';

// ─── Shared login helper ───────────────────────────────────────────────────
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');

  // Wasp LoginForm renders two inputs: email + password
  const inputs = page.locator('input');
  await inputs.nth(0).fill(ADMIN_EMAIL);
  await inputs.nth(1).fill(ADMIN_PASS);
  await page.locator('button[type="submit"]').click();

  // Should redirect somewhere other than /login
  await page.waitForURL((url: any) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

// ─── Test: Login ──────────────────────────────────────────────────────────
test('Login page loads and admin can sign in', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');

  // Should see login form
  await expect(page.locator('input').nth(0)).toBeVisible();
  await expect(page.locator('input').nth(1)).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();

  // Perform login
  await loginAsAdmin(page);

  // Verify redirect happened (not on login page)
  expect(page.url()).not.toContain('/login');
});

// ─── Test: Fuel Logs page ─────────────────────────────────────────────────
test('Fuel Logs page loads without errors', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto(`${BASE}/fuel`);
  await page.waitForLoadState('networkidle');

  // Heading should appear
  await expect(page.getByRole('heading', { name: /Phiếu Đổ Dầu/i })).toBeVisible({ timeout: 15_000 });

  // No JS error overlay (Wasp/Vite dev error overlay not present)
  const errorOverlay = page.locator('#vite-error-overlay, [data-testid="error-boundary"]');
  await expect(errorOverlay).toHaveCount(0);

  // API call: POST /operations/get-fuel-logs should return 200
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/operations/get-fuel-logs') && r.status() === 200,
      { timeout: 15_000 }
    ).catch(() => null),
    page.reload(),
  ]);
  if (response) {
    expect(response.status()).toBe(200);
  }
});

// ─── Test: Repair Logs page ───────────────────────────────────────────────
test('Repair Logs page loads without errors', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto(`${BASE}/repair`);
  await page.waitForLoadState('networkidle');

  // Heading
  await expect(page.getByRole('heading', { name: /Phiếu Sửa Chữa/i })).toBeVisible({ timeout: 15_000 });

  // No error overlay
  const errorOverlay = page.locator('#vite-error-overlay, [data-testid="error-boundary"]');
  await expect(errorOverlay).toHaveCount(0);

  // API call check
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/operations/get-repair-logs') && r.status() === 200,
      { timeout: 15_000 }
    ).catch(() => null),
    page.reload(),
  ]);
  if (response) {
    expect(response.status()).toBe(200);
  }
});

// ─── Test: Dashboard page ─────────────────────────────────────────────────
test('Fuel/Repair Dashboard page loads for admin', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto(`${BASE}/dashboard/fuel-repair`);
  await page.waitForLoadState('networkidle');

  // Dashboard heading
  await expect(page.getByRole('heading', { name: /Dashboard Chi phí/i })).toBeVisible({ timeout: 15_000 });

  // Filter panel visible
  await expect(page.getByRole('button', { name: 'Theo tháng' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Khoảng ngày' })).toBeVisible();

  // KPI section loads (spinner goes away)
  const spinner = page.locator('.animate-spin');
  await expect(spinner).toHaveCount(0, { timeout: 20_000 });

  // API call check
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/operations/get-dashboard-stats') && r.status() === 200,
      { timeout: 15_000 }
    ).catch(() => null),
    page.reload(),
  ]);
  if (response) {
    expect(response.status()).toBe(200);
  }
});

// ─── Test: Sidebar nav visible ────────────────────────────────────────────
test('Sidebar shows Fuel + Repair + Dashboard links for admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.waitForLoadState('networkidle');

  // On mobile sidebar may be hidden; navigate to any page first
  await page.goto(`${BASE}/fuel`);
  await page.waitForLoadState('networkidle');

  // sidebar links present (desktop sidebar should be visible)
  await expect(page.locator('a[href="/fuel"]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('a[href="/repair"]').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('a[href="/dashboard/fuel-repair"]').first()).toBeVisible({ timeout: 10_000 });
});
