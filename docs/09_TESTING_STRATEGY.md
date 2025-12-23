# Testing Strategy - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Draft

---

## 1. Testing Philosophy

### Core Principles
- **Test Early, Test Often**: Automated tests run on every commit
- **Test Pyramid**: More unit tests, fewer E2E tests
- **Test Coverage**: Minimum 80% backend, 70% frontend
- **Critical Path**: 100% coverage for business-critical flows

### Testing Levels
```
        /\
       /  \  E2E Tests (10%)
      /    \  - Critical user journeys
     /------\  - Cross-browser testing
    /        \
   / Integration \ (30%)
  /   Tests      \  - API integration
 /                \ - Database operations
/------------------\
/   Unit Tests      \ (60%)
/    (Majority)      \ - Functions, components
/____________________\ - Business logic
```

---

## 2. Unit Testing

### 2.1 Backend Unit Tests

#### Framework & Tools
- **Test Runner**: Vitest
- **Assertion Library**: Vitest (built-in)
- **Mocking**: Vitest mocks + Prisma mock
- **Coverage**: c8 (built into Vitest)

#### Test Structure
```typescript
// src/logistics/actions/__tests__/shipments.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createShipment } from '../shipments';
import { prisma } from '@wasp/db';

describe('createShipment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create shipment with valid data', async () => {
    const mockOrder = { id: 'order-1', status: 'CONFIRMED' };
    const mockShipment = {
      id: 'shipment-1',
      shipmentNumber: 'SH-2024-001',
      orderId: 'order-1',
      currentStatus: 'DRAFT'
    };

    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder);
    vi.spyOn(prisma.shipment, 'create').mockResolvedValue(mockShipment);

    const result = await createShipment({
      orderId: 'order-1',
      priority: 'NORMAL',
      plannedStartDate: new Date('2024-01-25'),
      plannedEndDate: new Date('2024-01-26'),
      stops: [
        {
          sequence: 1,
          stopType: 'PICKUP',
          locationName: 'Warehouse A',
          address: '123 Main St',
          plannedArrival: new Date('2024-01-25T08:00:00'),
          plannedDeparture: new Date('2024-01-25T09:00:00')
        }
      ]
    }, { user: { id: 'user-1', role: 'OPS' } });

    expect(result.success).toBe(true);
    expect(result.shipment.shipmentNumber).toBe('SH-2024-001');
  });

  it('should throw error if order not found', async () => {
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(null);

    await expect(
      createShipment({
        orderId: 'invalid-order',
        priority: 'NORMAL',
        plannedStartDate: new Date(),
        plannedEndDate: new Date(),
        stops: []
      }, { user: { id: 'user-1', role: 'OPS' } })
    ).rejects.toThrow('Order not found');
  });

  it('should validate date range', async () => {
    const mockOrder = { id: 'order-1', status: 'CONFIRMED' };
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder);

    await expect(
      createShipment({
        orderId: 'order-1',
        priority: 'NORMAL',
        plannedStartDate: new Date('2024-01-26'),
        plannedEndDate: new Date('2024-01-25'), // End before start
        stops: []
      }, { user: { id: 'user-1', role: 'OPS' } })
    ).rejects.toThrow('End date must be after start date');
  });

  it('should validate stop sequences', async () => {
    const mockOrder = { id: 'order-1', status: 'CONFIRMED' };
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder);

    await expect(
      createShipment({
        orderId: 'order-1',
        priority: 'NORMAL',
        plannedStartDate: new Date('2024-01-25'),
        plannedEndDate: new Date('2024-01-26'),
        stops: [
          { sequence: 1, stopType: 'PICKUP', locationName: 'A', address: '123' },
          { sequence: 1, stopType: 'DROPOFF', locationName: 'B', address: '456' } // Duplicate sequence
        ]
      }, { user: { id: 'user-1', role: 'OPS' } })
    ).rejects.toThrow('Stop sequences must be unique');
  });
});
```

#### Test Coverage Targets
| Module | Target | Priority |
|--------|--------|----------|
| Actions (shipments.ts) | 90% | Critical |
| Actions (dispatch.ts) | 90% | Critical |
| Actions (status.ts) | 85% | High |
| Actions (pods.ts) | 80% | Medium |
| Queries (shipments.ts) | 85% | High |
| Queries (dispatch.ts) | 80% | Medium |
| Validation functions | 95% | Critical |

### 2.2 Frontend Unit Tests

#### Framework & Tools
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **User Interaction**: @testing-library/user-event
- **Mocking**: MSW (Mock Service Worker) for API calls

#### Component Test Example
```typescript
// src/logistics/components/__tests__/StatusBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render DRAFT status with gray color', () => {
    render(<StatusBadge status="DRAFT" />);
    const badge = screen.getByText('DRAFT');
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('should render IN_TRANSIT status with orange color', () => {
    render(<StatusBadge status="IN_TRANSIT" />);
    const badge = screen.getByText('IN_TRANSIT');
    expect(badge).toHaveClass('bg-orange-100');
  });

  it('should render COMPLETED status with green color', () => {
    render(<StatusBadge status="COMPLETED" />);
    const badge = screen.getByText('COMPLETED');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<StatusBadge status="DRAFT" size="sm" />);
    expect(screen.getByText('DRAFT')).toHaveClass('text-xs');

    rerender(<StatusBadge status="DRAFT" size="lg" />);
    expect(screen.getByText('DRAFT')).toHaveClass('text-base');
  });
});
```

#### Page Test Example
```typescript
// src/logistics/pages/__tests__/OpsShipmentsPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpsShipmentsPage } from '../OpsShipmentsPage';
import { server } from '../../../test/mocks/server';
import { rest } from 'msw';

describe('OpsShipmentsPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should display loading state initially', () => {
    render(<OpsShipmentsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display shipments after loading', async () => {
    render(<OpsShipmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('SH-2024-001')).toBeInTheDocument();
      expect(screen.getByText('SH-2024-002')).toBeInTheDocument();
    });
  });

  it('should filter shipments by status', async () => {
    const user = userEvent.setup();
    render(<OpsShipmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('SH-2024-001')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'IN_TRANSIT');

    await waitFor(() => {
      expect(screen.queryByText('SH-2024-001')).not.toBeInTheDocument();
      expect(screen.getByText('SH-2024-002')).toBeInTheDocument();
    });
  });

  it('should navigate to create shipment page', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mock('@wasp/router', () => ({ useNavigate: () => mockNavigate }));

    render(<OpsShipmentsPage />);

    const createButton = screen.getByRole('button', { name: /create shipment/i });
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/ops/shipments/create');
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.post('/operations/get-all-shipments', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<OpsShipmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load shipments/i)).toBeInTheDocument();
    });
  });
});
```

---

## 3. Integration Testing

### 3.1 API Integration Tests

#### Test Setup
```typescript
// src/test/integration/setup.ts
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup and disconnect
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear all tables before each test
  await prisma.shipmentStatusEvent.deleteMany();
  await prisma.pod.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.shipmentStop.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});
```

#### Integration Test Example
```typescript
// src/test/integration/shipment-lifecycle.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '@wasp/db';
import { createShipment } from '../../logistics/actions/shipments';
import { createDispatch } from '../../logistics/actions/dispatch';
import { updateShipmentStatus } from '../../logistics/actions/status';
import { uploadPOD } from '../../logistics/actions/pods';

describe('Shipment Lifecycle Integration', () => {
  it('should complete full shipment lifecycle', async () => {
    // 1. Setup test data
    const customer = await prisma.customer.create({
      data: { name: 'Test Customer', email: 'test@example.com' }
    });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: 'ORD-001',
        status: 'CONFIRMED'
      }
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        licensePlate: '29A-12345',
        vehicleType: 'CONTAINER_TRUCK',
        status: 'AVAILABLE'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: 'driver@example.com',
        passwordHash: 'hashed',
        fullName: 'Test Driver',
        role: 'DRIVER'
      }
    });

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        driverCode: 'DRV-001',
        fullName: 'Test Driver',
        phone: '0901234567',
        licenseNumber: 'LIC-001',
        status: 'ACTIVE'
      }
    });

    const opsUser = await prisma.user.create({
      data: {
        email: 'ops@example.com',
        passwordHash: 'hashed',
        fullName: 'Ops User',
        role: 'OPS'
      }
    });

    // 2. Create shipment
    const shipmentResult = await createShipment({
      orderId: order.id,
      priority: 'NORMAL',
      plannedStartDate: new Date('2024-01-25T08:00:00'),
      plannedEndDate: new Date('2024-01-25T18:00:00'),
      stops: [
        {
          sequence: 1,
          stopType: 'PICKUP',
          locationName: 'Warehouse A',
          address: '123 Main St',
          plannedArrival: new Date('2024-01-25T08:00:00'),
          plannedDeparture: new Date('2024-01-25T09:00:00')
        },
        {
          sequence: 2,
          stopType: 'DROPOFF',
          locationName: 'Customer Site',
          address: '456 Oak Ave',
          plannedArrival: new Date('2024-01-25T16:00:00'),
          plannedDeparture: new Date('2024-01-25T17:00:00')
        }
      ]
    }, { user: opsUser });

    expect(shipmentResult.success).toBe(true);
    const shipmentId = shipmentResult.shipment.id;

    // 3. Update status to READY
    await updateShipmentStatus({
      shipmentId,
      status: 'READY',
      description: 'Shipment ready for dispatch'
    }, { user: opsUser });

    // 4. Create dispatch
    const dispatchResult = await createDispatch({
      shipmentId,
      vehicleId: vehicle.id,
      driverId: driver.id,
      notes: 'Standard delivery'
    }, { user: { id: 'dispatcher-1', role: 'DISPATCHER' } });

    expect(dispatchResult.success).toBe(true);

    // 5. Update status to IN_TRANSIT
    await updateShipmentStatus({
      shipmentId,
      status: 'IN_TRANSIT',
      description: 'Driver started journey',
      stopUpdates: [
        {
          stopId: shipmentResult.shipment.stops[0].id,
          actualArrival: new Date('2024-01-25T08:15:00'),
          actualDeparture: new Date('2024-01-25T09:10:00')
        }
      ]
    }, { user });

    // 6. Upload POD
    const mockFile = Buffer.from('fake-image-data');
    const podResult = await uploadPOD({
      shipmentId,
      file: mockFile,
      fileName: 'pod-001.jpg',
      fileType: 'IMAGE_JPG',
      stopId: shipmentResult.shipment.stops[1].id
    }, { user });

    expect(podResult.success).toBe(true);

    // 7. Complete shipment
    await updateShipmentStatus({
      shipmentId,
      status: 'COMPLETED',
      description: 'Delivery completed',
      stopUpdates: [
        {
          stopId: shipmentResult.shipment.stops[1].id,
          actualArrival: new Date('2024-01-25T16:05:00'),
          actualDeparture: new Date('2024-01-25T17:00:00')
        }
      ]
    }, { user });

    // 8. Verify final state
    const finalShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        stops: true,
        dispatch: true,
        statusEvents: true,
        pods: true
      }
    });

    expect(finalShipment.currentStatus).toBe('COMPLETED');
    expect(finalShipment.actualStartDate).toBeTruthy();
    expect(finalShipment.actualEndDate).toBeTruthy();
    expect(finalShipment.stops).toHaveLength(2);
    expect(finalShipment.stops[0].actualArrival).toBeTruthy();
    expect(finalShipment.stops[1].actualArrival).toBeTruthy();
    expect(finalShipment.dispatch).toBeTruthy();
    expect(finalShipment.statusEvents.length).toBeGreaterThan(3);
    expect(finalShipment.pods).toHaveLength(1);
  });
});
```

---

## 4. End-to-End (E2E) Testing

### 4.1 E2E Framework

#### Tools
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel Execution**: Yes
- **Video Recording**: On failure only

#### Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 4.2 Critical User Journeys

#### Journey 1: Ops - Create Shipment
```typescript
// e2e/ops-create-shipment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ops - Create Shipment Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Ops user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ops@unicon.ltd');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create shipment successfully', async ({ page }) => {
    // Navigate to create shipment page
    await page.click('text=Create Shipment');
    await expect(page).toHaveURL('/ops/shipments/create');

    // Step 1: Basic Info
    await page.selectOption('select[name="orderId"]', { label: 'ORD-2024-001' });
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.fill('input[name="plannedStartDate"]', '2024-01-25T08:00');
    await page.fill('input[name="plannedEndDate"]', '2024-01-25T18:00');
    await page.click('button:has-text("Next")');

    // Step 2: Add Stops
    await page.click('button:has-text("Add Stop")');
    await page.selectOption('select[name="stops[0].stopType"]', 'PICKUP');
    await page.fill('input[name="stops[0].locationName"]', 'Warehouse A');
    await page.fill('input[name="stops[0].address"]', '123 Main St, HCMC');
    await page.fill('input[name="stops[0].plannedArrival"]', '2024-01-25T08:00');
    await page.fill('input[name="stops[0].plannedDeparture"]', '2024-01-25T09:00');

    await page.click('button:has-text("Add Stop")');
    await page.selectOption('select[name="stops[1].stopType"]', 'DROPOFF');
    await page.fill('input[name="stops[1].locationName"]', 'Customer Site');
    await page.fill('input[name="stops[1].address"]', '456 Oak Ave, HCMC');
    await page.fill('input[name="stops[1].plannedArrival"]', '2024-01-25T16:00');
    await page.fill('input[name="stops[1].plannedDeparture"]', '2024-01-25T17:00');

    await page.click('button:has-text("Next")');

    // Step 3: Review & Submit
    await expect(page.locator('text=Warehouse A')).toBeVisible();
    await expect(page.locator('text=Customer Site')).toBeVisible();
    await page.click('button:has-text("Create Shipment")');

    // Verify success
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Shipment created successfully')).toBeVisible();
    await expect(page.locator('text=SH-2024-')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/ops/shipments/create');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=Order is required')).toBeVisible();
    await expect(page.locator('text=Start date is required')).toBeVisible();
  });

  test('should validate date range', async ({ page }) => {
    await page.goto('/ops/shipments/create');

    await page.selectOption('select[name="orderId"]', { index: 1 });
    await page.fill('input[name="plannedStartDate"]', '2024-01-26T08:00');
    await page.fill('input[name="plannedEndDate"]', '2024-01-25T18:00'); // End before start

    await page.click('button:has-text("Next")');

    await expect(page.locator('text=End date must be after start date')).toBeVisible();
  });
});
```

#### Journey 2: Dispatcher - Assign Dispatch
```typescript
// e2e/dispatcher-assign-dispatch.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dispatcher - Assign Dispatch Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Dispatcher
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dispatcher@unicon.ltd');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dispatcher');
  });

  test('should assign vehicle and driver to shipment', async ({ page }) => {
    // Wait for pending shipments to load
    await expect(page.locator('text=Pending Shipments')).toBeVisible();

    // Click on first pending shipment
    await page.click('.shipment-card:first-child');

    // Dispatch modal should open
    await expect(page.locator('text=Assign Dispatch')).toBeVisible();

    // Select vehicle
    await page.selectOption('select[name="vehicleId"]', { label: '29A-12345' });

    // Select driver
    await page.selectOption('select[name="driverId"]', { label: 'DRV-001 - Nguyen Van A' });

    // Add notes
    await page.fill('textarea[name="notes"]', 'Standard delivery route');

    // Submit dispatch
    await page.click('button:has-text("Assign Dispatch")');

    // Verify success
    await expect(page.locator('text=Dispatch assigned successfully')).toBeVisible();

    // Shipment should disappear from pending list
    await expect(page.locator('.shipment-card')).toHaveCount(0);
  });

  test('should show available resources', async ({ page }) => {
    await expect(page.locator('text=Available Vehicles')).toBeVisible();
    await expect(page.locator('text=Available Drivers')).toBeVisible();

    // Should show vehicle cards
    await expect(page.locator('.vehicle-card')).toHaveCount(3);

    // Should show driver cards
    await expect(page.locator('.driver-card')).toHaveCount(5);
  });
});
```

---

## 5. Performance Testing

### 5.1 Load Testing

#### Tool: k6
```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:3000/api/auth/login', {
    email: 'ops@unicon.ltd',
    password: 'password123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('token');

  // Get all shipments
  const shipmentsRes = http.post(
    'http://localhost:3000/operations/get-all-shipments',
    JSON.stringify({}),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  check(shipmentsRes, {
    'shipments loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 5.2 Performance Benchmarks

| Operation | Target (p95) | Acceptable (p95) | Critical (p95) |
|-----------|--------------|------------------|----------------|
| Page Load | < 1.5s | < 2.5s | < 4s |
| API Response | < 300ms | < 500ms | < 1s |
| Database Query | < 50ms | < 100ms | < 200ms |
| File Upload (5MB) | < 3s | < 5s | < 10s |
| Search/Filter | < 200ms | < 400ms | < 800ms |

---

## 6. Security Testing

### 6.1 Automated Security Scans

#### npm audit
```bash
# Run on every commit
npm audit --audit-level=moderate
```

#### Snyk
```bash
# Scan for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

### 6.2 Manual Security Testing

#### Authentication Testing
- [ ] Password brute force protection (rate limiting)
- [ ] JWT token expiration
- [ ] Session hijacking prevention
- [ ] Password reset token security

#### Authorization Testing
- [ ] Role-based access control
- [ ] Horizontal privilege escalation
- [ ] Vertical privilege escalation
- [ ] API endpoint authorization

#### Input Validation Testing
- [ ] SQL injection attempts
- [ ] XSS payloads
- [ ] File upload validation
- [ ] Request size limits

---

## 7. Test Automation & CI/CD

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-
