# Deployment Guide - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Production Ready

---

## 1. Infrastructure Overview

### Recommended Architecture (M1)

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend & Backend: Vercel (Serverless)                    │
│  Database: Supabase PostgreSQL                               │
│  File Storage: Cloudinary                                    │
│  Email: Lark Suite SMTP                                      │
│  Monitoring: Sentry + Vercel Analytics                       │
│  DNS: Cloudflare                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Alternative Options

#### Option A: Vercel + Supabase (Recommended)
**Best for**: MVP, fast deployment, auto-scaling
- **Pros**: Easy setup, excellent DX, auto-scaling, global CDN
- **Cons**: Serverless cold starts, vendor lock-in
- **Cost**: ~$71/month (Pro tier)

#### Option B: Railway
**Best for**: Monolithic apps, simpler pricing
- **Pros**: Simple pricing, good for full-stack apps, easy database management
- **Cons**: Less mature than Vercel, limited regions
- **Cost**: ~$50/month (usage-based)

#### Option C: AWS (ECS + RDS)
**Best for**: Enterprise scale, full control
- **Pros**: Complete control, highly scalable, extensive services
- **Cons**: Complex setup, higher operational overhead
- **Cost**: ~$200+/month (depends on usage)

---

## 2. Environment Setup

### 2.1 Development Environment

```bash
# .env.local (gitignored)
DATABASE_URL="postgresql://localhost:5432/unicon_dev"
JWT_SECRET="dev-secret-change-in-production"
NODE_ENV="development"

# Email (Dummy provider for dev)
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
SMTP_FROM="Unicon Schedule <no-reply@unicon.ltd>"

# File Storage (Local for dev)
FILE_STORAGE_PROVIDER="local"
UPLOAD_DIR="./uploads"

# Feature Flags
ENABLE_EMAIL="false"
ENABLE_FILE_UPLOAD="true"
```

### 2.2 Staging Environment

```bash
# .env.staging (Vercel Environment Variables)
DATABASE_URL="postgresql://user:pass@staging-db.supabase.co:5432/unicon_staging"
JWT_SECRET="staging-secret-strong-random-string-here"
NODE_ENV="staging"

# Email (Real SMTP)
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
SMTP_FROM="Unicon Schedule Staging <no-reply@unicon.ltd>"

# File Storage (Cloudinary)
FILE_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="unicon-staging"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="staging/pods"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/staging"
SENTRY_ENVIRONMENT="staging"

# Feature Flags
ENABLE_EMAIL="true"
ENABLE_FILE_UPLOAD="true"
RATE_LIMIT_ENABLED="true"
```

### 2.3 Production Environment

```bash
# .env.production (Vercel Environment Variables)
DATABASE_URL="postgresql://user:pass@prod-db.supabase.co:5432/unicon_production"
JWT_SECRET="production-secret-very-strong-random-string-minimum-32-chars"
NODE_ENV="production"

# Email (Production SMTP)
SMTP_HOST="smtp.larksuite.com"
SMTP_PORT="465"
SMTP_USER="no-reply@unicon.ltd"
SMTP_PASSWORD="Ubkv9EAS9SXqefoa"
SMTP_FROM="Unicon Schedule <no-reply@unicon.ltd>"

# File Storage (Cloudinary Production)
FILE_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="unicon-production"
CLOUDINARY_API_KEY="your-production-api-key"
CLOUDINARY_API_SECRET="your-production-api-secret"
CLOUDINARY_FOLDER="production/pods"

# Monitoring
SENTRY_DSN="https://xxx@sentry.io/production"
SENTRY_ENVIRONMENT="production"
VERCEL_ANALYTICS_ID="your-analytics-id"

# Security
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_WINDOW_MS="900000" # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"

# Feature Flags
ENABLE_EMAIL="true"
ENABLE_FILE_UPLOAD="true"
ENABLE_AUDIT_LOGGING="true"
```

---

## 3. Database Setup

### 3.1 Supabase Setup

#### Step 1: Create Project
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Choose region: Singapore (closest to Vietnam)
# 4. Set strong database password
# 5. Wait for provisioning (~2 minutes)
```

#### Step 2: Get Connection String
```bash
# From Supabase Dashboard > Settings > Database
# Connection string format:
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# For Prisma (with connection pooling):
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

#### Step 3: Configure Connection Pooling
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}

// .env
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
```

### 3.2 Database Migrations

#### Run Migrations
```bash
# Development
wasp db migrate-dev

# Production (via CI/CD)
wasp db migrate-deploy
```

#### Migration Checklist
- [ ] Test migration on staging first
- [ ] Backup production database before migration
- [ ] Run migration during low-traffic window
- [ ] Verify data integrity after migration
- [ ] Monitor for errors post-migration

### 3.3 Database Backup Strategy

#### Automated Backups (Supabase)
```yaml
Backup Schedule:
  - Daily: 2:00 AM UTC
  - Retention: 30 days
  - Point-in-Time Recovery: 7 days
  - Storage: Encrypted S3 bucket
```

#### Manual Backup
```bash
# Export database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Restore database
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_20240122.sql
```

---

## 4. File Storage Setup

### 4.1 Cloudinary Configuration

#### Step 1: Create Account
```bash
# 1. Go to https://cloudinary.com
# 2. Sign up for free account (25GB free)
# 3. Get credentials from Dashboard
```

#### Step 2: Configure in Application
```typescript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const uploadPOD = async (
  fileBuffer: Buffer,
  filename: string,
  shipmentId: string
) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
      {
        folder: `${process.env.CLOUDINARY_FOLDER}/${shipmentId}`,
        public_id: filename,
        resource_type: 'auto',
        overwrite: false,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Max size
          { quality: 'auto:good' }, // Auto quality
          { fetch_format: 'auto' } // Auto format
        ]
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
};

export const deletePOD = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file');
  }
};
```

#### Step 3: Folder Structure
```
cloudinary://
└── production/
    └── pods/
        ├── shipment-id-1/
        │   ├── pod-001.jpg
        │   └── pod-002.pdf
        ├── shipment-id-2/
        │   └── pod-003.jpg
        └── ...
```

---

## 5. Vercel Deployment

### 5.1 Initial Setup

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Link Project
```bash
# From project root
vercel link

# Follow prompts:
# - Select scope (your account/team)
# - Link to existing project or create new
# - Set project name: unicon-schedule
```

#### Step 3: Configure Environment Variables
```bash
# Add environment variables via Vercel Dashboard
# Settings > Environment Variables

# Or via CLI
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add CLOUDINARY_API_KEY production
# ... add all production variables
```

### 5.2 Deployment Process

#### Deploy to Production
```bash
# Build and deploy
vercel --prod

# Or via Git (recommended)
git push origin main  # Auto-deploys to production
```

#### Deploy to Preview (Staging)
```bash
# Every PR automatically creates preview deployment
git checkout -b feature/new-feature
git push origin feature/new-feature
# Creates preview URL: https://unicon-schedule-git-feature-xxx.vercel.app
```

### 5.3 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "wasp build",
  "outputDirectory": ".wasp/build/web-app/build",
  "framework": "vite",
  "regions": ["sin1"],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1",
      "permanent": false
    }
  ]
}
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [lint, test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Preview
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [lint, test, security]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://schedule.unicon.ltd
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: https://schedule.unicon.ltd
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 6.2 Deployment Stages

```
┌─────────────────────────────────────────────────────────┐
│                  Deployment Pipeline                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Feature Branch                                       │
│     └─> Push to branch                                   │
│         └─> Lint + Tests                                 │
│             └─> Preview Deploy (auto)                    │
│                                                           │
│  2. Pull Request                                         │
│     └─> Create PR                                        │
│         └─> Full test suite                              │
│             └─> Security scan                            │
│                 └─> Preview URL generated                │
│                                                           │
│  3. Merge to Main                                        │
│     └─> All checks pass                                  │
│         └─> Manual approval (optional)                   │
│             └─> Production deploy                        │
│                 └─> Smoke tests                          │
│                     └─> Team notification                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Monitoring & Logging

### 7.1 Sentry Setup

#### Installation
```bash
npm install @sentry/node @sentry/react
```

#### Configuration
```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: 0.1,
  integrations: [
    new ProfilingIntegration(),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Don't send 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    return event;
  },
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
});

export default Sentry;
```

#### Usage
```typescript
// In actions/queries
import Sentry from '../config/sentry';

export const createShipment = async (data, context) => {
  try {
    // Business logic
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: 'createShipment',
        userId: context.user.id
      },
      extra: {
        shipmentData: data
      }
    });
    throw error;
  }
};
```

### 7.2 Vercel Analytics

```typescript
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### 7.3 Logging Strategy

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'unicon-schedule',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    
    // File for production (Vercel logs)
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});

export default logger;
```

---

## 8. Security Checklist

### Pre-deployment Security Audit

#### Environment & Secrets
- [ ] All secrets in environment variables (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] Strong JWT secret (minimum 32 characters)
- [ ] Database password rotated
- [ ] API keys secured

#### HTTPS & Network
- [ ] HTTPS enforced (Vercel default)
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Security headers configured

#### Authentication & Authorization
- [ ] Password hashing with bcrypt
- [ ] JWT token expiration set
- [ ] Role-based access control working
- [ ] Session management secure

#### Input Validation
- [ ] All inputs validated
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload validation working

#### Rate Limiting
- [ ] Rate limiting enabled
- [ ] Login attempts limited
- [ ] API endpoints rate-limited
- [ ] File upload rate-limited

#### Monitoring
- [ ] Error tracking active (Sentry)
- [ ] Audit logging enabled
- [ ] Security alerts configured

---

## 9. Deployment Checklist

### Pre-deployment

#### Code Quality
- [ ] All tests passing
- [ ] Linter clean
- [ ] Type checking passed
- [ ] Code review completed
- [ ] No console.log in production code

#### Database
- [ ] Migrations tested on staging
- [ ] Backup created
- [ ] Migration scripts ready
- [ ] Rollback plan documented

#### Configuration
- [ ] Environment variables set
- [ ] DNS records configured
- [ ] SSL certificates valid
- [ ] Email SMTP configured

#### Documentation
- [ ] README updated
- [ ] API docs current
- [ ] Deployment guide reviewed
- [ ] Runbook prepared

### Deployment Steps

1. **Notify Team**
   ```bash
   # Post in Slack
   "🚀 Starting production deployment at $(date)"
   ```

2. **Create Backup**
   ```bash
   # Backup database
   pg_dump -h db.xxx.supabase.co -U postgres > backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Run Database Migrations**
   ```bash
   # On production database
   wasp db migrate-deploy
   ```

4. **Deploy Application**
   ```bash
   # Via Git (recommended)
   git push origin main
   
   # Or via Vercel CLI
   vercel --prod
   ```

5. **Verify Deployment**
   ```bash
   # Run smoke tests
   npm run test:smoke
   
   # Check health endpoints
   curl https://schedule.unicon.ltd/api/health
   ```

6. **Monitor**
   ```bash
   # Watch Sentry for errors
   # Check Vercel logs
   # Monitor database performance
   ```

### Post-deployment

- [ ] Smoke tests passed
- [ ] Critical user flows tested
- [ ] Database connectivity verified
- [ ] File uploads working
- [ ] Email sending working
- [ ] Monitoring dashboards showing data
- [ ] Error tracking active
- [ ] Team notified of completion

---

## 10. Rollback Procedure

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via Vercel Dashboard
# Deployments > Select previous > Promote to Production
```

### Database Rollback

```bash
# Revert last migration
wasp db migrate-revert

# Or restore from backup
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_pre_deploy_20240122.sql
```

### Emergency Rollback Checklist

1. **Identify Issue**
   - Check Sentry for errors
   - Review Vercel logs
   - Check user reports

2. **Assess Impact**
   - How many users affected?
   - Data integrity compromised?
   - Critical functionality broken?

3. **Execute Rollback**
   - Rollback application (Vercel)
   - Rollback database if needed
   - Clear caches if applicable

4. **Verify**
   - Test critical flows
   - Check error rates
   - Confirm user access

5. **Communicate**
   - Notify team
   - Update status page
   - Post-mortem scheduled

---

## 11. Cost Estimation

### Monthly Costs (Production)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20/month | Includes 100GB bandwidth |
| **Supabase** | Pro | $25/month | 8GB database, 50GB bandwidth |
| **Cloudinary** | Free | $0 | Up to 25GB storage, 25GB bandwidth |
| **Sentry** | Developer | $26/month | 50K events/month |
| **Domain** | - | $12/year | .ltd domain |
| **Total** | | **~$71/month** | **~$852/year** |

### Scaling Costs

| Usage Level | Monthly Cost | Notes |
|-------------|--------------|-------|
| **1K shipments/month** | ~$71 | Current estimate |
| **10K shipments/month** | ~$150 | Need Cloudinary paid plan |
| **100K shipments/month** | ~$500 | Need higher Vercel/Supabase tiers |

---

## 12. Maintenance Windows

### Scheduled Maintenance

- **Time**: Sundays 2:00-4:00 AM UTC (9:00-11:00 AM Vietnam)
- **Frequency**: Monthly (first Sunday)
- **Activities**:
  - Database optimization
  - Dependency updates
  - Security patches
  - Performance tuning

### Emergency Maintenance

- **Response Time**: < 1 hour
- **Communication**: Email + Slack
- **Escalation**: On-call engineer → CTO
- **Status Page**: status.unicon.ltd (future)

---

## 13. Support & Contacts

### Technical Contacts

- **DevOps Lead**: devops@unicon.ltd
- **Security Team**: security@unicon.ltd
- **Emergency Hotline**: +84-xxx-xxx-xxx

### Service Providers

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Cloudinary Support**: https://cloudinary.com/support
- **Sentry Support**: https://sentry.io/support

---

## 14. Next Steps

### Post-M1 Deployment

1. **Monitor Performance**
   - Track key metrics
   - Identify bottlenecks
   - Optimize queries

2. **Gather Feedback**
   - User surveys
   - Usage analytics
   - Feature requests

3. **Plan M2**
   - Financial layer
   - Advanced reporting
   - Mobile app (Driver)

4. **Continuous Improvement**
   - Weekly dependency updates
   - Monthly security reviews
   - Quarterly architecture reviews
