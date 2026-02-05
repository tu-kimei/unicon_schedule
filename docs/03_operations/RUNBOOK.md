# Operational Runbook - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Production Ready

---

## 1. Overview

This runbook provides step-by-step procedures for common operational tasks, troubleshooting, and incident response for the Unicon Schedule system.

### 1.1 Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **DevOps Lead** | TBD | devops@unicon.ltd | 24/7 |
| **Backend Lead** | TBD | backend@unicon.ltd | Business hours |
| **Frontend Lead** | TBD | frontend@unicon.ltd | Business hours |
| **Database Admin** | TBD | dba@unicon.ltd | On-call |
| **Security Team** | TBD | security@unicon.ltd | 24/7 |

### 1.2 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Production** | https://schedule.unicon.ltd | Main application |
| **Staging** | https://staging.schedule.unicon.ltd | Testing environment |
| **Vercel Dashboard** | https://vercel.com/unicon/schedule | Deployment & logs |
| **Supabase Dashboard** | https://app.supabase.com | Database management |
| **Sentry** | https://sentry.io/unicon/schedule | Error tracking |
| **Cloudinary** | https://cloudinary.com/console | File storage |

---

## 2. Common Operations

### 2.1 Deployment

#### Deploy to Production

```bash
# 1. Ensure all tests pass
npm run test

# 2. Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. Deploy via Git (automatic)
git push origin main

# 4. Or deploy via Vercel CLI
vercel --prod

# 5. Verify deployment
curl https://schedule.unicon.ltd/api/health

# 6. Monitor for errors
# Check Sentry dashboard for 15 minutes
```

#### Rollback Deployment

```bash
# Option 1: Via Vercel CLI
vercel rollback [deployment-url]

# Option 2: Via Vercel Dashboard
# 1. Go to Vercel Dashboard > Deployments
# 2. Find previous stable deployment
# 3. Click "Promote to Production"

# Option 3: Revert Git commit
git revert HEAD
git push origin main
```

### 2.2 Database Operations

#### Run Database Migration

```bash
# 1. Backup database first
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on staging
DATABASE_URL="staging-url" wasp db migrate-deploy

# 3. Run migration on production
DATABASE_URL="production-url" wasp db migrate-deploy

# 4. Verify migration
psql -h db.xxx.supabase.co -U postgres -d postgres -c "\dt"
```

#### Restore Database from Backup

```bash
# 1. Download backup file
aws s3 cp s3://unicon-backups/backup_20240122.sql ./

# 2. Stop application (prevent writes)
vercel env rm DATABASE_URL production

# 3. Restore database
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_20240122.sql

# 4. Verify data
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM \"Shipment\""

# 5. Restart application
vercel env add DATABASE_URL production
```

#### Optimize Database

```bash
# Connect to database
psql -h db.xxx.supabase.co -U postgres -d postgres

# Analyze tables
ANALYZE;

# Vacuum tables
VACUUM ANALYZE;

# Reindex
REINDEX DATABASE postgres;

# Check table sizes
SELECT
  schemaname || '.' || tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

### 2.3 User Management

#### Create Admin User

```bash
# Via Prisma Studio
npx prisma studio

# Or via SQL
psql -h db.xxx.supabase.co -U postgres -d postgres

INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "isActive")
VALUES (
  gen_random_uuid(),
  'admin@unicon.ltd',
  '$2a$10$...',  -- Use bcrypt hash
  'System Admin',
  'ADMIN',
  true
);
```

#### Reset User Password

```bash
# Generate password reset token
node scripts/generate-reset-token.js user@example.com

# Or via Prisma
npx prisma studio
# Navigate to User table
# Update passwordHash with new bcrypt hash
```

#### Deactivate User

```bash
# Via SQL
psql -h db.xxx.supabase.co -U postgres -d postgres

UPDATE "User"
SET "isActive" = false
WHERE email = 'user@example.com';

# Invalidate all sessions
DELETE FROM "Session"
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'user@example.com');
```

### 2.4 File Management

#### Clean Up Old POD Files

```bash
# List files older than 90 days
node scripts/list-old-pods.js --days 90

# Archive to cold storage
node scripts/archive-pods.js --days 90 --destination s3://unicon-archive/

# Delete from Cloudinary
node scripts/delete-old-pods.js --days 90 --confirm
```

#### Restore Deleted POD

```bash
# Find in archive
aws s3 ls s3://unicon-archive/pods/ --recursive | grep "pod-123"

# Restore to Cloudinary
aws s3 cp s3://unicon-archive/pods/pod-123.jpg ./
node scripts/restore-pod.js --file pod-123.jpg --shipment-id ship-456
```

---

## 3. Troubleshooting

### 3.1 Application Not Responding

**Symptoms**: Users cannot access the application, 502/503 errors

**Diagnosis**:
```bash
# 1. Check application status
curl -I https://schedule.unicon.ltd

# 2. Check Vercel deployment status
vercel ls

# 3. Check recent deployments
vercel logs --follow

# 4. Check Sentry for errors
# Visit Sentry dashboard
```

**Resolution**:
```bash
# If deployment failed:
vercel rollback

# If serverless functions timing out:
# Check Vercel dashboard > Functions
# Increase timeout in vercel.json

# If database connection issues:
# Check Supabase dashboard
# Verify DATABASE_URL environment variable
```

### 3.2 Slow Performance

**Symptoms**: Pages loading slowly, API timeouts

**Diagnosis**:
```bash
# 1. Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://schedule.unicon.ltd/api/shipments

# 2. Check database performance
psql -h db.xxx.supabase.co -U postgres -d postgres

SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# 3. Check Vercel Analytics
# Visit Vercel dashboard > Analytics

# 4. Check Sentry Performance
# Visit Sentry dashboard > Performance
```

**Resolution**:
```bash
# If slow database queries:
# Add missing indexes
CREATE INDEX idx_name ON "Table"("column");

# If high database connections:
# Increase connection pool
# Update DATABASE_URL with ?connection_limit=20

# If large response payloads:
# Implement pagination
# Add response compression

# If slow frontend:
# Check bundle size
npm run analyze
# Implement code splitting
```

### 3.3 Database Connection Errors

**Symptoms**: "Too many connections", "Connection timeout"

**Diagnosis**:
```bash
# Check active connections
psql -h db.xxx.supabase.co -U postgres -d postgres

SELECT COUNT(*) FROM pg_stat_activity;

# Check connection pool usage
SELECT
  max_conn,
  used,
  res_for_super,
  max_conn - used - res_for_super AS available
FROM (
  SELECT COUNT(*) AS used FROM pg_stat_activity
) t1,
(
  SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections'
) t2,
(
  SELECT setting::int AS res_for_super FROM pg_settings WHERE name = 'superuser_reserved_connections'
) t3;
```

**Resolution**:
```bash
# Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '10 minutes';

# Increase connection limit (Supabase dashboard)
# Or upgrade Supabase plan

# Implement connection pooling
# Update DATABASE_URL to use pgbouncer
postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

### 3.4 File Upload Failures

**Symptoms**: POD uploads failing, timeout errors

**Diagnosis**:
```bash
# 1. Check Cloudinary status
curl https://status.cloudinary.com/api/v2/status.json

# 2. Check Cloudinary usage
# Visit Cloudinary dashboard > Usage

# 3. Check application logs
vercel logs --follow | grep "upload"

# 4. Test upload manually
curl -X POST https://schedule.unicon.ltd/api/pods/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"
```

**Resolution**:
```bash
# If Cloudinary quota exceeded:
# Upgrade Cloudinary plan
# Or clean up old files

# If file too large:
# Implement client-side compression
# Increase upload size limit

# If network timeout:
# Implement chunked upload
# Increase timeout in vercel.json
```

### 3.5 Authentication Issues

**Symptoms**: Users cannot login, "Invalid token" errors

**Diagnosis**:
```bash
# 1. Check JWT secret
vercel env ls production | grep JWT_SECRET

# 2. Check user account
psql -h db.xxx.supabase.co -U postgres -d postgres

SELECT id, email, "isActive", "lastLogin"
FROM "User"
WHERE email = 'user@example.com';

# 3. Check session
SELECT * FROM "Session"
WHERE "userId" = 'user-id'
ORDER BY "createdAt" DESC;

# 4. Check application logs
vercel logs --follow | grep "auth"
```

**Resolution**:
```bash
# If JWT secret changed:
# All users need to re-login
# Send notification email

# If user account locked:
UPDATE "User"
SET "isActive" = true
WHERE email = 'user@example.com';

# If session expired:
# User needs to login again
# Check session timeout settings

# If password reset needed:
node scripts/generate-reset-token.js user@example.com
```

---

## 4. Incident Response

### 4.1 Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P1 - Critical** | Complete outage, data loss | < 15 minutes | Immediate |
| **P2 - High** | Major feature broken | < 1 hour | Within 30 min |
| **P3 - Medium** | Minor feature broken | < 4 hours | Within 2 hours |
| **P4 - Low** | Cosmetic issue | < 24 hours | Next business day |

### 4.2 Incident Response Procedure

#### Step 1: Detect & Alert
```
1. Incident detected via:
   - Monitoring alerts (Sentry, Vercel)
   - User reports
   - Health check failures

2. Create incident ticket:
   - Title: Brief description
   - Severity: P1-P4
   - Impact: Number of users affected
   - Start time: When issue began
```

#### Step 2: Assess & Communicate
```
1. Assess severity and impact
2. Notify stakeholders:
   - P1/P2: Immediate Slack notification
   - P3/P4: Email notification
3. Update status page (if available)
4. Assign incident commander
```

#### Step 3: Investigate & Diagnose
```
1. Check recent changes:
   - Recent deployments
   - Configuration changes
   - Database migrations

2. Review logs:
   - Application logs (Vercel)
   - Error logs (Sentry)
   - Database logs (Supabase)

3. Check dependencies:
   - Database status
   - External services (Cloudinary, SMTP)
   - Network connectivity

4. Document findings in incident ticket
```

#### Step 4: Resolve
```
1. Implement fix:
   - Rollback deployment (if recent deploy)
   - Apply hotfix
   - Restart services
   - Database repair

2. Verify fix:
   - Test affected functionality
   - Monitor error rates
   - Check user reports

3. Document resolution steps
```

#### Step 5: Post-Incident
```
1. Write post-mortem:
   - Timeline of events
   - Root cause analysis
   - Impact assessment
   - Resolution steps
   - Lessons learned
   - Action items

2. Update runbook with new procedures
3. Implement preventive measures
4. Close incident ticket
```

### 4.3 Common Incident Scenarios

#### Scenario 1: Database Outage

**Detection**: Health checks failing, database connection errors

**Immediate Actions**:
```bash
# 1. Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# 2. Check database connectivity
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT 1"

# 3. If database down:
# - Contact Supabase support
# - Enable maintenance mode
# - Notify users via Slack/Email

# 4. If connection pool exhausted:
# - Kill idle connections (see 3.3)
# - Increase connection limit
# - Restart application
```

**Recovery**:
```bash
# 1. Verify database is back online
# 2. Run health checks
# 3. Monitor error rates
# 4. Notify users service is restored
```

#### Scenario 2: Deployment Failure

**Detection**: Deployment failed in Vercel, application not accessible

**Immediate Actions**:
```bash
# 1. Check deployment logs
vercel logs

# 2. Rollback to previous version
vercel rollback

# 3. Verify rollback successful
curl https://schedule.unicon.ltd/api/health

# 4. Notify team in Slack
```

**Recovery**:
```bash
# 1. Fix deployment issue locally
# 2. Test thoroughly
# 3. Deploy to staging first
# 4. Deploy to production
# 5. Monitor for issues
```

#### Scenario 3: Data Corruption

**Detection**: Users reporting incorrect data, data integrity errors

**Immediate Actions**:
```bash
# 1. Identify affected data
psql -h db.xxx.supabase.co -U postgres -d postgres

SELECT * FROM "Shipment"
WHERE "updatedAt" > '2024-01-22 10:00:00'
ORDER BY "updatedAt" DESC;

# 2. Stop writes to affected tables
# - Enable read-only mode
# - Disable affected features

# 3. Backup current state
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_corrupted_$(date +%Y%m%d_%H%M%S).sql

# 4. Assess extent of corruption
```

**Recovery**:
```bash
# 1. Restore from last known good backup
# 2. Replay transactions if possible
# 3. Manual data correction if needed
# 4. Verify data integrity
# 5. Re-enable writes
# 6. Notify affected users
```

#### Scenario 4: Security Breach

**Detection**: Suspicious activity, unauthorized access, data leak

**Immediate Actions**:
```bash
# 1. ISOLATE IMMEDIATELY
# - Disable affected user accounts
# - Revoke API keys
# - Change passwords

# 2. Preserve evidence
# - Export audit logs
# - Save application logs
# - Document timeline

# 3. Notify security team
# - Email: security@unicon.ltd
# - Slack: #security-incidents

# 4. Assess impact
# - What data was accessed?
# - How many users affected?
# - What systems compromised?
```

**Recovery**:
```bash
# 1. Patch vulnerability
# 2. Reset all credentials
# 3. Force password reset for all users
# 4. Audit all access logs
# 5. Notify affected users
# 6. File incident report
# 7. Implement additional security measures
```

---

## 5. Maintenance Tasks

### 5.1 Daily Tasks

```bash
# Check system health
curl https://schedule.unicon.ltd/api/health

# Review error logs
# Visit Sentry dashboard

# Check database performance
psql -h db.xxx.supabase.co -U postgres -d postgres -c "
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 5;"

# Monitor disk usage
# Check Supabase dashboard
```

### 5.2 Weekly Tasks

```bash
# Review and close resolved incidents
# Update runbook with new procedures
# Check backup integrity
# Review security alerts
# Update dependencies (if needed)

npm outdated
npm audit
```

### 5.3 Monthly Tasks

```bash
# Database maintenance
VACUUM ANALYZE;
REINDEX DATABASE postgres;

# Clean up old data
node scripts/archive-old-data.js --days 90

# Review and optimize slow queries
# Update monitoring dashboards
# Security audit
# Performance review
# Cost optimization review
```

### 5.4 Quarterly Tasks

```bash
# Disaster recovery drill
# Full security audit
# Penetration testing
# Dependency updates
npm update
npm audit fix

# Review and update documentation
# Team training on new procedures
# Infrastructure cost review
```

---

## 6. Useful Commands

### 6.1 Database Commands

```bash
# Connect to database
psql -h db.xxx.supabase.co -U postgres -d postgres

# List tables
\dt

# Describe table
\d "Shipment"

# Count records
SELECT COUNT(*) FROM "Shipment";

# Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check table sizes
SELECT
  schemaname || '.' || tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

# Check index usage
SELECT
  schemaname || '.' || tablename as table_name,
  indexrelname as index_name,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### 6.2 Vercel Commands

```bash
# List deployments
vercel ls

# View logs
vercel logs
vercel logs --follow

# Environment variables
vercel env ls
vercel env add KEY production
vercel env rm KEY production

# Rollback
vercel rollback [deployment-url]

# Domains
vercel domains ls
vercel domains add schedule.unicon.ltd
```

### 6.3 Monitoring Commands

```bash
# Check API health
curl https://schedule.unicon.ltd/api/health

# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s https://schedule.unicon.ltd/api/shipments

# Test authentication
curl -X POST https://schedule.unicon.ltd/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test file upload
curl -X POST https://schedule.unicon.ltd/api/pods/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg"
```

---

## 7. Escalation Procedures

### 7.1 When to Escalate

- **P1 incidents** not resolved within 30 minutes
- **P2 incidents** not resolved within 2 hours
- **Security incidents** (immediate escalation)
- **Data loss or corruption** (immediate escalation)
- **Multiple simultaneous incidents**
- **Unclear root cause after initial investigation**

### 7.2 Escalation Path

```
Level 1: On-call Engineer
    ↓ (30 min for P1, 2 hours for P2)
Level 2: Team Lead
    ↓ (1 hour for P1, 4 hours for P2)
Level 3: CTO
    ↓ (2 hours for P1)
Level 4: CEO
```

### 7.3 Escalation Contacts

```
Level 1: oncall@unicon.ltd
Level 2: teamlead@unicon.ltd
Level 3: cto@unicon.ltd
Level 4: ceo@unicon.ltd

Emergency Hotline: +84-xxx-xxx-xxx
```

---

## 8. Appendix

### 8.1 curl-format.txt

```
time_namelookup:  %{time_namelookup}s\n
time_connect:  %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer:  %{time_pretransfer}s\n
time_redirect:  %{time_redirect}s\n
time_starttransfer:  %{time_starttransfer}s\n
----------\n
time_total:  %{time_total}s\n
```

### 8.2 Useful Links

- **Wasp Documentation**: https://wasp-lang.dev/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Sentry Documentation**: https://docs.sentry.io
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

### 8.3 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-22 | 1.0 | Initial runbook | DevOps Team |

---

**Last Updated**: 2024-01-22  
**Next Review**: 2024-04-22  
**Owner**: DevOps Team
