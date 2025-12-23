# Đánh giá và Đề xuất Cải thiện Tài liệu Hệ thống

**Ngày đánh giá**: 2024-01-22  
**Phiên bản**: v0.3  
**Người đánh giá**: System Analysis

---

## 📊 Tổng quan Đánh giá

Hệ thống tài liệu hiện tại có **9 files** covering các khía cạnh chính của dự án logistics container nội địa. Đây là nền tảng tốt, nhưng còn **5 documents quan trọng bị thiếu** và **7 documents cần bổ sung** để đạt production-ready standard.

### Điểm số Tổng thể: 65/100

| Tiêu chí | Điểm | Ghi chú |
|----------|------|---------|
| Completeness | 60/100 | Thiếu 5 docs quan trọng |
| Technical Detail | 80/100 | ERD, API contracts tốt |
| Clarity | 75/100 | Cấu trúc rõ ràng |
| Actionability | 50/100 | Thiếu testing, deployment guides |

---

## ✅ Điểm Mạnh Hiện Tại

### 1. Cấu trúc Logic Tốt
- **00_CONTEXT.md**: Định nghĩa rõ bối cảnh và mục tiêu
- **01_PRD.md**: Personas và core flows được xác định
- **02_PLAN.md**: Milestone-based approach hợp lý
- **03_ARCHITECTURE.md**: Tech stack rõ ràng (Next.js, PostgreSQL, Prisma)

### 2. Chi Tiết Kỹ Thuật Cao
- **04_ERD.md**: Database schema chi tiết với Mermaid diagram
- **06_API_CONTRACTS.md**: API endpoints với request/response examples
- **07_UI_DESIGN.md**: Component structure và state management patterns

### 3. Documentation Maintenance
- **05_CHANGELOG.md**: Version tracking tốt
- **08_URLS_AND_SITEMAP.md**: Complete URL structure

---

## 🔴 Thiếu Sót Nghiêm Trọng (CRITICAL)

### 1. ❌ 09_TESTING_STRATEGY.md (THIẾU HOÀN TOÀN)

**Tác động**: Không có testing strategy → High risk of bugs in production

**Nội dung cần có**:

```markdown
# Testing Strategy

## 1. Unit Testing
### Backend Testing
- **Framework**: Jest + Supertest
- **Coverage Target**: 80%+
- **Test Cases**:
  - Actions: createShipment, updateShipmentStatus, createDispatch
  - Queries: getAllShipments, getPendingShipments
  - Validation: Business rules, data constraints

### Frontend Testing
- **Framework**: React Testing Library + Vitest
- **Coverage Target**: 70%+
- **Test Cases**:
  - Components: StatusBadge, ShipmentCard, Forms
  - Pages: OpsShipmentsPage, DispatcherDashboardPage
  - Hooks: useForm, useShipments

## 2. Integration Testing
### API Integration
- **Framework**: Supertest
- **Test Scenarios**:
  - Complete shipment lifecycle: Create → Dispatch → Status updates → POD upload
  - Authentication & authorization flows
  - Database transactions & rollbacks

### Database Testing
- **Framework**: Prisma Test Environment
- **Test Cases**:
  - CRUD operations
  - Foreign key constraints
  - Soft delete behavior
  - Audit trail creation

## 3. E2E Testing
### Framework
- **Tool**: Playwright
- **Browser Coverage**: Chrome, Firefox, Safari

### Critical User Journeys
1. **Ops Journey**: Login → Create Shipment → View Dashboard → Upload POD
2. **Dispatcher Journey**: Login → View Pending → Assign Dispatch → Update Status
3. **Authentication Journey**: Signup → Email Verification → Login → Password Reset

### Test Data Management
- **Seed Data**: Automated seeding for test environments
- **Data Cleanup**: Teardown after each test suite
- **Fixtures**: Reusable test data for common scenarios

## 4. Performance Testing
### Load Testing
- **Tool**: k6 or Artillery
- **Scenarios**:
  - 100 concurrent users creating shipments
  - 500 status updates per minute
  - File upload stress test (multiple 5MB PODs)

### Metrics
- API response time: < 500ms (p95)
- Page load time: < 2s (p95)
- Database query time: < 100ms (p95)

## 5. Security Testing
### Automated Security Scans
- **SAST**: ESLint security plugins
- **Dependency Scanning**: npm audit, Snyk
- **SQL Injection**: Automated Prisma query testing

### Manual Security Testing
- Authentication bypass attempts
- Authorization boundary testing
- File upload vulnerability testing
- XSS and CSRF testing

## 6. Test Automation & CI/CD
### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Unit tests
      - Integration tests
      - E2E tests (on main branch only)
      - Coverage report upload
```

### Pre-commit Hooks
- Lint checks
- Type checking
- Unit test execution

## 7. Test Coverage Requirements
| Layer | Minimum Coverage | Target Coverage |
|-------|------------------|-----------------|
| Backend Actions | 80% | 90% |
| Backend Queries | 75% | 85% |
| Frontend Components | 70% | 80% |
| Critical Paths | 100% | 100% |

## 8. Testing Checklist (Before Production)
- [ ] All unit tests passing
- [ ] Integration tests covering main flows
- [ ] E2E tests for critical journeys
- [ ] Performance benchmarks met
- [ ] Security scans clean
- [ ] Test coverage targets achieved
```

---

### 2. ❌ 10_DEPLOYMENT.md (THIẾU HOÀN TOÀN)

**Tác động**: Không có deployment guide → Khó deploy và maintain production

**Nội dung cần có**:

```markdown
# Deployment Guide

## 1. Infrastructure Setup

### Hosting Platform Options
#### Option A: Vercel (Recommended for MVP)
- **Frontend**: Vercel Edge Network
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
- **File Storage**: Vercel Blob Storage

**Pros**: Easy setup, auto-scaling, good DX
**Cons**: Serverless cold starts, vendor lock-in

#### Option B: Railway
- **Full Stack**: Railway containers
- **Database**: Railway PostgreSQL
- **File Storage**: S3-compatible storage

**Pros**: Simple pricing, good for monoliths
**Cons**: Less mature than Vercel

#### Option C: AWS (For Scale)
- **Frontend**: CloudFront + S3
- **Backend**: ECS Fargate
- **Database**: RDS PostgreSQL
- **File Storage**: S3

**Pros**: Full control, scalable
**Cons**: Complex setup, higher cost

### Recommended Stack (M1)
```
Frontend: Vercel
Backend: Vercel Serverless
Database: Supabase (PostgreSQL)
File Storage: Cloudinary (POD images/PDFs)
Email: Lark Suite SMTP
Monitoring: Sentry + Vercel Analytics
```

## 2. Environment Configuration

### Environment Variables

#### Development (.env.local)
```bash
DATABASE_URL="postgresql://localhost:5432/unicon_dev"
JWT_SECRET="dev-secret-key"
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
FILE_STORAGE_PROVIDER="local"
```

#### Staging (.env.staging)
```bash
DATABASE_URL="postgresql://staging-db-url"
JWT_SECRET="staging-secret-key"
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
FILE_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
SENTRY_DSN="https://sentry-dsn-staging"
```

#### Production (.env.production)
```bash
DATABASE_URL="postgresql://prod-db-url"
JWT_SECRET="prod-secret-key-strong-random"
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
FILE_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
SENTRY_DSN="https://sentry-dsn-production"
RATE_LIMIT_ENABLED="true"
```

## 3. Database Setup

### Supabase Setup
1. Create Supabase project
2. Copy connection string
3. Run migrations:
```bash
wasp db migrate-dev
```

### Backup Strategy
- **Automated Backups**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Point-in-Time Recovery**: Enabled
- **Backup Location**: S3 bucket (encrypted)

## 4. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: wasp build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Deployment Stages
```
Feature Branch → Dev Environment (auto-deploy)
    ↓
Pull Request → Staging Environment (preview deploy)
    ↓
Main Branch → Production (manual approval)
```

## 5. File Storage Setup

### Cloudinary Configuration
```typescript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadPOD = async (file: Buffer, filename: string) => {
  return cloudinary.uploader.upload(file, {
    folder: 'pods',
    resource_type: 'auto',
    public_id: filename
  });
};
```

## 6. Monitoring & Logging

### Sentry Setup
```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

### Logging Strategy
- **Application Logs**: Vercel logs (7 days retention)
- **Database Logs**: Supabase logs (30 days retention)
- **Error Tracking**: Sentry (unlimited retention)
- **Performance Monitoring**: Vercel Analytics

## 7. Security Checklist

### Pre-deployment Security
- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection headers
- [ ] CSRF tokens implemented
- [ ] File upload validation
- [ ] Authentication tokens expire properly

## 8. Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] SSL certificates valid
- [ ] DNS records configured

### Deployment Steps
1. **Database Migration**
   ```bash
   wasp db migrate-deploy
   ```

2. **Build Application**
   ```bash
   wasp build
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Verify Deployment**
   - Check health endpoints
   - Test critical user flows
   - Verify database connectivity
   - Test file uploads

### Post-deployment
- [ ] Smoke tests passed
- [ ] Monitoring dashboards showing data
- [ ] Error tracking active
- [ ] Backup job running
- [ ] Team notified

## 9. Rollback Procedure

### Quick Rollback (Vercel)
```bash
vercel rollback
```

### Database Rollback
```bash
# Restore from backup
pg_restore -d production_db backup_file.dump

# Or revert migration
wasp db migrate-revert
```

## 10. Maintenance Windows

### Scheduled Maintenance
- **Time**: Sundays 2-4 AM UTC
- **Frequency**: Monthly
- **Activities**: Database optimization, dependency updates

### Emergency Maintenance
- **Response Time**: < 1 hour
- **Communication**: Email + Slack notifications
- **Escalation**: On-call engineer

## 11. Scaling Strategy

### Horizontal Scaling
- **Vercel**: Auto-scales serverless functions
- **Database**: Read replicas for heavy queries
- **File Storage**: CDN for POD files

### Vertical Scaling
- **Database**: Upgrade Supabase plan when needed
- **Monitoring**: Track database CPU/memory usage

## 12. Cost Estimation

### Monthly Costs (Estimated)
| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month |
| Cloudinary | Free tier | $0 (up to 25GB) |
| Sentry | Developer | $26/month |
| **Total** | | **~$71/month** |

### Scaling Costs
- 1000 shipments/month: ~$71/month
- 10000 shipments/month: ~$150/month
- 100000 shipments/month: ~$500/month
```

---

### 3. ❌ 11_SECURITY.md (THIẾU HOÀN TOÀN)

**Tác động**: Không có security guidelines → High risk of vulnerabilities

**Nội dung cần có**:

```markdown
# Security Guidelines

## 1. Authentication Security

### Password Security
- **Hashing Algorithm**: bcrypt with salt rounds = 10
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

### JWT Token Security
```typescript
// Token configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'unicon-schedule',
  audience: 'unicon-users'
};
```

### Session Management
- **Session Timeout**: 15 minutes of inactivity
- **Concurrent Sessions**: Max 3 devices per user
- **Session Storage**: Redis (production) or in-memory (dev)

### Multi-Factor Authentication (Future)
- SMS-based OTP
- Authenticator app support
- Backup codes

## 2. Authorization & Access Control

### Role-Based Access Control (RBAC)
```typescript
const PERMISSIONS = {
  OPS: ['shipment:create', 'shipment:read', 'shipment:update', 'pod:upload'],
  DISPATCHER: ['shipment:read', 'dispatch:create', 'status:update'],
  ACCOUNTING: ['shipment:read', 'invoice:create', 'invoice:read'],
  DRIVER: ['shipment:read', 'status:update', 'pod:upload'],
  ADMIN: ['*'] // All permissions
};
```

### Permission Middleware
```typescript
export const requirePermission = (permission: string) => {
  return async (req, res, next) => {
    const user = req.user;
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

## 3. Data Security

### SQL Injection Prevention
- **ORM**: Prisma (parameterized queries by default)
- **Raw Queries**: Never use string concatenation
```typescript
// ❌ WRONG
const result = await prisma.$queryRaw(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ CORRECT
const result = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

### XSS Prevention
- **Input Sanitization**: DOMPurify for user-generated content
- **Output Encoding**: React auto-escapes by default
- **CSP Headers**: Content Security Policy configured

```typescript
// CSP configuration
const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https://api.unicon.ltd']
};
```

### CSRF Protection
- **Token-based**: CSRF tokens for state-changing operations
- **SameSite Cookies**: `SameSite=Strict` for session cookies

## 4. File Upload Security

### POD Upload Validation
```typescript
const FILE_UPLOAD_CONFIG = {
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
  virusScanEnabled: true // ClamAV integration
};
```

### File Storage Security
- **Access Control**: Pre-signed URLs with expiration
- **Encryption**: At-rest encryption (S3/Cloudinary)
- **Virus Scanning**: ClamAV or cloud-based scanning

### File Upload Flow
```typescript
export const uploadPOD = async (file: File) => {
  // 1. Validate file type
  if (!isAllowedFileType(file.type)) {
    throw new Error('Invalid file type');
  }

  // 2. Validate file size
  if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
    throw new Error('File too large');
  }

  // 3. Scan for viruses
  const scanResult = await scanFile(file);
  if (!scanResult.clean) {
    throw new Error('File contains malware');
  }

  // 4. Generate secure filename
  const secureFilename = generateSecureFilename(file.name);

  // 5. Upload to storage
  const url = await cloudinary.upload(file, secureFilename);

  return url;
};
```

## 5. API Security

### Rate Limiting
```typescript
const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
  signup: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 signups per hour
  api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 min
  fileUpload: { windowMs: 60 * 60 * 1000, max: 20 } // 20 uploads per hour
};
```

### Request Validation
```typescript
// Zod schema for validation
import { z } from 'zod';

const CreateShipmentSchema = z.object({
  orderId: z.string().uuid(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  plannedStartDate: z.string().datetime(),
  plannedEndDate: z.string().datetime(),
  stops: z.array(z.object({
    sequence: z.number().int().positive(),
    stopType: z.enum(['PICKUP', 'DROPOFF', 'DEPOT', 'PORT']),
    locationName: z.string().min(1).max(255),
    address: z.string().min(1).max(500)
  }))
});
```

### API Authentication
```typescript
// JWT verification middleware
export const authenticateJWT = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 6. Database Security

### Connection Security
- **SSL/TLS**: Enforce encrypted connections
- **Connection Pooling**: Limit concurrent connections
- **Credentials**: Rotate database passwords quarterly

### Data Encryption
- **At-rest**: Database-level encryption (Supabase default)
- **In-transit**: SSL/TLS for all connections
- **Sensitive Fields**: Additional encryption for PII

### Backup Security
- **Encrypted Backups**: AES-256 encryption
- **Access Control**: Limited to admin roles
- **Retention**: 30 days with secure deletion

## 7. Audit Logging

### What to Log
```typescript
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource: string; // 'Shipment', 'Dispatch', 'User', etc.
  resourceId: string;
  changes?: Record<string, any>; // Before/after values
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}
```

### Audit Log Retention
- **Critical Actions**: 7 years (compliance)
- **Regular Actions**: 1 year
- **Failed Attempts**: 90 days

## 8. Secrets Management

### Environment Variables
- **Never commit**: Use .env files (gitignored)
- **Production**: Use Vercel environment variables
- **Rotation**: Rotate secrets every 90 days

### Secret Storage
```bash
# Development
.env.local (gitignored)

# Production
Vercel Environment Variables (encrypted)
```

## 9. Security Headers

### HTTP Security Headers
```typescript
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## 10. Incident Response

### Security Incident Procedure
1. **Detection**: Automated alerts + manual reporting
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze logs and audit trails
4. **Remediation**: Patch vulnerabilities
5. **Recovery**: Restore services
6. **Post-mortem**: Document lessons learned

### Contact Information
- **Security Team**: security@unicon.ltd
- **Emergency Hotline**: +84-xxx-xxx-xxx
- **Escalation**: CTO → CEO

## 11. Compliance & Privacy

### Data Privacy (GDPR-like)
- **User Consent**: Explicit consent for data collection
- **Data Access**: Users can request their data
- **Data Deletion**: Users can request account deletion
- **Data Portability**: Export user data in JSON format

### Data Retention
- **Active Users**: Indefinite
- **Inactive Users**: 2 years after last login
- **Deleted Users**: 30 days grace period, then permanent deletion

## 12. Security Checklist

### Pre-deployment Security Audit
- [ ] All dependencies updated (no known vulnerabilities)
- [ ] npm audit clean
- [ ] Secrets not in code
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] File upload validation working
- [ ] Authentication working correctly
- [ ] Authorization rules enforced
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive info

### Ongoing Security
- [ ] Weekly dependency updates
- [ ] Monthly security reviews
- [ ] Quarterly penetration testing
- [ ] Annual security audit
```

---

## 🟡 Cải Thiện Cho Documents Hiện Tại

### 4. 00_CONTEXT.md - Cần bổ sung

**Thiếu**:
- Stakeholder map
- Success metrics (KPIs)
- Risk assessment chi tiết

**Đề xuất bổ sung**:

```markdown
## 5. Stakeholders

### Internal Stakeholders
- **Operations Team (5 người)**: Primary users, daily usage
- **Dispatch Team (3 người)**: Vehicle/driver assignment
- **Accounting Team (2 người)**: Invoice management
- **Drivers (20 người)**: Mobile app users (future)
- **Management**: Dashboard viewers, decision makers

### External Stakeholders
- **Customers (50+ active)**: Portal users (future phase)
- **IT Support**: System maintenance
- **Compliance Team**: Audit requirements

## 6. Success Metrics (KPIs)

### Operational KPIs
- **Shipment Processing Time**: < 5 minutes per shipment (target)
- **Dispatch Assignment Time**: < 2 minutes per assignment
- **POD Upload Rate**: 95%+ within 24 hours of completion
- **Data Accuracy**: 99%+ (vs Excel baseline)

### Business KPIs
- **User Adoption**: 80%+ of Ops/Dispatch using system within 1 month
- **Time Savings**: 30%+ reduction in admin time
- **Error Reduction**: 50%+ reduction in billing errors
- **Customer Satisfaction**: Improved transparency (qualitative)

### Technical KPIs
- **System Uptime**: 99.5%+
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms (p95)
- **Bug Rate**: < 5 critical bugs per month

## 7. Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration errors | Medium | High | Thorough testing, rollback plan |
| Performance issues at scale | Low | Medium | Load testing, optimization |
| Security vulnerabilities | Medium | High | Security audit, penetration testing |
| Third-party service downtime | Low | Medium | Fallback mechanisms, monitoring |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User resistance to change | High | High | Training, gradual rollout |
| Incomplete requirements | Medium | Medium | Iterative development, feedback loops |
| Budget overrun | Low | Medium | Fixed scope for M1, phased approach |
| Key personnel leaving | Low | High | Documentation, knowledge sharing |

### Operational Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Excel data quality issues | High | Medium | Data cleaning scripts, validation |
| Concurrent system usage | Medium | Low | Optimistic locking, conflict resolution |
| Network connectivity issues | Low | Medium | Offline-first for mobile (future) |
```

---

### 5. 01_PRD.md - Cần bổ sung

**Thiếu**:
- User stories chi tiết
- Edge cases handling
- Mobile app requirements cho Driver

**Đề xuất bổ sung**:

```markdown
## 6. User Stories (Detailed)

### Ops User Stories
**US-001**: As an Ops, I want to create a new shipment from an existing order, so that I can start the logistics process.
- **Acceptance Criteria**:
  - Can select order from dropdown
  - Can add multiple stops with sequence
  - System validates date ranges
  - Shipment number auto-generated

**US-002**: As an Ops, I want to view all shipments in a dashboard, so that I can track overall progress.
- **Acceptance Criteria**:
  - Can filter by status, priority, date range
  - Can see shipment cards with key info
  - Can click to view details
  - Real-time status updates

**US-003**: As an Ops, I want to upload POD documents, so that I can complete the shipment record.
- **Acceptance Criteria**:
  - Can upload JPG, PNG, PDF (max 5MB)
  - Can attach to specific stop or general shipment
  - File is immutable after submission
  - Thumbnail preview available

### Dispatcher User Stories
**US-004**: As a Dispatcher, I want to see all pending shipments, so that I can assign vehicles and drivers.
- **Acceptance Criteria**:
  - Only shows READY status shipments
  - Shows shipment priority and stops
  - Shows available vehicles and drivers
  - Can assign with one click

**US-005**: As a Dispatcher, I want to update shipment status, so that I can track real-time progress.
- **Acceptance Criteria**:
  - Can only transition to valid next status
  - Must provide description for status change
  - Timestamp automatically recorded
  - Audit trail created

### Driver User Stories (Future - Mobile App)
**US-006**: As a Driver, I want to receive dispatch notifications, so that I know when I have a new assignment.
- **Acceptance Criteria**:
  - Push notification on mobile
  - Shows shipment details and stops
  - Can accept or reject assignment
  - GPS navigation integration

**US-007**: As a Driver, I want to update my location and status, so that Ops can track my progress.
- **Acceptance Criteria**:
  - One-tap status updates
  - GPS location auto-captured
  - Can add notes or photos
  - Works offline with sync

## 7. Edge Cases & Exception Handling

### Shipment Edge Cases
1. **Vehicle Breakdown Mid-Transit**
   - **Scenario**: Assigned vehicle breaks down during shipment
   - **Handling**: 
     - Dispatcher can reassign to new vehicle
     - Status event logged with reason
     - Original dispatch record preserved
     - Customer notification (future)

2. **Driver Unavailable After Assignment**
   - **Scenario**: Driver calls in sick after dispatch assigned
   - **Handling**:
     - Dispatcher can reassign to different driver
     - Status reverts to READY
     - Audit trail shows reassignment
     - Vehicle remains assigned or can be changed

3. **Stop Sequence Changes**
   - **Scenario**: Customer requests stop order change mid-transit
   - **Handling**:
     - Ops can update stop sequence if status < IN_TRANSIT
     - If IN_TRANSIT, requires cancellation and new shipment
     - Status event logged

4. **POD Upload Failure**
   - **
