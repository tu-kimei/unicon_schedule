# Monitoring & Alerting Guide - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Production Ready

---

## 1. Monitoring Overview

### 1.1 Monitoring Stack

```
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Architecture                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Application Monitoring                                  │
│  ├── Sentry (Error tracking & Performance)              │
│  ├── Vercel Analytics (Web vitals)                      │
│  └── Custom metrics (Business KPIs)                     │
│                                                           │
│  Infrastructure Monitoring                               │
│  ├── Vercel Dashboard (Deployment & Functions)          │
│  ├── Supabase Dashboard (Database metrics)              │
│  └── Cloudinary Dashboard (Storage & CDN)               │
│                                                           │
│  Alerting                                                │
│  ├── Slack notifications                                 │
│  ├── Email alerts                                        │
│  └── PagerDuty (Critical issues)                        │
│                                                           │
│  Logging                                                 │
│  ├── Vercel Logs (Application logs)                     │
│  ├── Supabase Logs (Database logs)                      │
│  └── Sentry Breadcrumbs (User actions)                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Key Metrics to Monitor

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|-----------------|
| **Performance** | API Response Time (p95) | < 500ms | > 1s |
| | Page Load Time | < 2s | > 4s |
| | Database Query Time | < 100ms | > 200ms |
| **Availability** | Uptime | 99.5%+ | < 99% |
| | Error Rate | < 1% | > 5% |
| | Failed Requests | < 0.1% | > 1% |
| **Business** | Shipments Created/Day | - | < 10 (anomaly) |
| | Active Users | - | < 5 (anomaly) |
| | POD Upload Success Rate | > 95% | < 90% |
| **Infrastructure** | CPU Usage | < 70% | > 85% |
| | Memory Usage | < 80% | > 90% |
| | Database Connections | < 80% pool | > 90% pool |

---

## 2. Application Monitoring

### 2.1 Sentry Setup

#### Installation & Configuration

```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: 0.1,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app })
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send 404 errors
      if (event.exception?.values?.[0]?.value?.includes('404')) {
        return null;
      }
      
      // Don't send validation errors
      if (event.tags?.errorType === 'ValidationError') {
        return null;
      }
      
      return event;
    },
    
    // Breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    }
  });
};

// Error boundary for React
import { ErrorBoundary } from '@sentry/react';

export const App = () => {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
};
```

#### Custom Error Tracking

```typescript
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/node';

export const trackError = (
  error: Error,
  context?: {
    user?: { id: string; email: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) => {
  Sentry.withScope((scope) => {
    // Set user context
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email
      });
    }
    
    // Set tags for filtering
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Set extra context
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Capture exception
    Sentry.captureException(error);
  });
};

// Usage in actions
export const createShipment = async (data, context) => {
  try {
    // Business logic
    const shipment = await prisma.shipment.create({ data });
    return { success: true, shipment };
  } catch (error) {
    trackError(error, {
      user: context.user,
      tags: {
        action: 'createShipment',
        errorType: 'DatabaseError'
      },
      extra: {
        shipmentData: data,
        orderId: data.orderId
      }
    });
    
    throw error;
  }
};
```

#### Performance Monitoring

```typescript
// src/utils/performance.ts
import * as Sentry from '@sentry/node';

export const trackPerformance = (name: string) => {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name
  });
  
  return {
    addSpan: (spanName: string) => {
      return transaction.startChild({
        op: 'db',
        description: spanName
      });
    },
    
    finish: () => {
      transaction.finish();
    }
  };
};

// Usage
export const getShipmentWithDetails = async (shipmentId: string) => {
  const perf = trackPerformance('getShipmentWithDetails');
  
  try {
    // Database query span
    const dbSpan = perf.addSpan('fetch shipment');
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { stops: true, dispatch: true }
    });
    dbSpan.finish();
    
    // Processing span
    const processSpan = perf.addSpan('process data');
    const processed = processShipmentData(shipment);
    processSpan.finish();
    
    return processed;
  } finally {
    perf.finish();
  }
};
```

### 2.2 Vercel Analytics

```typescript
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export const App = () => {
  return (
    <>
      <YourApp />
      <Analytics />
      <SpeedInsights />
    </>
  );
};

// Track custom events
import { track } from '@vercel/analytics';

export const trackShipmentCreated = (shipmentId: string) => {
  track('Shipment Created', {
    shipmentId,
    timestamp: new Date().toISOString()
  });
};

export const trackPODUploaded = (shipmentId: string, fileSize: number) => {
  track('POD Uploaded', {
    shipmentId,
    fileSize,
    timestamp: new Date().toISOString()
  });
};
```

### 2.3 Custom Business Metrics

```typescript
// src/utils/metrics.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BusinessMetrics {
  shipmentsCreatedToday: number;
  shipmentsInTransit: number;
  shipmentsCompleted: number;
  activeUsers: number;
  podUploadRate: number;
  averageDeliveryTime: number;
}

export const collectBusinessMetrics = async (): Promise<BusinessMetrics> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    shipmentsCreatedToday,
    shipmentsInTransit,
    shipmentsCompleted,
    activeUsers,
    totalPODs,
    submittedPODs,
    deliveryTimes
  ] = await Promise.all([
    // Shipments created today
    prisma.shipment.count({
      where: {
        createdAt: { gte: today }
      }
    }),
    
    // Shipments in transit
    prisma.shipment.count({
      where: {
        currentStatus: 'IN_TRANSIT'
      }
    }),
    
    // Shipments completed today
    prisma.shipment.count({
      where: {
        currentStatus: 'COMPLETED',
        actualEndDate: { gte: today }
      }
    }),
    
    // Active users (logged in last 24 hours)
    prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Total PODs
    prisma.pOD.count(),
    
    // Submitted PODs
    prisma.pOD.count({
      where: { isSubmitted: true }
    }),
    
    // Delivery times
    prisma.shipment.findMany({
      where: {
        currentStatus: 'COMPLETED',
        actualStartDate: { not: null },
        actualEndDate: { not: null }
      },
      select: {
        actualStartDate: true,
        actualEndDate: true
      }
    })
  ]);
  
  // Calculate average delivery time
  const totalDeliveryTime = deliveryTimes.reduce((sum, shipment) => {
    const duration = shipment.actualEndDate!.getTime() - shipment.actualStartDate!.getTime();
    return sum + duration;
  }, 0);
  
  const averageDeliveryTime = deliveryTimes.length > 0
    ? totalDeliveryTime / deliveryTimes.length / (1000 * 60 * 60) // Convert to hours
    : 0;
  
  return {
    shipmentsCreatedToday,
    shipmentsInTransit,
    shipmentsCompleted,
    activeUsers,
    podUploadRate: totalPODs > 0 ? (submittedPODs / totalPODs) * 100 : 0,
    averageDeliveryTime
  };
};

// Expose metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    const metrics = await collectBusinessMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics'
    });
  }
};
```

---

## 3. Infrastructure Monitoring

### 3.1 Database Monitoring

```typescript
// src/utils/dbMonitoring.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DatabaseMetrics {
  activeConnections: number;
  slowQueries: number;
  tableSize: Record<string, number>;
  indexUsage: Record<string, number>;
}

export const collectDatabaseMetrics = async (): Promise<DatabaseMetrics> => {
  // Get active connections
  const connections = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM pg_stat_activity
    WHERE state = 'active'
  `;
  
  // Get slow queries (> 1 second)
  const slowQueries = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000
  `;
  
  // Get table sizes
  const tableSizes = await prisma.$queryRaw<Array<{ 
    table_name: string; 
    size_bytes: number 
  }>>`
    SELECT
      schemaname || '.' || tablename as table_name,
      pg_total_relation_size(schemaname || '.' || tablename) as size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
  `;
  
  // Get index usage
  const indexUsage = await prisma.$queryRaw<Array<{
    index_name: string;
    scans: number;
  }>>`
    SELECT
      indexrelname as index_name,
      idx_scan as scans
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC
  `;
  
  return {
    activeConnections: connections[0].count,
    slowQueries: slowQueries[0].count,
    tableSize: Object.fromEntries(
      tableSizes.map(t => [t.table_name, t.size_bytes])
    ),
    indexUsage: Object.fromEntries(
      indexUsage.map(i => [i.index_name, i.scans])
    )
  };
};

// Monitor database health
export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];
  
  try {
    const metrics = await collectDatabaseMetrics();
    
    // Check connection pool
    if (metrics.activeConnections > 80) {
      issues.push('High number of active connections');
    }
    
    // Check slow queries
    if (metrics.slowQueries > 10) {
      issues.push('High number of slow queries');
    }
    
    // Check table sizes
    const largeTable = Object.entries(metrics.tableSize).find(
      ([_, size]) => size > 1024 * 1024 * 1024 // 1GB
    );
    if (largeTable) {
      issues.push(`Large table detected: ${largeTable[0]}`);
    }
    
    // Check unused indexes
    const unusedIndex = Object.entries(metrics.indexUsage).find(
      ([_, scans]) => scans === 0
    );
    if (unusedIndex) {
      issues.push(`Unused index detected: ${unusedIndex[0]}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      healthy: false,
      issues: ['Failed to check database health']
    };
  }
};
```

### 3.2 API Health Checks

```typescript
// src/api/health.ts
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
    storage: { status: string; responseTime: number };
  };
}

export const healthCheckHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = Date.now();
  
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage()
  };
  
  const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
  const anyDegraded = Object.values(checks).some(c => c.status === 'degraded');
  
  const result: HealthCheckResult = {
    status: allHealthy ? 'healthy' : anyDegraded ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  };
  
  const statusCode = result.status === 'healthy' ? 200 : 
                     result.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(result);
};

const checkDatabase = async () => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
};

const checkRedis = async () => {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
};

const checkStorage = async () => {
  const start = Date.now();
  try {
    // Check Cloudinary connectivity
    await cloudinary.api.ping();
    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
};
```

---

## 4. Alerting

### 4.1 Slack Notifications

```typescript
// src/utils/notifications.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export const sendSlackAlert = async (
  severity: 'info' | 'warning' | 'error' | 'critical',
  title: string,
  message: string,
  details?: Record<string, any>
) => {
  const colors = {
    info: '#36a64f',
    warning: '#ff9900',
    error: '#ff0000',
    critical: '#8b0000'
  };
  
  const channel = severity === 'critical' 
    ? process.env.SLACK_CRITICAL_CHANNEL 
    : process.env.SLACK_ALERTS_CHANNEL;
  
  await slack.chat.postMessage({
    channel: channel!,
    attachments: [
      {
        color: colors[severity],
        title,
        text: message,
        fields: details ? Object.entries(details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })) : [],
        footer: 'Unicon Schedule',
        ts: Math.floor(Date.now() / 1000).toString()
      }
    ]
  });
};

// Usage
export const alertHighErrorRate = async (errorRate: number) => {
  await sendSlackAlert(
    'error',
    '🚨 High Error Rate Detected',
    `Error rate has exceeded threshold: ${errorRate.toFixed(2)}%`,
    {
      'Error Rate': `${errorRate.toFixed(2)}%`,
      'Threshold': '5%',
      'Environment': process.env.NODE_ENV
    }
  );
};

export const alertSlowQuery = async (query: string, duration: number) => {
  await sendSlackAlert(
    'warning',
    '⚠️ Slow Database Query',
    `A database query took ${duration}ms to execute`,
    {
      'Duration': `${duration}ms`,
      'Threshold': '1000ms',
      'Query': query.substring(0, 100) + '...'
    }
  );
};

export const alertDeploymentSuccess = async (version: string) => {
  await sendSlackAlert(
    'info',
    '✅ Deployment Successful',
    `Version ${version} has been deployed to production`,
    {
      'Version': version,
      'Environment': 'production',
      'Deployed By': 'GitHub Actions'
    }
  );
};
```

### 4.2 Email Alerts

```typescript
// src/utils/emailAlerts.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendEmailAlert = async (
  to: string[],
  subject: string,
  html: string
) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: to.join(', '),
    subject: `[Unicon Schedule] ${subject}`,
    html
  });
};

// Critical alert template
export const sendCriticalAlert = async (
  title: string,
  description: string,
  details: Record<string, any>
) => {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="background-color: #8b0000; color: white; padding: 20px;">
          <h1>🚨 CRITICAL ALERT</h1>
        </div>
        <div style="padding: 20px;">
          <h2>${title}</h2>
          <p>${description}</p>
          <h3>Details:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            ${Object.entries(details).map(([key, value]) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top: 20px;">
            <strong>Time:</strong> ${new Date().toISOString()}<br>
            <strong>Environment:</strong> ${process.env.NODE_ENV}
          </p>
        </div>
      </body>
    </html>
  `;
  
  await sendEmailAlert(
    [process.env.ALERT_EMAIL_TO!],
    `CRITICAL: ${title}`,
    html
  );
};
```

### 4.3 Alert Rules

```typescript
// src/monitoring/alertRules.ts
export interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  cooldown: number; // Minutes between alerts
}

export const alertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    condition: async () => {
      const errorRate = await getErrorRate();
      return errorRate > 5;
    },
    severity: 'error',
    message: 'Error rate exceeded 5%',
    cooldown: 15
  },
  {
    name: 'slow_api_response',
    condition: async () => {
      const p95 = await getAPIResponseTimeP95();
      return p95 > 1000;
    },
    severity: 'warning',
    message: 'API response time (p95) exceeded 1 second',
    cooldown: 30
  },
  {
    name: 'database_connection_pool_exhausted',
    condition: async () => {
      const usage = await getDatabaseConnectionPoolUsage();
      return usage > 90;
    },
    severity: 'critical',
    message: 'Database connection pool usage exceeded 90%',
    cooldown: 5
  },
  {
    name: 'low_disk_space',
    condition: async () => {
      const usage = await getDiskUsage();
      return usage > 85;
    },
    severity: 'warning',
    message: 'Disk usage exceeded 85%',
    cooldown: 60
  },
  {
    name: 'no_shipments_created',
    condition: async () => {
      const count = await getShipmentsCreatedToday();
      const hour = new Date().getHours();
      // Alert if no shipments created by 10 AM on weekdays
      return hour >= 10 && count === 0 && isWeekday();
    },
    severity: 'warning',
    message: 'No shipments created today',
    cooldown: 120
  }
];

// Alert checker (run every 5 minutes)
export const checkAlerts = async () => {
  for (const rule of alertRules) {
    try {
      const shouldAlert = await rule.condition();
      
      if (shouldAlert) {
        const lastAlert = await getLastAlertTime(rule.name);
        const cooldownExpired = !lastAlert || 
          (Date.now() - lastAlert.getTime()) > rule.cooldown * 60 * 1000;
        
        if (cooldownExpired) {
          await sendAlert(rule);
          await recordAlertTime(rule.name);
        }
      }
    } catch (error) {
      console.error(`Error checking alert rule ${rule.name}:`, error);
    }
  }
};

const sendAlert = async (rule: AlertRule) => {
  // Send to Slack
  await sendSlackAlert(
    rule.severity,
    rule.name.replace(/_/g, ' ').toUpperCase(),
    rule.message
  );
  
  // Send email for critical alerts
  if (rule.severity === 'critical') {
    await sendCriticalAlert(
      rule.name.replace(/_/g, ' ').toUpperCase(),
      rule.message,
      {
        'Alert Rule': rule.name,
        'Severity': rule.severity
      }
    );
  }
};
```

---

## 5. Logging

### 5.1 Structured Logging

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
    environment: process.env.NODE_ENV,
    version: process.env.VERCEL_GIT_COMMIT_SHA
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log levels: error, warn, info, http, verbose, debug, silly

export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
    // Also send to Sentry
    if (meta?.error) {
      Sentry.captureException(meta.error);
    }
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
  
  http: (req: Request, res: Response, duration: number) => {
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  }
};

// Usage
log.info('Shipment created', {
  shipmentId: 'ship-123',
  orderId: 'ord-456',
  userId: 'user-789'
});

log.error('Failed to create shipment', {
  error: new Error('Database connection failed'),
  orderId: 'ord-456',
  userId: 'user-789'
});
```

### 5.2 Audit Logging

```typescript
// src/utils/auditLog.ts
export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}

export const auditLog = async (entry: AuditLogEntry) => {
  // Store in database
  await prisma.auditLog.create({
    data: entry
  });
  
  // Also log to Winston
  log.info('Audit Log', entry);
};

// Usage in actions
export const updateShipmentStatus = async (data, context) => {
  const oldStatus = await prisma.shipment.findUnique({
    where: { id: data.shipmentId },
    select: { currentStatus: true }
  });
  
  try {
    const shipment = await prisma.shipment.update({
      where: { id: data.shipmentId },
      data: { currentStatus: data.status }
    });
    
    await auditLog({
      timestamp: new Date(),
      userId: context.user.id,
      action: 'UPDATE_STATUS',
      resource: 'Shipment',
      resourceId: data.shipmentId,
      changes: {
        currentStatus: {
          old: oldStatus?.currentStatus,
          new: data.status
        }
      },
      ipAddress: context.req.ip,
      userAgent: context.req.headers['user-agent'],
      result: 'SUCCESS'
    });
    
    return { success: true, shipment };
  } catch (error) {
    await auditLog({
      timestamp: new Date(),
      userId: context.user.id,
      action: 'UPDATE_STATUS',
      resource: 'Shipment',
      resourceId: data.shipmentId,
      ipAddress: context.req.ip,
      userAgent: context.req.headers['user-agent'],
      result: 'FAILURE',
      errorMessage: error.message
    });
    
    throw error;
  }
};
```

---

## 6. Dashboards

### 6.1 Monitoring Dashboard

```typescript
// src/pages/admin/MonitoringDashboard.
