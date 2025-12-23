# Performance Optimization Guide - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Production Ready

---

## 1. Performance Goals

### 1.1 Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| **Page Load Time** | < 1.5s | < 2.5s | < 4s |
| **Time to Interactive (TTI)** | < 2s | < 3.5s | < 5s |
| **First Contentful Paint (FCP)** | < 1s | < 1.8s | < 3s |
| **API Response Time (p95)** | < 300ms | < 500ms | < 1s |
| **Database Query Time (p95)** | < 50ms | < 100ms | < 200ms |
| **File Upload (5MB)** | < 3s | < 5s | < 10s |
| **Search/Filter** | < 200ms | < 400ms | < 800ms |

### 1.2 Performance Budget

```typescript
// Performance budget configuration
export const PERFORMANCE_BUDGET = {
  // JavaScript bundle size
  javascript: {
    main: 200 * 1024,      // 200KB
    vendor: 300 * 1024,    // 300KB
    total: 500 * 1024      // 500KB
  },
  
  // CSS bundle size
  css: {
    main: 50 * 1024,       // 50KB
    total: 100 * 1024      // 100KB
  },
  
  // Images
  images: {
    hero: 100 * 1024,      // 100KB
    thumbnail: 20 * 1024,  // 20KB
    icon: 5 * 1024         // 5KB
  },
  
  // Fonts
  fonts: {
    perFont: 50 * 1024,    // 50KB per font
    total: 150 * 1024      // 150KB total
  },
  
  // API responses
  api: {
    list: 100 * 1024,      // 100KB for list endpoints
    detail: 50 * 1024,     // 50KB for detail endpoints
    create: 10 * 1024      // 10KB for create/update
  }
};
```

---

## 2. Database Optimization

### 2.1 Indexing Strategy

```sql
-- Critical indexes for performance

-- Shipment queries (most frequent)
CREATE INDEX idx_shipment_status ON "Shipment"("currentStatus");
CREATE INDEX idx_shipment_dates ON "Shipment"("plannedStartDate", "plannedEndDate");
CREATE INDEX idx_shipment_order ON "Shipment"("orderId");
CREATE INDEX idx_shipment_created ON "Shipment"("createdAt" DESC);

-- Composite index for common filter combinations
CREATE INDEX idx_shipment_status_priority_date 
ON "Shipment"("currentStatus", "priority", "plannedStartDate");

-- ShipmentStop queries
CREATE INDEX idx_stop_shipment_sequence ON "ShipmentStop"("shipmentId", "sequence");
CREATE INDEX idx_stop_type ON "ShipmentStop"("stopType");

-- Dispatch queries
CREATE INDEX idx_dispatch_shipment ON "Dispatch"("shipmentId");
CREATE INDEX idx_dispatch_vehicle ON "Dispatch"("vehicleId");
CREATE INDEX idx_dispatch_driver ON "Dispatch"("driverId");

-- Status events (for audit trail)
CREATE INDEX idx_status_event_shipment_created 
ON "ShipmentStatusEvent"("shipmentId", "createdAt" DESC);

-- POD queries
CREATE INDEX idx_pod_shipment ON "POD"("shipmentId");
CREATE INDEX idx_pod_submitted ON "POD"("isSubmitted");

-- User authentication
CREATE INDEX idx_user_email ON "User"("email");
CREATE INDEX idx_user_role ON "User"("role");

-- Partial indexes for active records only
CREATE INDEX idx_shipment_active 
ON "Shipment"("currentStatus") 
WHERE "deletedAt" IS NULL;

CREATE INDEX idx_vehicle_available 
ON "Vehicle"("status") 
WHERE "status" = 'AVAILABLE';

CREATE INDEX idx_driver_active 
ON "Driver"("status") 
WHERE "status" = 'ACTIVE';
```

### 2.2 Query Optimization

```typescript
// ❌ BAD: N+1 query problem
export const getShipmentsBad = async () => {
  const shipments = await prisma.shipment.findMany();
  
  // This creates N additional queries!
  for (const shipment of shipments) {
    shipment.stops = await prisma.shipmentStop.findMany({
      where: { shipmentId: shipment.id }
    });
  }
  
  return shipments;
};

// ✅ GOOD: Use include to fetch related data in one query
export const getShipmentsGood = async () => {
  return prisma.shipment.findMany({
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        include: {
          vehicle: true,
          driver: true
        }
      },
      order: {
        include: {
          customer: true
        }
      }
    }
  });
};

// ✅ BETTER: Use select to fetch only needed fields
export const getShipmentsOptimized = async () => {
  return prisma.shipment.findMany({
    select: {
      id: true,
      shipmentNumber: true,
      currentStatus: true,
      priority: true,
      plannedStartDate: true,
      plannedEndDate: true,
      stops: {
        select: {
          id: true,
          sequence: true,
          stopType: true,
          locationName: true,
          address: true
        },
        orderBy: { sequence: 'asc' }
      },
      dispatch: {
        select: {
          vehicle: {
            select: {
              licensePlate: true,
              vehicleType: true
            }
          },
          driver: {
            select: {
              driverCode: true,
              fullName: true
            }
          }
        }
      }
    }
  });
};

// ✅ BEST: Pagination for large datasets
export const getShipmentsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: ShipmentFilters
) => {
  const skip = (page - 1) * pageSize;
  
  const where = {
    deletedAt: null,
    ...(filters?.status && { currentStatus: filters.status }),
    ...(filters?.priority && { priority: filters.priority }),
    ...(filters?.dateFrom && {
      plannedStartDate: { gte: filters.dateFrom }
    }),
    ...(filters?.dateTo && {
      plannedEndDate: { lte: filters.dateTo }
    })
  };
  
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        id: true,
        shipmentNumber: true,
        currentStatus: true,
        priority: true,
        plannedStartDate: true,
        plannedEndDate: true,
        stops: {
          select: {
            id: true,
            sequence: true,
            stopType: true,
            locationName: true
          },
          orderBy: { sequence: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.shipment.count({ where })
  ]);
  
  return {
    data: shipments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};
```

### 2.3 Connection Pooling

```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

// Configure connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Connection pool configuration (in DATABASE_URL)
// postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20

export default prisma;
```

### 2.4 Query Caching

```typescript
// src/utils/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheQuery = async <T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
): Promise<T> => {
  // Try to get from cache
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Execute query
  const result = await queryFn();
  
  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(result));
  
  return result;
};

// Usage
export const getAvailableVehicles = async () => {
  return cacheQuery(
    'vehicles:available',
    300, // 5 minutes TTL
    async () => {
      return prisma.vehicle.findMany({
        where: { status: 'AVAILABLE' }
      });
    }
  );
};

// Invalidate cache on updates
export const updateVehicleStatus = async (
  vehicleId: string,
  status: VehicleStatus
) => {
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status }
  });
  
  // Invalidate cache
  await redis.del('vehicles:available');
};
```

---

## 3. Frontend Optimization

### 3.1 Code Splitting

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load route components
const OpsShipmentsPage = lazy(() => import('./logistics/pages/OpsShipmentsPage'));
const CreateShipmentPage = lazy(() => import('./logistics/pages/CreateShipmentPage'));
const DispatcherDashboardPage = lazy(() => import('./logistics/pages/DispatcherDashboardPage'));
const ShipmentDetailsPage = lazy(() => import('./logistics/pages/ShipmentDetailsPage'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export const App = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<OpsShipmentsPage />} />
        <Route path="/ops/shipments/create" element={<CreateShipmentPage />} />
        <Route path="/ops/shipments/:id" element={<ShipmentDetailsPage />} />
        <Route path="/dispatcher" element={<DispatcherDashboardPage />} />
      </Routes>
    </Suspense>
  );
};
```

### 3.2 Component Optimization

```typescript
// src/logistics/components/ShipmentCard.tsx
import { memo } from 'react';

// ❌ BAD: Component re-renders on every parent update
export const ShipmentCardBad = ({ shipment, onClick }) => {
  return (
    <div onClick={() => onClick(shipment)}>
      {/* Component content */}
    </div>
  );
};

// ✅ GOOD: Memoized component
export const ShipmentCard = memo(({ shipment, onClick }) => {
  return (
    <div onClick={() => onClick(shipment)}>
      {/* Component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.shipment.id === nextProps.shipment.id &&
    prevProps.shipment.currentStatus === nextProps.shipment.currentStatus
  );
});

// ✅ BETTER: Use React.memo with useMemo for expensive computations
import { memo, useMemo } from 'react';

export const ShipmentCardOptimized = memo(({ shipment, onClick }) => {
  // Memoize expensive calculations
  const stopsSummary = useMemo(() => {
    return shipment.stops
      .map(stop => stop.locationName)
      .join(' → ');
  }, [shipment.stops]);
  
  const statusColor = useMemo(() => {
    const colors = {
      DRAFT: 'gray',
      READY: 'blue',
      ASSIGNED: 'yellow',
      IN_TRANSIT: 'orange',
      COMPLETED: 'green',
      CANCELLED: 'red'
    };
    return colors[shipment.currentStatus];
  }, [shipment.currentStatus]);
  
  return (
    <div onClick={() => onClick(shipment)}>
      <div className={`bg-${statusColor}-100`}>
        {shipment.shipmentNumber}
      </div>
      <div>{stopsSummary}</div>
    </div>
  );
});
```

### 3.3 Virtual Scrolling

```typescript
// src/logistics/components/ShipmentList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const ShipmentList = ({ shipments }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: shipments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated row height
    overscan: 5 // Render 5 extra items above/below viewport
  });
  
  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const shipment = shipments[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <ShipmentCard shipment={shipment} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 3.4 Image Optimization

```typescript
// src/components/OptimizedImage.tsx
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Generate Cloudinary transformation URL
  const optimizedSrc = src.includes('cloudinary.com')
    ? src.replace('/upload/', `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`)
    : src;
  
  return (
    <div className={`relative ${className}`}>
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

// Usage
<OptimizedImage
  src="https://res.cloudinary.com/unicon/image/upload/v1/pods/pod-001.jpg"
  alt="POD Document"
  width={800}
  height={600}
  className="rounded-lg"
/>
```

### 3.5 Debouncing & Throttling

```typescript
// src/utils/performance.ts
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Usage: Search input with debounce
import { useState, useCallback } from 'react';

export const SearchInput = () => {
  const [query, setQuery] = useState('');
  
  const searchShipments = async (searchQuery: string) => {
    const results = await fetch(`/api/shipments/search?q=${searchQuery}`);
    // Handle results
  };
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value.length >= 3) {
        searchShipments(value);
      }
    }, 300),
    []
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search shipments..."
    />
  );
};

// Usage: Scroll event with throttle
export const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = throttle(() => {
      setScrollY(window.scrollY);
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return scrollY;
};
```

---

## 4. API Optimization

### 4.1 Response Compression

```typescript
// src/middleware/compression.ts
import compression from 'compression';

export const compressionMiddleware = compression({
  // Compress responses larger than 1KB
  threshold: 1024,
  
  // Compression level (0-9, higher = better compression but slower)
  level: 6,
  
  // Only compress these content types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Apply to all routes
app.use(compressionMiddleware);
```

### 4.2 Response Caching

```typescript
// src/middleware/cache.ts
export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Set cache headers
    res.set('Cache-Control', `public, max-age=${duration}`);
    res.set('Expires', new Date(Date.now() + duration * 1000).toUTCString());
    
    next();
  };
};

// Usage
app.get('/api/vehicles/available', 
  cacheMiddleware(300), // Cache for 5 minutes
  getAvailableVehiclesHandler
);

app.get('/api/shipments/:id',
  cacheMiddleware(60), // Cache for 1 minute
  getShipmentHandler
);
```

### 4.3 Batch Requests

```typescript
// src/api/batch.ts
interface BatchRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
}

interface BatchResponse {
  id: string;
  status: number;
  data: any;
}

export const batchHandler = async (
  requests: BatchRequest[]
): Promise<BatchResponse[]> => {
  // Execute requests in parallel
  const responses = await Promise.all(
    requests.map(async (req) => {
      try {
        const response = await executeRequest(req);
        return {
          id: req.id,
          status: 200,
          data: response
        };
      } catch (error) {
        return {
          id: req.id,
          status: error.status || 500,
          data: { error: error.message }
        };
      }
    })
  );
  
  return responses;
};

// Usage: Fetch multiple resources in one request
const batchRequests = [
  { id: '1', method: 'GET', url: '/api/shipments/123' },
  { id: '2', method: 'GET', url: '/api/vehicles/available' },
  { id: '3', method: 'GET', url: '/api/drivers/active' }
];

const responses = await fetch('/api/batch', {
  method: 'POST',
  body: JSON.stringify(batchRequests)
});
```

### 4.4 GraphQL DataLoader (Future)

```typescript
// src/graphql/loaders.ts
import DataLoader from 'dataloader';

// Batch load shipments by IDs
export const createShipmentLoader = () => {
  return new DataLoader(async (shipmentIds: string[]) => {
    const shipments = await prisma.shipment.findMany({
      where: { id: { in: shipmentIds } }
    });
    
    // Return in same order as requested
    return shipmentIds.map(id =>
      shipments.find(s => s.id === id) || null
    );
  });
};

// Batch load stops by shipment IDs
export const createStopsLoader = () => {
  return new DataLoader(async (shipmentIds: string[]) => {
    const stops = await prisma.shipmentStop.findMany({
      where: { shipmentId: { in: shipmentIds } },
      orderBy: { sequence: 'asc' }
    });
    
    // Group by shipment ID
    return shipmentIds.map(id =>
      stops.filter(stop => stop.shipmentId === id)
    );
  });
};

// Usage in resolver
export const shipmentResolver = {
  stops: async (parent, args, context) => {
    return context.loaders.stops.load(parent.id);
  }
};
```

---

## 5. File Upload Optimization

### 5.1 Client-Side Compression

```typescript
// src/utils/imageCompression.ts
import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1,              // Max file size 1MB
    maxWidthOrHeight: 1920,    // Max dimension
    useWebWorker: true,        // Use web worker for better performance
    fileType: 'image/jpeg'     // Convert to JPEG
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed from ${file.size / 1024}KB to ${compressedFile.size / 1024}KB`);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    return file;
  }
};

// Usage in upload component
export const PODUpload = () => {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Compress image before upload
    const compressedFile = await compressImage(file);
    
    // Upload compressed file
    await uploadPOD(compressedFile);
  };
  
  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
    />
  );
};
```

### 5.2 Chunked Upload

```typescript
// src/utils/chunkedUpload.ts
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export const uploadFileInChunks = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = crypto.randomUUID();
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    
    await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData
    });
    
    // Report progress
    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    onProgress?.(progress);
  }
  
  // Finalize upload
  const response = await fetch('/api/upload/finalize', {
    method: 'POST',
    body: JSON.stringify({ uploadId, filename: file.name })
  });
  
  const { url } = await response.json();
  return url;
};
```

---

## 6. Monitoring & Profiling

### 6.1 Performance Monitoring

```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance'
        });
      }
      
      return duration;
    }
  };
};

// Usage
export const loadShipments = async () => {
  const perf = measurePerformance('Load Shipments');
  
  try {
    const shipments = await fetch('/api/shipments');
    return shipments;
  } finally {
    perf.end();
  }
};
```

### 6.2 React Profiler

```typescript
// src/components/ProfiledComponent.tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`[Profiler] ${id} (${phase}):`, {
    actualDuration: `${actualDuration.toFixed(2)}ms`,
    baseDuration: `${baseDuration.toFixed(2)}ms`
  });
  
  // Send to analytics if slow
  if (actualDuration > 16) { // Slower than 60fps
    console.warn(`Slow render detected: ${id}`);
  }
};

export const ProfiledShipmentList = () => {
  return (
    <Profiler id="ShipmentList" onRender={onRenderCallback}>
      <ShipmentList />
    </Profiler>
  );
};
```

### 6.3 Database Query Logging

```typescript
// prisma/client.ts
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    }
  ]
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 100) { // Queries slower than 100ms
    console.warn('[Slow Query]', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params
    });
    
    // Send to monitoring service
    Sentry.captureMessage('Slow database query', {
      level: 'warning',
      extra: {
        query: e.query,
        duration: e.duration
      }
    });
  }
});
```

---

## 7. Performance Checklist

### Pre-deployment Performance Audit

#### Database
- [ ] All critical queries have indexes
- [ ] No N+1 query problems
- [ ] Connection pooling configured
- [ ] Query caching implemented for static data
- [ ] Slow query logging enabled

#### Frontend
- [ ] Code splitting implemented
- [ ] Components memoized where appropriate
- [ ] Images optimized and lazy-loaded
- [ ] Virtual scrolling for long lists
- [ ] Bundle size within budget

#### API
- [ ] Response compression enabled
- [ ] Caching headers configured
- [ ] Rate limiting implemented
- [ ] Pagination for list endpoints
- [ ] Batch endpoints for multiple requests

#### Files
- [ ] Client-side image compression
- [ ] File size limits enforced
- [ ] Chunked upload for large files
- [ ] CDN configured for static assets

#### Monitoring
- [ ] Performance metrics tracked
- [ ] Slow query alerts configured
- [ ] Frontend performance monitoring
- [ ] Error tracking active

---

## 8. Performance Testing

### 8.1 Load Testing Script

```bash
# k6 load test
k6 run --vus 100 --duration 5m performance-test.js
```

```javascript
// performance-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01']
  }
};

export default function () {
  // Test shipment list
  const listRes = http.get('http://localhost:3000/api/shipments');
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list response time < 500ms': (r) => r.timings.duration < 500
  });
  
  sleep(1);
  
  // Test shipment detail
  const detailRes = http.get('
