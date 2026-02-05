# Data Migration Guide - Unicon Schedule System

**Version**: 1.0  
**Last Updated**: 2024-01-22  
**Status**: Planning Phase

---

## 1. Migration Overview

### Current State (Excel/Zalo)

```
Current System:
├── Excel Files
│   ├── Orders.xlsx (Customer orders)
│   ├── Shipments.xlsx (Delivery tracking)
│   ├── Vehicles.xlsx (Fleet management)
│   ├── Drivers.xlsx (Driver information)
│   └── Invoices.xlsx (Billing records)
│
├── Zalo Messages
│   ├── Order confirmations
│   ├── Status updates
│   ├── POD photos
│   └── Ad-hoc communications
│
└── Manual Processes
    ├── Phone calls for dispatch
    ├── Paper-based POD
    └── Manual invoice creation
```

### Target State (Unicon Schedule)

```
New System:
├── PostgreSQL Database
│   ├── Structured data with relationships
│   ├── Audit trails
│   └── Data integrity constraints
│
├── Web Application
│   ├── Real-time status updates
│   ├── Digital POD management
│   └── Automated workflows
│
└── File Storage (Cloudinary)
    └── POD documents (images/PDFs)
```

### Migration Goals

1. **Zero Data Loss**: All historical data preserved
2. **Minimal Downtime**: < 4 hours during migration
3. **Data Quality**: Clean, validated, and normalized data
4. **Rollback Ready**: Ability to revert if issues occur
5. **User Training**: Team ready to use new system

---

## 2. Migration Strategy

### 2.1 Phased Approach

```
Phase 1: Preparation (Week 1-2)
├── Data audit and cleanup
├── Mapping Excel → Database schema
├── Migration scripts development
└── Test environment setup

Phase 2: Pilot Migration (Week 3)
├── Migrate subset of data (last 3 months)
├── User acceptance testing
├── Identify and fix issues
└── Refine migration scripts

Phase 3: Full Migration (Week 4)
├── Freeze Excel updates (Friday 6 PM)
├── Run full migration (Friday night)
├── Validation and testing (Saturday)
└── Go-live (Monday 8 AM)

Phase 4: Parallel Run (Week 5-6)
├── New system as primary
├── Excel as backup (read-only)
├── Daily reconciliation
└── Issue resolution

Phase 5: Cutover (Week 7)
├── Decommission Excel
├── Archive historical data
└── Full system ownership
```

### 2.2 Migration Timeline

| Week | Activities | Deliverables |
|------|-----------|--------------|
| **Week 1** | Data audit, schema mapping | Migration plan document |
| **Week 2** | Script development, testing | Migration scripts v1.0 |
| **Week 3** | Pilot migration, UAT | Validated pilot data |
| **Week 4** | Full migration, go-live | Production system live |
| **Week 5-6** | Parallel run, monitoring | Daily reconciliation reports |
| **Week 7** | Cutover, Excel archive | Migration complete |

---

## 3. Data Mapping

### 3.1 Customer Data

#### Excel Structure
```
Customers.xlsx:
- Mã KH (Customer Code)
- Tên KH (Customer Name)
- Địa chỉ (Address)
- Điện thoại (Phone)
- Email
- Người liên hệ (Contact Person)
```

#### Database Mapping
```typescript
// Excel → PostgreSQL Customer table
interface CustomerMapping {
  excelColumn: string;
  dbColumn: string;
  transformation?: (value: any) => any;
  validation?: (value: any) => boolean;
}

const customerMapping: CustomerMapping[] = [
  {
    excelColumn: 'Mã KH',
    dbColumn: 'customerCode',
    transformation: (value) => value.trim().toUpperCase(),
    validation: (value) => /^[A-Z0-9]{3,10}$/.test(value)
  },
  {
    excelColumn: 'Tên KH',
    dbColumn: 'name',
    transformation: (value) => value.trim(),
    validation: (value) => value.length > 0 && value.length <= 255
  },
  {
    excelColumn: 'Địa chỉ',
    dbColumn: 'address',
    transformation: (value) => value.trim()
  },
  {
    excelColumn: 'Điện thoại',
    dbColumn: 'phone',
    transformation: (value) => value.replace(/[^0-9+]/g, ''),
    validation: (value) => /^[0-9+]{10,15}$/.test(value)
  },
  {
    excelColumn: 'Email',
    dbColumn: 'email',
    transformation: (value) => value.trim().toLowerCase(),
    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }
];
```

### 3.2 Order Data

#### Excel Structure
```
Orders.xlsx:
- Số đơn (Order Number)
- Mã KH (Customer Code)
- Ngày đặt (Order Date)
- Mô tả (Description)
- Trọng lượng (Weight)
- Thể tích (Volume)
- Ghi chú (Notes)
- Trạng thái (Status)
```

#### Database Mapping
```typescript
const orderMapping = [
  {
    excelColumn: 'Số đơn',
    dbColumn: 'orderNumber',
    transformation: (value) => value.trim().toUpperCase()
  },
  {
    excelColumn: 'Mã KH',
    dbColumn: 'customerId',
    transformation: async (value) => {
      // Lookup customer by code
      const customer = await prisma.customer.findFirst({
        where: { customerCode: value.trim().toUpperCase() }
      });
      return customer?.id;
    },
    validation: (value) => value !== null
  },
  {
    excelColumn: 'Ngày đặt',
    dbColumn: 'createdAt',
    transformation: (value) => {
      // Excel date to JavaScript Date
      return excelDateToJSDate(value);
    }
  },
  {
    excelColumn: 'Trạng thái',
    dbColumn: 'status',
    transformation: (value) => {
      const statusMap = {
        'Nháp': 'DRAFT',
        'Đã xác nhận': 'CONFIRMED',
        'Đã hủy': 'CANCELLED'
      };
      return statusMap[value] || 'DRAFT';
    }
  }
];
```

### 3.3 Shipment Data

#### Excel Structure
```
Shipments.xlsx:
- Số vận đơn (Shipment Number)
- Số đơn (Order Number)
- Ngày bắt đầu (Start Date)
- Ngày kết thúc (End Date)
- Điểm lấy hàng (Pickup Location)
- Điểm giao hàng (Delivery Location)
- Biển số xe (Vehicle Plate)
- Tài xế (Driver Name)
- Trạng thái (Status)
```

#### Database Mapping
```typescript
const shipmentMapping = [
  {
    excelColumn: 'Số vận đơn',
    dbColumn: 'shipmentNumber',
    transformation: (value) => value.trim().toUpperCase()
  },
  {
    excelColumn: 'Số đơn',
    dbColumn: 'orderId',
    transformation: async (value) => {
      const order = await prisma.order.findFirst({
        where: { orderNumber: value.trim().toUpperCase() }
      });
      return order?.id;
    }
  },
  {
    excelColumn: 'Trạng thái',
    dbColumn: 'currentStatus',
    transformation: (value) => {
      const statusMap = {
        'Nháp': 'DRAFT',
        'Sẵn sàng': 'READY',
        'Đã phân xe': 'ASSIGNED',
        'Đang vận chuyển': 'IN_TRANSIT',
        'Hoàn thành': 'COMPLETED',
        'Đã hủy': 'CANCELLED'
      };
      return statusMap[value] || 'DRAFT';
    }
  }
];

// Shipment Stops (derived from pickup/delivery locations)
const createShipmentStops = async (shipmentId: string, row: any) => {
  const stops = [];
  
  // Stop 1: Pickup
  if (row['Điểm lấy hàng']) {
    stops.push({
      shipmentId,
      sequence: 1,
      stopType: 'PICKUP',
      locationName: row['Điểm lấy hàng'],
      address: row['Địa chỉ lấy hàng'] || row['Điểm lấy hàng'],
      plannedArrival: row['Ngày bắt đầu'],
      plannedDeparture: addHours(row['Ngày bắt đầu'], 1)
    });
  }
  
  // Stop 2: Delivery
  if (row['Điểm giao hàng']) {
    stops.push({
      shipmentId,
      sequence: 2,
      stopType: 'DROPOFF',
      locationName: row['Điểm giao hàng'],
      address: row['Địa chỉ giao hàng'] || row['Điểm giao hàng'],
      plannedArrival: row['Ngày kết thúc'],
      plannedDeparture: addHours(row['Ngày kết thúc'], 1)
    });
  }
  
  return stops;
};
```

### 3.4 Vehicle & Driver Data

#### Excel Structure
```
Vehicles.xlsx:
- Biển số (License Plate)
- Loại xe (Vehicle Type)
- Tải trọng (Capacity Weight)
- Thể tích (Capacity Volume)
- Trạng thái (Status)

Drivers.xlsx:
- Mã tài xế (Driver Code)
- Họ tên (Full Name)
- Số điện thoại (Phone)
- GPLX (License Number)
- Ngày hết hạn GPLX (License Expiry)
- Trạng thái (Status)
```

#### Database Mapping
```typescript
const vehicleMapping = [
  {
    excelColumn: 'Biển số',
    dbColumn: 'licensePlate',
    transformation: (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  },
  {
    excelColumn: 'Loại xe',
    dbColumn: 'vehicleType',
    transformation: (value) => {
      const typeMap = {
        'Xe tải 1 tấn': 'TRUCK_1T',
        'Xe tải 3 tấn': 'TRUCK_3T',
        'Xe tải 5 tấn': 'TRUCK_5T',
        'Xe tải 10 tấn': 'TRUCK_10T',
        'Xe container': 'CONTAINER_TRUCK'
      };
      return typeMap[value] || 'CONTAINER_TRUCK';
    }
  }
];

const driverMapping = [
  {
    excelColumn: 'Mã tài xế',
    dbColumn: 'driverCode',
    transformation: (value) => value.trim().toUpperCase()
  },
  {
    excelColumn: 'Số điện thoại',
    dbColumn: 'phone',
    transformation: (value) => value.replace(/[^0-9]/g, ''),
    validation: (value) => value.length === 10
  }
];
```

---

## 4. Migration Scripts

### 4.1 Data Extraction

```typescript
// scripts/migration/extract.ts
import XLSX from 'xlsx';
import fs from 'fs';

interface ExcelData {
  customers: any[];
  orders: any[];
  shipments: any[];
  vehicles: any[];
  drivers: any[];
}

export const extractExcelData = (excelDir: string): ExcelData => {
  console.log('📂 Extracting data from Excel files...');
  
  const data: ExcelData = {
    customers: [],
    orders: [],
    shipments: [],
    vehicles: [],
    drivers: []
  };
  
  // Extract Customers
  const customersWorkbook = XLSX.readFile(`${excelDir}/Customers.xlsx`);
  const customersSheet = customersWorkbook.Sheets[customersWorkbook.SheetNames[0]];
  data.customers = XLSX.utils.sheet_to_json(customersSheet);
  console.log(`✅ Extracted ${data.customers.length} customers`);
  
  // Extract Orders
  const ordersWorkbook = XLSX.readFile(`${excelDir}/Orders.xlsx`);
  const ordersSheet = ordersWorkbook.Sheets[ordersWorkbook.SheetNames[0]];
  data.orders = XLSX.utils.sheet_to_json(ordersSheet);
  console.log(`✅ Extracted ${data.orders.length} orders`);
  
  // Extract Shipments
  const shipmentsWorkbook = XLSX.readFile(`${excelDir}/Shipments.xlsx`);
  const shipmentsSheet = shipmentsWorkbook.Sheets[shipmentsWorkbook.SheetNames[0]];
  data.shipments = XLSX.utils.sheet_to_json(shipmentsSheet);
  console.log(`✅ Extracted ${data.shipments.length} shipments`);
  
  // Extract Vehicles
  const vehiclesWorkbook = XLSX.readFile(`${excelDir}/Vehicles.xlsx`);
  const vehiclesSheet = vehiclesWorkbook.Sheets[vehiclesWorkbook.SheetNames[0]];
  data.vehicles = XLSX.utils.sheet_to_json(vehiclesSheet);
  console.log(`✅ Extracted ${data.vehicles.length} vehicles`);
  
  // Extract Drivers
  const driversWorkbook = XLSX.readFile(`${excelDir}/Drivers.xlsx`);
  const driversSheet = driversWorkbook.Sheets[driversWorkbook.SheetNames[0]];
  data.drivers = XLSX.utils.sheet_to_json(driversSheet);
  console.log(`✅ Extracted ${data.drivers.length} drivers`);
  
  // Save extracted data as JSON for validation
  fs.writeFileSync(
    `${excelDir}/extracted_data.json`,
    JSON.stringify(data, null, 2)
  );
  
  return data;
};
```

### 4.2 Data Validation

```typescript
// scripts/migration/validate.ts
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  entity: string;
  row: number;
  field: string;
  value: any;
  message: string;
}

interface ValidationWarning {
  entity: string;
  row: number;
  field: string;
  message: string;
}

export const validateData = (data: ExcelData): ValidationResult => {
  console.log('🔍 Validating extracted data...');
  
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Validate Customers
  data.customers.forEach((customer, index) => {
    // Required fields
    if (!customer['Tên KH']) {
      result.errors.push({
        entity: 'Customer',
        row: index + 2, // +2 for header and 0-index
        field: 'Tên KH',
        value: customer['Tên KH'],
        message: 'Customer name is required'
      });
    }
    
    // Email format
    if (customer['Email'] && !isValidEmail(customer['Email'])) {
      result.errors.push({
        entity: 'Customer',
        row: index + 2,
        field: 'Email',
        value: customer['Email'],
        message: 'Invalid email format'
      });
    }
    
    // Phone format
    if (customer['Điện thoại'] && !isValidPhone(customer['Điện thoại'])) {
      result.warnings.push({
        entity: 'Customer',
        row: index + 2,
        field: 'Điện thoại',
        message: 'Phone number format may be invalid'
      });
    }
  });
  
  // Validate Orders
  data.orders.forEach((order, index) => {
    // Customer reference
    const customerExists = data.customers.some(
      c => c['Mã KH'] === order['Mã KH']
    );
    
    if (!customerExists) {
      result.errors.push({
        entity: 'Order',
        row: index + 2,
        field: 'Mã KH',
        value: order['Mã KH'],
        message: 'Customer not found'
      });
    }
    
    // Date validation
    if (!isValidDate(order['Ngày đặt'])) {
      result.errors.push({
        entity: 'Order',
        row: index + 2,
        field: 'Ngày đặt',
        value: order['Ngày đặt'],
        message: 'Invalid date format'
      });
    }
  });
  
  // Validate Shipments
  data.shipments.forEach((shipment, index) => {
    // Order reference
    const orderExists = data.orders.some(
      o => o['Số đơn'] === shipment['Số đơn']
    );
    
    if (!orderExists) {
      result.errors.push({
        entity: 'Shipment',
        row: index + 2,
        field: 'Số đơn',
        value: shipment['Số đơn'],
        message: 'Order not found'
      });
    }
    
    // Date range validation
    if (shipment['Ngày bắt đầu'] && shipment['Ngày kết thúc']) {
      const startDate = parseExcelDate(shipment['Ngày bắt đầu']);
      const endDate = parseExcelDate(shipment['Ngày kết thúc']);
      
      if (endDate < startDate) {
        result.errors.push({
          entity: 'Shipment',
          row: index + 2,
          field: 'Ngày kết thúc',
          value: shipment['Ngày kết thúc'],
          message: 'End date must be after start date'
        });
      }
    }
  });
  
  result.valid = result.errors.length === 0;
  
  console.log(`✅ Validation complete:`);
  console.log(`   - Errors: ${result.errors.length}`);
  console.log(`   - Warnings: ${result.warnings.length}`);
  
  return result;
};

// Helper functions
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

const isValidDate = (date: any): boolean => {
  return !isNaN(Date.parse(date)) || typeof date === 'number';
};

const parseExcelDate = (excelDate: any): Date => {
  if (typeof excelDate === 'number') {
    // Excel date (days since 1900-01-01)
    return new Date((excelDate - 25569) * 86400 * 1000);
  }
  return new Date(excelDate);
};
```

### 4.3 Data Transformation

```typescript
// scripts/migration/transform.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const transformAndLoad = async (data: ExcelData): Promise<void> => {
  console.log('🔄 Transforming and loading data...');
  
  try {
    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Migrate Customers
      console.log('📦 Migrating customers...');
      const customerMap = new Map<string, string>();
      
      for (const row of data.customers) {
        const customer = await tx.customer.create({
          data: {
            name: row['Tên KH'].trim(),
            email: row['Email']?.trim().toLowerCase() || null,
            phone: row['Điện thoại']?.replace(/[^0-9+]/g, '') || null,
            address: row['Địa chỉ']?.trim() || null
          }
        });
        
        customerMap.set(row['Mã KH'], customer.id);
      }
      console.log(`✅ Migrated ${customerMap.size} customers`);
      
      // 2. Migrate Orders
      console.log('📦 Migrating orders...');
      const orderMap = new Map<string, string>();
      
      for (const row of data.orders) {
        const customerId = customerMap.get(row['Mã KH']);
        
        if (!customerId) {
          console.warn(`⚠️  Skipping order ${row['Số đơn']}: Customer not found`);
          continue;
        }
        
        const order = await tx.order.create({
          data: {
            customerId,
            orderNumber: row['Số đơn'].trim().toUpperCase(),
            description: row['Mô tả']?.trim() || null,
            totalWeight: parseFloat(row['Trọng lượng']) || null,
            totalVolume: parseFloat(row['Thể tích']) || null,
            specialInstructions: row['Ghi chú']?.trim() || null,
            status: mapOrderStatus(row['Trạng thái']),
            createdAt: parseExcelDate(row['Ngày đặt'])
          }
        });
        
        orderMap.set(row['Số đơn'], order.id);
      }
      console.log(`✅ Migrated ${orderMap.size} orders`);
      
      // 3. Migrate Vehicles
      console.log('📦 Migrating vehicles...');
      const vehicleMap = new Map<string, string>();
      
      for (const row of data.vehicles) {
        const vehicle = await tx.vehicle.create({
          data: {
            licensePlate: row['Biển số'].trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
            vehicleType: mapVehicleType(row['Loại xe']),
            capacityWeight: parseFloat(row['Tải trọng']) || null,
            capacityVolume: parseFloat(row['Thể tích']) || null,
            status: mapVehicleStatus(row['Trạng thái'])
          }
        });
        
        vehicleMap.set(row['Biển số'], vehicle.id);
      }
      console.log(`✅ Migrated ${vehicleMap.size} vehicles`);
      
      // 4. Create default admin user for drivers
      const adminUser = await tx.user.create({
        data: {
          email: 'admin@unicon.ltd',
          passwordHash: await hashPassword('ChangeMe123!'),
          fullName: 'System Admin',
          role: 'ADMIN'
        }
      });
      
      // 5. Migrate Drivers
      console.log('📦 Migrating drivers...');
      const driverMap = new Map<string, string>();
      
      for (const row of data.drivers) {
        // Create user account for driver
        const driverUser = await tx.user.create({
          data: {
            email: `${row['Mã tài xế'].toLowerCase()}@unicon.ltd`,
            passwordHash: await hashPassword('Driver123!'), // Temporary password
            fullName: row['Họ tên'].trim(),
            role: 'DRIVER'
          }
        });
        
        const driver = await tx.driver.create({
          data: {
            userId: driverUser.id,
            driverCode: row['Mã tài xế'].trim().toUpperCase(),
            fullName: row['Họ tên'].trim(),
            phone: row['Số điện thoại'].replace(/[^0-9]/g, ''),
            licenseNumber: row['GPLX']?.trim() || null,
            licenseExpiry: row['Ngày hết hạn GPLX'] 
              ? parseExcelDate(row['Ngày hết hạn GPLX'])
              : null,
            status: mapDriverStatus(row['Trạng thái'])
          }
        });
        
        driverMap.set(row['Mã tài xế'], driver.id);
      }
      console.log(`✅ Migrated ${driverMap.size} drivers`);
      
      // 6. Migrate Shipments
      console.log('📦 Migrating shipments...');
      let shipmentCount = 0;
      
      for (const row of data.shipments) {
        const orderId = orderMap.get(row['Số đơn']);
        
        if (!orderId) {
          console.warn(`⚠️  Skipping shipment ${row['Số vận đơn']}: Order not found`);
          continue;
        }
        
        // Create shipment
        const shipment = await tx.shipment.create({
          data: {
            orderId,
            shipmentNumber: row['Số vận đơn'].trim().toUpperCase(),
            currentStatus: mapShipmentStatus(row['Trạng thái']),
            priority: 'NORMAL',
            plannedStartDate: parseExcelDate(row['Ngày bắt đầu']),
            plannedEndDate: parseExcelDate(row['Ngày kết thúc']),
            actualStartDate: row['Ngày bắt đầu thực tế'] 
              ? parseExcelDate(row['Ngày bắt đầu thực tế'])
              : null,
            actualEndDate: row['Ngày kết thúc thực tế']
              ? parseExcelDate(row['Ngày kết thúc thực tế'])
              : null
          }
        });
        
        // Create shipment stops
        const stops = [];
        
        if (row['Điểm lấy hàng']) {
          stops.push({
            shipmentId: shipment.id,
            sequence: 1,
            stopType: 'PICKUP',
            locationName: row['Điểm lấy hàng'].trim(),
            address: row['Địa chỉ lấy hàng']?.trim() || row['Điểm lấy hàng'].trim(),
            plannedArrival: parseExcelDate(row['Ngày bắt đầu']),
            plannedDeparture: addHours(parseExcelDate(row['Ngày bắt đầu']), 1)
          });
        }
        
        if (row['Điểm giao hàng']) {
          stops.push({
            shipmentId: shipment.id,
            sequence: 2,
            stopType: 'DROPOFF',
            locationName: row['Điểm giao hàng'].trim(),
            address: row['Địa chỉ giao hàng']?.trim() || row['Điểm giao hàng'].trim(),
            plannedArrival: parseExcelDate(row['Ngày kết thúc']),
            plannedDeparture: addHours(parseExcelDate(row['Ngày kết thúc']), 1)
          });
        }
        
        await tx.shipmentStop.createMany({ data: stops });
        
        // Create dispatch if vehicle and driver assigned
        if (row['Biển số xe'] && row['Tài xế']) {
          const vehicleId = vehicleMap.get(row['Biển số xe']);
          const driverId = driverMap.get(row['Mã tài xế']);
          
          if (vehicleId && driverId) {
            await tx.dispatch.create({
              data: {
                shipmentId: shipment.id,
                vehicleId,
                driverId,
                assignedBy: adminUser.id,
                assignedAt: shipment.createdAt
              }
            });
          }
        }
        
        // Create initial status event
        await tx.shipmentStatusEvent.create({
          data: {
            shipmentId: shipment.id,
            status: shipment.currentStatus,
            eventType: 'STATUS_CHANGE',
            description: 'Migrated from Excel',
            createdBy: adminUser.id,
            createdAt: shipment.createdAt
          }
        });
        
        shipmentCount++;
      }
      console.log(`✅ Migrated ${shipmentCount} shipments`);
    });
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Helper functions
const mapOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Nháp': 'DRAFT',
    'Đã xác nhận': 'CONFIRMED',
    'Đã hủy': 'CANCELLED'
  };
  return statusMap[status] || 'DRAFT';
};

const mapShipmentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Nháp': 'DRAFT',
    'Sẵn sàng': 'READY',
    'Đã phân xe': 'ASSIGNED',
    'Đang vận chuyển': 'IN_TRANSIT',
    'Hoàn thành': 'COMPLETED',
    'Đã hủy': 'CANCELLED'
  };
  return statusMap[status] || 'DRAFT';
};

const mapVehicleType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'Xe tải 1 tấn': 'TRUCK_1T',
    'Xe tải 3 tấn': 'TRUCK_3T',
    'Xe tải 5 tấn': 'TRUCK_5T',
    'Xe tải 10 tấn': 'TRUCK_10T',
    'Xe container': 'CONTAINER_TRUCK'
  };
  return typeMap[type] || 'CONTAINER_TRUCK';
};

const mapVehicleStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Sẵn sàng': 'AVAILABLE',
    '
