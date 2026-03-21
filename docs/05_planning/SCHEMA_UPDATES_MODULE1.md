# 📝 SCHEMA UPDATES - MODULE 1: CUSTOMER PORTAL

**Ngày:** 12/02/2026  
**Module:** Customer Portal - Shipment Creation  
**Status:** ✅ Schema updated & migrated successfully

---

## ✅ THAY ĐỔI ĐÃ THỰC HIỆN

### **1. Shipment Entity - 5 fields mới**

```prisma
model Shipment {
  // ... existing fields ...
  
  // ✨ NEW FIELDS for Customer Portal:
  createdById         String?        // Người tạo shipment
  createdByType       UserType?      // INTERNAL hoặc CUSTOMER
  specialInstructions String?        @db.Text // Yêu cầu đặc biệt
  containerNumber     String?        // Số container
  containerType       String?        // 20ft, 40ft, 40HC, etc.
  
  // Relations
  createdBy         User?  @relation("ShipmentCreatedBy", fields: [createdById], references: [id]) // ✨ NEW
  
  // Indexes
  @@index([createdById]) // ✨ NEW
}
```

**Mục đích:**
- `createdById` - Track ai tạo shipment (customer user hoặc internal user)
- `createdByType` - Phân biệt INTERNAL vs CUSTOMER creation
- `specialInstructions` - Customer có thể ghi yêu cầu đặc biệt
- `containerNumber` - Số container (nếu customer biết trước)
- `containerType` - Loại container (20ft, 40ft, 40HC, 45ft)

---

### **2. User Entity - 1 relation mới**

```prisma
model User {
  // ... existing relations ...
  
  createdShipments  Shipment[]  @relation("ShipmentCreatedBy") // ✨ NEW
}
```

**Mục đích:**
- Track tất cả shipments mà user này đã tạo
- Hữu ích cho audit trail và reporting

---

## 🗄️ DATABASE MIGRATION

### **Migration File:**
`/migrations/20260212_add_shipment_customer_fields/migration.sql`

### **SQL Executed:**
```sql
-- Add 5 new columns
ALTER TABLE "shipments" ADD COLUMN "createdById" TEXT;
ALTER TABLE "shipments" ADD COLUMN "createdByType" "UserType";
ALTER TABLE "shipments" ADD COLUMN "specialInstructions" TEXT;
ALTER TABLE "shipments" ADD COLUMN "containerNumber" TEXT;
ALTER TABLE "shipments" ADD COLUMN "containerType" TEXT;

-- Add foreign key
ALTER TABLE "shipments" 
ADD CONSTRAINT "shipments_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "users"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index
CREATE INDEX "shipments_createdById_idx" ON "shipments"("createdById");
```

### **Verification:**
```bash
✅ 5 columns added successfully
✅ Foreign key constraint created
✅ Index created
✅ No data loss
✅ Compilation successful
```

---

## 📊 SCHEMA SUMMARY CHO MODULE 1

### **Entities Involved:**
1. ✅ **Shipment** - Updated (5 new fields, 1 new relation, 1 new index)
2. ✅ **User** - Updated (1 new relation)
3. ✅ **Customer** - No changes (already has shipments relation)
4. ✅ **ShipmentStop** - No changes (already sufficient)

### **Enums Used:**
- ✅ `UserType` - INTERNAL, CUSTOMER (already exists)
- ✅ `ShipmentStatus` - DRAFT, READY, ASSIGNED, IN_TRANSIT, COMPLETED, CANCELLED
- ✅ `Priority` - LOW, NORMAL, HIGH, URGENT
- ✅ `StopType` - PICKUP, DROPOFF, DEPOT, PORT
- ✅ `UserRole` - CUSTOMER_OPS, CUSTOMER_OWNER

### **No New Entities Needed:**
- ✅ Customer Portal sử dụng entities hiện có
- ✅ Chỉ cần thêm fields vào Shipment
- ✅ Đơn giản và hiệu quả

---

## 🎯 READY FOR IMPLEMENTATION

### **Backend Ready:**
- ✅ Schema updated
- ✅ Migration applied
- ✅ Compilation successful
- ✅ No TypeScript errors

### **Next Steps:**
1. ⏳ Implement Customer Portal queries
2. ⏳ Implement Customer Portal actions
3. ⏳ Implement Customer Portal pages
4. ⏳ Implement Customer Portal components
5. ⏳ Update navigation
6. ⏳ Testing

---

## 📋 FIELDS USAGE GUIDE

### **createdById & createdByType:**
```typescript
// When customer creates shipment:
{
  createdById: user.id,           // Customer user ID
  createdByType: 'CUSTOMER',
  customerId: user.customerId
}

// When internal user creates shipment:
{
  createdById: user.id,           // Internal user ID
  createdByType: 'INTERNAL',
  customerId: selectedCustomer.id
}
```

### **specialInstructions:**
```typescript
// Customer can specify:
- "Cần bốc xếp cẩn thận - hàng dễ vỡ"
- "Giao hàng trước 5pm"
- "Liên hệ trước khi đến 30 phút"
- "Cần xe nâng tại điểm giao hàng"
```

### **containerNumber & containerType:**
```typescript
// Customer may know:
containerNumber: "TCLU1234567"
containerType: "40HC"  // 40ft High Cube

// Common types:
- "20ft" - 20 feet standard
- "40ft" - 40 feet standard
- "40HC" - 40 feet High Cube
- "45ft" - 45 feet
```

---

## 🔄 WORKFLOW ENABLED

### **Customer Creates Shipment:**
```
1. Customer login (CUSTOMER_OPS/CUSTOMER_OWNER)
2. Navigate to "Create Shipment Request"
3. Fill form:
   - Priority ✓
   - Planned dates ✓
   - Container info ✓ (NEW)
   - Special instructions ✓ (NEW)
   - Stops (pickup, dropoff) ✓
4. Submit → Shipment created with:
   - customerId: user.customerId ✓
   - createdById: user.id ✓ (NEW)
   - createdByType: 'CUSTOMER' ✓ (NEW)
   - status: DRAFT ✓
```

### **Internal Creates Shipment:**
```
1. OPS/DISPATCHER login
2. Navigate to "Create Shipment"
3. Select Customer ✓
4. Fill form (same as above)
5. Submit → Shipment created with:
   - customerId: selectedCustomer.id ✓
   - createdById: user.id ✓ (NEW)
   - createdByType: 'INTERNAL' ✓ (NEW)
   - status: DRAFT or ASSIGNED ✓
```

---

## 📊 CURRENT STATE

### **Database:**
```
✅ shipments table updated
✅ 5 new columns added
✅ Foreign key created
✅ Index created
✅ 3 existing shipments (createdById = NULL for now)
```

### **Code:**
```
✅ schema.prisma updated
✅ Compilation successful
✅ No errors
✅ Ready for backend implementation
```

---

## 🎯 READY FOR YOU TO REVIEW

**Bạn có thể:**
1. ✏️ Review schema changes trong `schema.prisma`
2. ✏️ Thêm/sửa fields nếu cần
3. ✏️ Thêm validation rules
4. ✏️ Thêm default values

**Khi bạn OK với schema, tôi sẽ:**
1. ✅ Implement Customer Portal backend
2. ✅ Implement Customer Portal frontend
3. ✅ Testing

---

**Schema đã sẵn sàng cho bạn review! Hãy cho tôi biết nếu cần thay đổi gì.** ✨