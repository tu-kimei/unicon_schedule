# 🗑️ ORDER ENTITY REMOVAL - SUMMARY

**Ngày thực hiện:** 12/02/2026  
**Lý do:** Đơn giản hóa workflow theo PRD - Customer tạo Shipment trực tiếp

---

## 📋 TỔNG QUAN THAY ĐỔI

### Mục tiêu
Xóa Order entity khỏi hệ thống và cho phép Customer tạo Shipment trực tiếp, phù hợp với PRD Flow #1 & #2.

### Workflow cũ (có Order)
```
Customer → Order (DRAFT → CONFIRMED) → Shipment → Dispatch → Complete
```

### Workflow mới (không Order)
```
Option 1: Customer → Shipment (DRAFT) → OPS confirm → Dispatch → Complete
Option 2: Điều xe → Shipment (ASSIGNED) + Dispatch → Complete
```

---

## ✅ CÁC FILE ĐÃ THAY ĐỔI

### 1. Database Schema
**File:** `/schema.prisma`

**Thay đổi:**
- ❌ Xóa `enum OrderStatus { DRAFT, CONFIRMED, CANCELLED }`
- ❌ Xóa `model Order { ... }`
- ✅ Update `model Customer`:
  - Xóa: `orders Order[]`
  - Thêm: `shipments Shipment[]`
- ✅ Update `model Shipment`:
  - Xóa: `orderId String`
  - Xóa: `order Order @relation(...)`
  - Thêm: `customerId String`
  - Thêm: `customer Customer @relation(...)`
  - Thêm index: `@@index([customerId, currentStatus])`

**Migration SQL:**
```sql
-- File: /migrations/remove_order_entity.sql
ALTER TABLE shipments ADD COLUMN "customerId" TEXT;
UPDATE shipments s SET "customerId" = o."customerId" FROM orders o WHERE s."orderId" = o.id;
ALTER TABLE shipments ALTER COLUMN "customerId" SET NOT NULL;
ALTER TABLE shipments ADD CONSTRAINT "shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES customers(id);
CREATE INDEX "shipments_customerId_currentStatus_idx" ON shipments("customerId", "currentStatus");
ALTER TABLE shipments DROP COLUMN "orderId";
DROP TABLE IF EXISTS orders;
DROP TYPE IF EXISTS "OrderStatus";
```

---

### 2. Wasp Configuration
**File:** `/main.wasp`

**Thay đổi:**
- ❌ Xóa query `getAvailableOrders`
- ✅ Update query `getAllShipments`:
  - Thêm entity: `Customer`
- ✅ Update query `getShipment`:
  - Thêm entity: `Customer`
- ✅ Update action `createShipment`:
  - Thêm entity: `Customer`
- ✅ Update action `updateShipment`:
  - Thêm entity: `Customer`
- ✅ Update action `deleteCustomer`:
  - Xóa entity: `Order`
  - Thêm entity: `Shipment`

---

### 3. Backend Queries
**File:** `/src/logistics/queries/shipments.ts`

**Thay đổi:**
- ✅ `getAllShipments`:
  - Xóa: `order: { include: { customer: true } }`
  - Thêm: `customer: true`
- ✅ `getShipment`:
  - Xóa: `order: { include: { customer: true } }`
  - Thêm: `customer: true`

**File:** `/src/logistics/queries/orders.ts`
- ❌ **XÓA FILE** - Không còn cần thiết

---

### 4. Backend Actions
**File:** `/src/logistics/actions/shipments.ts`

**Thay đổi:**
- ✅ `CreateShipmentInput` interface:
  - Xóa: `orderId: string`
  - Thêm: `customerId: string`
  
- ✅ `createShipment` function:
  - Xóa validation: Order exists & confirmed
  - Thêm validation: Customer exists & active
  - Xóa: `orderId: args.orderId`
  - Thêm: `customerId: args.customerId`
  - Thêm include: `customer: true`
  - Update permissions: Thêm `DISPATCHER`

**Code changes:**
```typescript
// BEFORE
interface CreateShipmentInput {
  orderId: string;
  // ...
}

const order = await context.entities.Order.findUnique({
  where: { id: args.orderId }
});
if (!order || order.status !== 'CONFIRMED') {
  throw new Error('Order must be confirmed');
}

// AFTER
interface CreateShipmentInput {
  customerId: string;
  // ...
}

const customer = await context.entities.Customer.findUnique({
  where: { id: args.customerId }
});
if (!customer || customer.status !== 'ACTIVE') {
  throw new Error('Customer must be active');
}
```

---

### 5. Frontend Pages

#### **File:** `/src/logistics/pages/CreateShipmentPage.tsx`

**Thay đổi:**
- ✅ Import:
  - Xóa: `getAvailableOrders`
  - Thêm: `getAllCustomers`
  
- ✅ Interface:
  - Xóa: `interface Order { ... }`
  - Thêm: `interface Customer { id, name, email, status }`
  - Update `CreateShipmentForm`:
    - Xóa: `orderId: string`
    - Thêm: `customerId: string`

- ✅ State & Query:
  - Xóa: `const { data: orders } = useQuery(getAvailableOrders)`
  - Thêm: `const { data: customers } = useQuery(getAllCustomers)`
  - Update form state: `customerId: ''`

- ✅ Validation:
  - Update: `form.customerId` thay vì `form.orderId`

- ✅ UI - Basic Info Step:
  - Xóa: Order dropdown
  - Thêm: Customer dropdown với filter ACTIVE customers
  - Label: "Customer *"
  - Help text: "Select the customer for this shipment"

- ✅ UI - Review Step:
  - Xóa: `selectedOrder`
  - Thêm: `selectedCustomer`
  - Display: Customer name & email thay vì Order number

---

#### **File:** `/src/logistics/components/ShipmentCard.tsx`

**Thay đổi:**
- ✅ Interface:
  - Xóa: `order: { customer: { name: string } }`
  - Thêm: `customer: { name: string }`
  
- ✅ Display:
  - Xóa: `{shipment.order.customer.name}`
  - Thêm: `{shipment.customer.name}`

---

#### **File:** `/src/logistics/pages/DispatcherDashboardPage.tsx`

**Thay đổi:**
- ✅ Display (2 locations):
  - Xóa: `{shipment.order.customer.name}`
  - Thêm: `{shipment.customer.name}`

---

#### **File:** `/src/logistics/pages/ShipmentDetailsPage.tsx`

**Thay đổi:**
- ✅ Header display:
  - Xóa: `Order: {shipment.order.orderNumber} - {shipment.order.customer.name}`
  - Thêm: `Customer: {shipment.customer.name}`

---

### 6. Documentation

#### **File:** `/docs/01_core/08_ERD.md`

**Thay đổi:**
- ✅ Version: 2.0 → 2.1
- ❌ Xóa Order entity từ Mermaid diagram
- ❌ Xóa Order entity description (section 3)
- ❌ Xóa OrderStatus enum
- ✅ Update Shipment entity:
  - `orderId FK` → `customerId FK`
  - Thêm workflow description
- ✅ Update relationships:
  - Xóa: `Customer → Order → Shipment`
  - Thêm: `Customer → Shipment (direct)`
- ✅ Update Core Workflows:
  - Workflow 1: Customer → Shipment (customerId)
  - Workflow 2: Internal → Shipment (customerId)
- ✅ Renumber entities: 14 → 13 entities
- ✅ Add version history v2.1

---

#### **File:** `/docs/05_planning/IMPLEMENTATION_PLAN.md`

**Đã update trước đó:**
- ✅ Version: 1.0 → 1.1
- ❌ Xóa "Order Management" module
- ✅ Thay bằng "Customer Shipment Creation"
- ✅ Update PHASE 1 tasks
- ✅ Update TODO list
- ✅ Update Core Flow mapping

---

### 7. Migration File
**File:** `/migrations/remove_order_entity.sql`

**Nội dung:**
- Tạo migration SQL script để:
  1. Add customerId column
  2. Migrate data từ orders
  3. Drop orderId column
  4. Drop orders table
  5. Drop OrderStatus enum
  6. Add indexes

---

## 🔍 FILES AFFECTED SUMMARY

### ✅ Modified (9 files)
1. `/schema.prisma` - Xóa Order model, update Shipment
2. `/main.wasp` - Xóa getAvailableOrders, update entities
3. `/src/logistics/queries/shipments.ts` - Update includes
4. `/src/logistics/actions/shipments.ts` - Update interface & validation
5. `/src/logistics/pages/CreateShipmentPage.tsx` - Customer selector
6. `/src/logistics/components/ShipmentCard.tsx` - Display customer
7. `/src/logistics/pages/DispatcherDashboardPage.tsx` - Display customer
8. `/src/logistics/pages/ShipmentDetailsPage.tsx` - Display customer
9. `/docs/01_core/08_ERD.md` - Remove Order, update workflows

### ❌ Deleted (1 file)
1. `/src/logistics/queries/orders.ts` - Không còn cần

### ✨ Created (1 file)
1. `/migrations/remove_order_entity.sql` - Migration script

---

## 🎯 NEXT STEPS

### 1. Run Database Migration
```bash
# Option 1: Using Wasp (recommended)
wasp db migrate-dev

# Option 2: Manual SQL
psql $DATABASE_URL -f migrations/remove_order_entity.sql
```

### 2. Test Workflow
```bash
# Start development server
wasp start

# Test cases:
# 1. Create shipment with customer selection
# 2. View shipment details (should show customer)
# 3. Dispatcher dashboard (should show customer)
# 4. Shipment list (should show customer)
```

### 3. Verify Changes
- [ ] Schema updated correctly
- [ ] Migration ran successfully
- [ ] No compilation errors
- [ ] UI displays customer correctly
- [ ] Create shipment workflow works
- [ ] All shipment queries work

---

## ⚠️ BREAKING CHANGES

### API Changes
- ❌ `getAvailableOrders` query - REMOVED
- ✅ `createShipment` action - Parameter changed: `orderId` → `customerId`
- ✅ `getAllShipments` response - Changed: `shipment.order.customer` → `shipment.customer`
- ✅ `getShipment` response - Changed: `shipment.order.customer` → `shipment.customer`

### Database Changes
- ❌ `orders` table - DROPPED
- ❌ `OrderStatus` enum - DROPPED
- ✅ `shipments.orderId` column - DROPPED
- ✅ `shipments.customerId` column - ADDED

### UI Changes
- ✅ CreateShipmentPage - Customer selector thay vì Order selector
- ✅ ShipmentCard - Display customer.name thay vì order.customer.name
- ✅ ShipmentDetailsPage - Display customer thay vì order
- ✅ DispatcherDashboard - Display customer thay vì order.customer

---

## 📊 IMPACT ANALYSIS

### Entities Affected
- ❌ Order (deleted)
- ✅ Shipment (updated - customerId)
- ✅ Customer (updated - shipments relation)

### Queries Affected
- ❌ getAvailableOrders (deleted)
- ✅ getAllShipments (updated)
- ✅ getShipment (updated)

### Actions Affected
- ✅ createShipment (updated)
- ✅ updateShipment (no change needed)

### Pages Affected
- ✅ CreateShipmentPage (major update)
- ✅ ShipmentDetailsPage (minor update)
- ✅ DispatcherDashboardPage (minor update)
- ✅ OpsShipmentsPage (no change - uses ShipmentCard)

### Components Affected
- ✅ ShipmentCard (minor update)

---

## 🧪 TESTING CHECKLIST

### Backend Testing
- [ ] Schema migration successful
- [ ] No orphaned data
- [ ] All foreign keys valid
- [ ] Indexes created correctly

### API Testing
- [ ] createShipment with customerId works
- [ ] getAllShipments returns customer data
- [ ] getShipment returns customer data
- [ ] Customer validation works

### UI Testing
- [ ] CreateShipmentPage loads
- [ ] Customer dropdown shows active customers
- [ ] Can create shipment with customer
- [ ] ShipmentDetailsPage shows customer
- [ ] DispatcherDashboard shows customer
- [ ] ShipmentCard displays correctly

### Integration Testing
- [ ] Complete workflow: Create → Dispatch → Complete
- [ ] Customer filter works
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🔄 ROLLBACK PLAN

Nếu cần rollback:

1. **Restore Order table:**
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "orderNumber" TEXT UNIQUE NOT NULL,
  -- ... other fields
);
```

2. **Restore Shipment.orderId:**
```sql
ALTER TABLE shipments ADD COLUMN "orderId" TEXT;
-- Manually map shipments back to orders
ALTER TABLE shipments DROP COLUMN "customerId";
```

3. **Restore code:**
```bash
git revert <commit-hash>
```

**Lưu ý:** Rollback sẽ mất dữ liệu nếu đã có shipments mới được tạo với customerId.

---

## 📈 BENEFITS

### 1. Đơn giản hóa
- ✅ Ít entities hơn (14 → 13)
- ✅ Ít bước trong workflow
- ✅ Code dễ maintain hơn

### 2. Phù hợp PRD
- ✅ PRD Flow #1: Customer tạo Shipment trực tiếp
- ✅ PRD Flow #2: Điều xe tạo Shipment cho customer
- ✅ Không có yêu cầu Order management

### 3. Performance
- ✅ Ít joins trong queries
- ✅ Faster shipment creation
- ✅ Simpler data model

### 4. User Experience
- ✅ Ít steps để tạo shipment
- ✅ Trực quan hơn (Customer → Shipment)
- ✅ Dễ hiểu hơn cho users

---

## 🎯 FUTURE CONSIDERATIONS

### Nếu cần Order sau này:
- Order model vẫn có thể được thêm lại
- Có thể dùng Order như "container" cho nhiều shipments
- Shipment.orderId có thể là optional
- Không ảnh hưởng đến workflow hiện tại

### Use cases cho Order (future):
- Nhóm nhiều shipments cùng một đơn hàng lớn
- Tracking theo order number của customer
- Billing theo order thay vì shipment

---

**Document Created:** 12/02/2026  
**Status:** Order entity successfully removed  
**Next Action:** Run database migration
