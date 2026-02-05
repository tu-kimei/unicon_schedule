# API Contracts v0.1 (M1)

## Tổng quan

API contracts cho Milestone M1 - Core Operations, bao gồm:
- Shipment management (CRUD)
- Dispatch assignment
- Status updates
- POD upload

Sử dụng Wasp Actions pattern với REST-like endpoints.

## Endpoint List

| Operation | Method | Path | Auth Required | Roles Allowed |
|-----------|--------|------|---------------|---------------|
| Create Shipment | `POST` | `/api/shipments` | ✅ | `OPS`, `ADMIN` |
| Update Shipment | `PUT` | `/api/shipments/{id}` | ✅ | `OPS`, `ADMIN` |
| Create Dispatch | `POST` | `/api/shipments/{id}/dispatch` | ✅ | `DISPATCHER`, `ADMIN` |
| Update Status | `PATCH` | `/api/shipments/{id}/status` | ✅ | `DISPATCHER`, `DRIVER`, `ADMIN` |
| Upload POD | `POST` | `/api/shipments/{id}/pods` | ✅ | `DRIVER`, `OPS`, `ADMIN` |

## 1. Create Shipment

### Request
```typescript
POST /api/shipments

interface CreateShipmentRequest {
  orderId: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate: string; // ISO 8601
  plannedEndDate: string;   // ISO 8601
  stops: ShipmentStopInput[];
}

interface ShipmentStopInput {
  sequence: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'DEPOT' | 'PORT';
  locationName: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  plannedArrival: string;   // ISO 8601
  plannedDeparture: string; // ISO 8601
  specialInstructions?: string;
}
```

### Response
```typescript
interface CreateShipmentResponse {
  success: true;
  shipment: {
    id: string;
    shipmentNumber: string;
    currentStatus: 'DRAFT';
    priority: string;
    plannedStartDate: string;
    plannedEndDate: string;
    stops: ShipmentStop[];
    createdAt: string;
  };
}
```

### Validation Rules
- `plannedEndDate > plannedStartDate`
- Stop sequences must be unique and start from 1
- Order must exist and not be cancelled
- User must have OPS or ADMIN role

## 2. Update Shipment

### Request
```typescript
PUT /api/shipments/{id}

interface UpdateShipmentRequest {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  plannedStartDate?: string;
  plannedEndDate?: string;
  stops?: ShipmentStopInput[]; // Full replace of stops
}
```

### Response
```typescript
interface UpdateShipmentResponse {
  success: true;
  shipment: {
    id: string;
    shipmentNumber: string;
    currentStatus: string;
    priority: string;
    plannedStartDate: string;
    plannedEndDate: string;
    stops: ShipmentStop[];
    updatedAt: string;
  };
}
```

### Validation Rules
- Shipment must exist and not be deleted
- Cannot update if status is COMPLETED or CANCELLED
- Same validation as Create for dates/stops
- User must have OPS or ADMIN role

## 3. Create Dispatch

### Request
```typescript
POST /api/shipments/{id}/dispatch

interface CreateDispatchRequest {
  vehicleId: string;
  driverId: string;
  notes?: string;
}
```

### Response
```typescript
interface CreateDispatchResponse {
  success: true;
  dispatch: {
    id: string;
    shipmentId: string;
    vehicle: {
      id: string;
      licensePlate: string;
      vehicleType: string;
    };
    driver: {
      id: string;
      driverCode: string;
      fullName: string;
      phone: string;
    };
    assignedAt: string;
    assignedBy: string;
    notes?: string;
  };
  statusEvent: {
    id: string;
    status: 'ASSIGNED';
    eventType: 'STATUS_CHANGE';
    description: 'Shipment assigned to vehicle and driver';
    createdAt: string;
  };
}
```

### Validation Rules
- Shipment must exist and status must be READY
- Shipment must not already have a dispatch
- Vehicle must exist and status must be AVAILABLE
- Driver must exist and status must be ACTIVE
- User must have DISPATCHER or ADMIN role

## 4. Update Status

### Request
```typescript
PATCH /api/shipments/{id}/status

interface UpdateStatusRequest {
  status: 'READY' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  description: string;
  location?: string;
  stopUpdates?: {
    stopId: string;
    actualArrival?: string;
    actualDeparture?: string;
  }[];
}
```

### Response
```typescript
interface UpdateStatusResponse {
  success: true;
  shipment: {
    id: string;
    currentStatus: string;
    actualStartDate?: string;
    actualEndDate?: string;
    updatedAt: string;
  };
  statusEvent: {
    id: string;
    status: string;
    eventType: 'STATUS_CHANGE' | 'EXCEPTION' | 'NOTE';
    description: string;
    location?: string;
    createdBy: string;
    createdAt: string;
  };
  updatedStops?: ShipmentStop[];
}
```

### Validation Rules
- Valid status transitions only (see state machine below)
- Shipment must exist and not be deleted
- For COMPLETED status: all stops must have actual times
- Role-based permissions per status

### Status Transition Rules
```
DRAFT → READY, CANCELLED
READY → ASSIGNED, CANCELLED
ASSIGNED → IN_TRANSIT, CANCELLED
IN_TRANSIT → COMPLETED, CANCELLED
COMPLETED → (terminal)
CANCELLED → (terminal)
```

## 5. Upload POD

### Request
```typescript
POST /api/shipments/{id}/pods
Content-Type: multipart/form-data

interface UploadPODRequest {
  file: File; // Multipart form data
  fileName: string;
  fileType: 'IMAGE_JPG' | 'IMAGE_PNG' | 'DOCUMENT_PDF';
  stopId?: string; // Optional: attach to specific stop
}
```

### Response
```typescript
interface UploadPODResponse {
  success: true;
  pod: {
    id: string;
    shipmentId: string;
    stopId?: string;
    fileName: string;
    filePath: string; // CDN URL
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: string;
    isSubmitted: false;
  };
}
```

### Validation Rules
- File size ≤ 5MB
- Supported file types only
- Shipment must exist
- If stopId provided, stop must belong to shipment
- User must have DRIVER, OPS, or ADMIN role

## Authorization Matrix

| Endpoint | OPS | DISPATCHER | DRIVER | ADMIN |
|----------|-----|------------|--------|-------|
| Create Shipment | ✅ | ❌ | ❌ | ✅ |
| Update Shipment | ✅ | ❌ | ❌ | ✅ |
| Create Dispatch | ❌ | ✅ | ❌ | ✅ |
| Update Status | ✅* | ✅* | ✅* | ✅ |
| Upload POD | ✅ | ❌ | ✅ | ✅ |

*Role-based per status transition

## Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

## Wasp Actions Implementation

```typescript
// src/actions/shipments.ts
export const createShipment = action(createShipmentImpl);
export const updateShipment = action(updateShipmentImpl);

// src/actions/dispatch.ts
export const createDispatch = action(createDispatchImpl);

// src/actions/status.ts
export const updateShipmentStatus = action(updateStatusImpl);

// src/actions/pods.ts
export const uploadPOD = action(uploadPODImpl);
```

## Notes

- All dates in ISO 8601 format (UTC)
- File uploads use multipart/form-data
- Status updates automatically create audit events
- Soft delete: deleted entities not returned in queries
- Rate limiting: TBD based on load testing
