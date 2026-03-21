# 📚 Hướng dẫn Migration Dữ liệu - Đầy đủ

## 🎯 Tổng quan

Hệ thống migration dữ liệu cho phép bạn:
1. ✅ Extract dữ liệu từ Excel → JSON
2. ✅ Lưu trữ JSON để phát triển tính năng
3. ✅ Migrate JSON → PostgreSQL Database

## 📊 Dữ liệu

### Tổng quan Excel File

**File:** `uploads/Quản lý đội xe vận tải.xlsx`

| Sheet | Rows | Status | JSON File |
|-------|------|--------|-----------|
| Thông tin khách hàng | 34 | ✅ Migrated | customers.json |
| Thông tin xe | 51 | ✅ Migrated | vehicles.json |
| Thông tin tài xế | 19 | ✅ Migrated | drivers.json |
| Thông tin đơn hàng | 2,303 | 📦 Extracted | orders.json |
| Quản lý xăng dầu | 495 | 📦 Extracted | fuel_logs.json |
| Thông tin sửa chữa xe | 353 | 📦 Extracted | maintenance_logs.json |
| Danh sách địa điểm | 161 | 📦 Extracted | locations.json |
| Khoảng cách | 12 | 📦 Extracted | distances.json |
| Giá cước vận chuyển | 10 | 📦 Extracted | freight_rates.json |
| **TOTAL** | **3,438** | | |

**Legend:**
- ✅ Migrated: Đã có script migrate vào DB
- 📦 Extracted: Đã extract ra JSON, chưa migrate vào DB

## 🚀 Workflow

### Option 1: Direct Migration (Excel → DB)

Migrate trực tiếp từ Excel vào Database (chỉ customers, vehicles, drivers):

```bash
# Bước 1: Kiểm tra cấu trúc Excel
npm run verify:excel

# Bước 2: Migrate vào DB
npm run migrate:excel
```

**Ưu điểm:**
- ✅ Nhanh, đơn giản
- ✅ Phù hợp cho migration lần đầu

**Nhược điểm:**
- ❌ Chỉ migrate 3 sheets (customers, vehicles, drivers)
- ❌ Không lưu trữ data để phát triển sau

### Option 2: Two-Step Migration (Excel → JSON → DB) ⭐ Recommended

Extract ra JSON trước, sau đó migrate từ JSON:

```bash
# Bước 1: Extract tất cả data từ Excel ra JSON
npm run extract:json

# Bước 2: Review JSON files
ls -la data/

# Bước 3: Migrate từ JSON vào DB
npm run migrate:json              # Migrate tất cả
npm run migrate:json -- customers # Migrate chỉ customers
npm run migrate:json -- vehicles  # Migrate chỉ vehicles
npm run migrate:json -- drivers   # Migrate chỉ drivers
```

**Ưu điểm:**
- ✅ Extract tất cả 9 sheets ra JSON
- ✅ Lưu trữ data để phát triển tính năng sau
- ✅ Dễ dàng review và modify data
- ✅ Có thể dùng JSON cho testing
- ✅ Backup data ở dạng readable format

**Nhược điểm:**
- ❌ Cần 2 bước thay vì 1

## 📝 Chi tiết Commands

### 1. Verify Excel Structure

```bash
npm run verify:excel
```

**Output:**
```
📊 Excel File Structure Verification
📁 File: /path/to/uploads/Quản lý đội xe vận tải.xlsx
✅ File loaded successfully
📋 Total sheets: 9

================================================================================
Sheet 1: Thông tin khách hàng
================================================================================
📊 Total rows: 34
📋 Columns (11):
   1. Tên khách hàng
   2. Mô tả sơ bộ
   ...
```

### 2. Extract to JSON

```bash
npm run extract:json
```

**Output:**
```
🚀 Starting data extraction from Excel to JSON...
📁 Reading Excel file: /path/to/file.xlsx
📊 Found 9 sheets

1️⃣  Extracting customers...
✅ Saved 34 records to customers.json

2️⃣  Extracting vehicles...
✅ Saved 51 records to vehicles.json

...

✅ Extraction completed successfully!
📊 Summary:
   Total sheets extracted: 9
   Total rows extracted: 3438
   Output directory: /path/to/data
```

**Generated files:**
```
data/
├── customers.json          (34 records)
├── vehicles.json           (51 records)
├── drivers.json            (19 records)
├── orders.json             (2,303 records)
├── freight_rates.json      (10 records)
├── maintenance_logs.json   (353 records)
├── distances.json          (12 records)
├── fuel_logs.json          (495 records)
├── locations.json          (161 records)
└── metadata.json           (extraction info)
```

### 3. Migrate from JSON

```bash
# Migrate tất cả
npm run migrate:json

# Migrate từng loại
npm run migrate:json -- customers
npm run migrate:json -- vehicles
npm run migrate:json -- drivers
```

**Output:**
```
🚀 Starting data migration from JSON to PostgreSQL...
📁 Reading from: /path/to/data

📋 Migrating Customers from JSON...
Found 34 customers
✅ Created customer: CTY CỔ PHẦN MACSTAR HCM
⏭️  Customer already exists: Chuyển Rỗng MacStar
...
✨ Customers migration complete: 30 created, 4 skipped

✅ Migration completed successfully!
```

### 4. Direct Excel Migration

```bash
npm run migrate:excel
```

**Output:**
```
🚀 Starting data migration from Excel to PostgreSQL...
📁 Reading Excel file: /path/to/file.xlsx

📋 Migrating Customers...
Found 34 customers in Excel
✅ Created customer: CTY CỔ PHẦN MACSTAR HCM
...

🚛 Migrating Vehicles...
...

👨‍✈️ Migrating Drivers...
...

✅ Migration completed successfully!
```

## 📂 File Structure

```
unicon_schedule/
├── uploads/
│   └── Quản lý đội xe vận tải.xlsx    # Source Excel file
│
├── data/                               # Extracted JSON files
│   ├── customers.json
│   ├── vehicles.json
│   ├── drivers.json
│   ├── orders.json
│   ├── freight_rates.json
│   ├── maintenance_logs.json
│   ├── distances.json
│   ├── fuel_logs.json
│   ├── locations.json
│   ├── metadata.json
│   ├── .gitignore                     # Ignore JSON files
│   └── README.md
│
├── scripts/
│   ├── verify-excel-structure.ts      # Verify Excel
│   ├── extract-all-data-to-json.ts    # Excel → JSON
│   ├── migrate-from-json.ts           # JSON → DB
│   ├── migrate-excel-data.ts          # Excel → DB (direct)
│   ├── tsconfig.json
│   ├── MIGRATION_README.md
│   └── QUICK_START.md
│
├── docs/
│   └── DATA_MIGRATION_GUIDE.md        # This file
│
├── schema.prisma                       # Database schema
├── package.json                        # NPM scripts
└── README_MIGRATION.md                 # Migration overview
```

## 🔍 Kiểm tra kết quả

### Sử dụng Prisma Studio

```bash
npx prisma studio
```

Mở browser tại `http://localhost:5555` để xem dữ liệu.

### Sử dụng SQL

```bash
# Connect to database
psql -d your_database

# Check counts
SELECT 'customers' as table, COUNT(*) FROM customers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers;

# View sample data
SELECT * FROM customers LIMIT 5;
SELECT * FROM vehicles LIMIT 5;
SELECT * FROM drivers LIMIT 5;
```

### Sử dụng JSON files

```bash
# View JSON files
cat data/customers.json | jq '.[0]'
cat data/orders.json | jq 'length'
cat data/metadata.json | jq '.sheets'
```

## 💡 Use Cases cho JSON Files

### 1. Frontend Development

Dùng JSON files để mock data khi develop frontend:

```typescript
// src/mockData/customers.ts
import customersData from '../../data/customers.json';

export const mockCustomers = customersData.map(customer => ({
  id: generateId(),
  name: customer['Tên khách hàng'],
  email: generateEmail(customer['Tên khách hàng']),
  // ... transform data
}));
```

### 2. Testing

Dùng JSON files cho unit tests:

```typescript
// tests/customer.test.ts
import customersData from '../data/customers.json';

describe('Customer Service', () => {
  it('should parse customer data correctly', () => {
    const customer = customersData[0];
    const parsed = parseCustomer(customer);
    expect(parsed.name).toBe('CTY CỔ PHẦN MACSTAR HCM');
  });
});
```

### 3. Data Analysis

Analyze data trước khi migrate:

```bash
# Count customers by status
cat data/customers.json | jq '[.[] | .["Trạng thái"]] | group_by(.) | map({status: .[0], count: length})'

# Find customers with VAT
cat data/customers.json | jq '[.[] | select(.VAT == "Có")] | length'

# List all vehicle types
cat data/vehicles.json | jq '[.[] | .["Loại"]] | unique'
```

### 4. Documentation

Generate documentation từ data:

```bash
# List all customers
cat data/customers.json | jq -r '.[] | .["Tên khách hàng"]' > docs/customer-list.txt

# Export to CSV
cat data/customers.json | jq -r '.[] | [.["Tên khách hàng"], .["SĐT"], .["VAT"]] | @csv' > customers.csv
```

## 🔄 Phát triển tính năng mới

### Ví dụ: Migrate Orders (Đơn hàng)

**Bước 1:** Review data structure

```bash
cat data/orders.json | jq '.[0]'
```

**Bước 2:** Tạo migration function trong `migrate-from-json.ts`

```typescript
async function migrateOrders() {
  console.log('\n📦 Migrating Orders from JSON...');
  const data = readJsonFile('orders.json');
  
  for (const row of data) {
    // 1. Find customer
    const customerName = row['Khách hàng'];
    const customer = await prisma.customer.findFirst({
      where: { name: { contains: customerName } }
    });
    
    if (!customer) {
      console.log(`⚠️  Customer not found: ${customerName}`);
      continue;
    }
    
    // 2. Create order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: row['Mã đơn hàng'],
        description: row['Tuyến đường'],
        status: 'CONFIRMED',
      }
    });
    
    // 3. Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        shipmentNumber: row['Mã đơn hàng'],
        plannedStartDate: new Date(row['Ngày']),
        plannedEndDate: new Date(row['Ngày']),
        currentStatus: 'COMPLETED',
        priority: 'NORMAL',
      }
    });
    
    // 4. Create stops
    await prisma.shipmentStop.create({
      data: {
        shipmentId: shipment.id,
        sequence: 1,
        stopType: 'PICKUP',
        locationName: row['Nơi lấy'],
        address: row['Nơi lấy'],
        plannedArrival: new Date(row['Ngày']),
        plannedDeparture: new Date(row['Ngày']),
      }
    });
    
    await prisma.shipmentStop.create({
      data: {
        shipmentId: shipment.id,
        sequence: 2,
        stopType: 'DROPOFF',
        locationName: row['Nơi hạ'],
        address: row['Nơi hạ'],
        plannedArrival: new Date(row['Ngày']),
        plannedDeparture: new Date(row['Ngày']),
      }
    });
    
    console.log(`✅ Created order: ${row['Mã đơn hàng']}`);
  }
}
```

**Bước 3:** Add to main() function

```typescript
case 'orders':
  await migrateOrders();
  break;
```

**Bước 4:** Run migration

```bash
npm run migrate:json -- orders
```

## ⚠️ Lưu ý quan trọng

### 1. Data Security

- ✅ JSON files chứa dữ liệu nhạy cảm
- ✅ Đã được exclude khỏi git (`.gitignore`)
- ⚠️  KHÔNG commit JSON files lên repository
- ⚠️  KHÔNG share JSON files publicly

### 2. Idempotent Migration

- ✅ Scripts có thể chạy nhiều lần an toàn
- ✅ Sẽ skip records đã tồn tại
- ✅ Không duplicate data

### 3. Data Validation

- ✅ Records thiếu thông tin bắt buộc sẽ bị skip
- ✅ Có warning logs cho invalid data
- ✅ Migration không fail nếu có lỗi ở 1 record

### 4. Performance

- ⚠️  Migration lớn (orders: 2,303 records) có thể mất vài phút
- 💡 Có thể batch process nếu cần
- 💡 Có thể add progress bar nếu cần

## 🐛 Troubleshooting

### Lỗi: "Data directory not found"

```bash
# Chạy extract trước
npm run extract:json
```

### Lỗi: "JSON file not found"

```bash
# Kiểm tra files
ls -la data/

# Re-extract nếu cần
npm run extract:json
```

### Lỗi: "Database connection error"

```bash
# Check DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull

# Regenerate client
npx prisma generate
```

### Lỗi: "Duplicate key error"

```bash
# Clear existing data (cẩn thận!)
npx prisma studio

# Hoặc dùng SQL
psql -d your_database -c "TRUNCATE customers CASCADE;"
```

## 📊 Roadmap

### Phase 1: ✅ Complete
- [x] Extract all data to JSON
- [x] Migrate customers
- [x] Migrate vehicles
- [x] Migrate drivers

### Phase 2: 🚧 In Progress
- [ ] Migrate orders (2,303 records)
- [ ] Create schema for fuel logs
- [ ] Create schema for maintenance logs

### Phase 3: 📋 Planned
- [ ] Migrate fuel logs
- [ ] Migrate maintenance logs
- [ ] Migrate locations
- [ ] Migrate distances
- [ ] Migrate freight rates

### Phase 4: 🎯 Future
- [ ] Add data validation
- [ ] Add progress bars
- [ ] Add rollback functionality
- [ ] Add incremental migration
- [ ] Add data transformation pipeline

## 📞 Support

Xem thêm documentation:
- [README_MIGRATION.md](../README_MIGRATION.md) - Overview
- [scripts/MIGRATION_README.md](../scripts/MIGRATION_README.md) - Technical details
- [scripts/QUICK_START.md](../scripts/QUICK_START.md) - Quick start
- [data/README.md](../data/README.md) - Data directory info

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-06  
**Author:** Migration System
