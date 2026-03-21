# ✅ SCHEMA UPDATES SUMMARY - PHASE 1 Entities

**Ngày:** 12/02/2026  
**Trạng thái:** ✅ **HOÀN THÀNH**  
**Mục đích:** Thêm entities cần thiết cho PHASE 1 (Customer Portal, Document Management, Charge & Invoice)

---

## 📊 TỔNG QUAN THAY ĐỔI

### Entities trước khi update: 10
1. User
2. Customer
3. Shipment
4. ShipmentStop
5. Vehicle
6. Driver
7. Dispatch
8. ShipmentStatusEvent
9. POD
10. Debt

### Entities sau khi update: 14 (+4)
1. User ✅ (updated)
2. Customer ✅ (updated)
3. Shipment ✅ (updated)
4. ShipmentStop ✅
5. Vehicle ✅
6. Driver ✅
7. Dispatch ✅
8. ShipmentStatusEvent ✅
9. POD ✅
10. Debt ✅ (updated)
11. **ShipmentDocument** ✨ (NEW)
12. **Charge** ✨ (NEW)
13. **Invoice** ✨ (NEW)
14. **InvoiceItem** ✨ (NEW)

### Enums trước: 11
### Enums sau: 14 (+3)
- **DocumentType** ✨ (NEW)
- **ChargeType** ✨ (NEW)
- **InvoiceStatus** ✨ (NEW)

---

## 🆕 ENTITIES MỚI

### 1. **ShipmentDocument** (Tài liệu Shipment)

**Mục đích:** Quản lý tài liệu liên quan đến shipment (booking, bill of lading, customs, etc.)

**Schema:**
```prisma
model ShipmentDocument {
  id           String       @id @default(uuid())
  shipmentId   String
  documentType DocumentType
  fileName     String
  filePath     String       // URL to cloud storage
  fileSize     Int          // bytes
  mimeType     String?      // image/jpeg, application/pdf
  
  // Verification
  isVerified   Boolean      @default(false)
  verifiedById String?
  verifiedAt   DateTime?
  
  // Metadata
  uploadedById String
  uploadedAt   DateTime     @default(now())
  notes        String?      @db.Text
  
  // Relations
  shipment     Shipment @relation(...)
  uploadedBy   User     @relation("DocumentUploadedBy", ...)
  verifiedBy   User?    @relation("DocumentVerifiedBy", ...)
}

enum DocumentType {
  BOOKING              // Booking confirmation
  BILL_OF_LADING       // Vận đơn
  CUSTOMS              // Giấy tờ hải quan
  DELIVERY_ORDER       // Lệnh giao hàng
  PACKING_LIST         // Packing list
  COMMERCIAL_INVOICE   // Commercial invoice
  OTHER                // Tài liệu khác
}
```

**Workflow:**
```
DISPATCHER upload document → ShipmentDocument (isVerified: false)
  ↓
OPS/ADMIN verify → ShipmentDocument (isVerified: true)
  ↓
CUSTOMER view & confirm → All documents verified
```

---

### 2. **Charge** (Chi phí)

**Mục đích:** Quản lý các khoản chi phí theo shipment

**Schema:**
```prisma
model Charge {
  id          String      @id @default(uuid())
  shipmentId  String
  chargeType  ChargeType
  description String?
  quantity    Int         @default(1)
  unitPrice   Decimal     @db.Decimal(15, 2)
  amount      Decimal     @db.Decimal(15, 2) // quantity * unitPrice
  currency    String      @default("VND")
  createdById String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  shipment    Shipment    @relation(...)
  createdBy   User        @relation("ChargeCreatedBy", ...)
  invoiceItem InvoiceItem?
}

enum ChargeType {
  FREIGHT          // Cước vận chuyển
  FUEL_SURCHARGE   // Phụ phí nhiên liệu
  DETENTION        // Phí lưu container
  DEMURRAGE        // Phí lưu bãi
  LOADING          // Phí bốc xếp
  UNLOADING        // Phí dỡ hàng
  CUSTOMS          // Phí hải quan
  TOLL_FEE         // Phí cầu đường
  PARKING          // Phí đỗ xe
  INSURANCE        // Phí bảo hiểm
  OTHER            // Chi phí khác
}
```

**Workflow:**
```
Shipment (COMPLETED)
  ↓ ACCOUNTING tạo charges
Charge (FREIGHT: 5,000,000 VND)
Charge (FUEL_SURCHARGE: 500,000 VND)
Charge (DETENTION: 200,000 VND)
  ↓ Total: 5,700,000 VND
```

---

### 3. **Invoice** (Hóa đơn)

**Mục đích:** Quản lý hóa đơn cho khách hàng

**Schema:**
```prisma
model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique // INV-2026-0001
  customerId      String
  shipmentId      String?       // Optional
  
  // Amounts
  subtotal        Decimal       @db.Decimal(15, 2)
  vatRate         Decimal       @db.Decimal(5, 2) @default(10.00)
  vatAmount       Decimal       @db.Decimal(15, 2)
  discount        Decimal       @db.Decimal(15, 2) @default(0)
  grandTotal      Decimal       @db.Decimal(15, 2)
  
  // Dates
  invoiceDate     DateTime      @default(now())
  dueDate         DateTime
  sentAt          DateTime?
  paidAt          DateTime?
  
  // Status & Files
  status          InvoiceStatus @default(DRAFT)
  pdfPath         String?
  
  // Payment info
  paymentMethod   String?
  paymentRef      String?
  
  // Notes
  notes           String?       @db.Text
  paymentTerms    String?
  
  // Metadata
  createdById     String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  customer        Customer      @relation(...)
  shipment        Shipment?     @relation(...)
  createdBy       User          @relation("InvoiceCreatedBy", ...)
  items           InvoiceItem[]
  debts           Debt[]
}

enum InvoiceStatus {
  DRAFT      // Nháp
  SENT       // Đã gửi
  PAID       // Đã thanh toán đủ
  PARTIAL    // Thanh toán một phần
  OVERDUE    // Quá hạn
  CANCELLED  // Đã hủy
}
```

**Workflow:**
```
Charges created
  ↓ ACCOUNTING generate invoice
Invoice (DRAFT)
  - subtotal: 5,700,000 VND
  - vatAmount: 570,000 VND (10%)
  - grandTotal: 6,270,000 VND
  ↓ Send to customer
Invoice (SENT)
  ↓ Customer pays / Overdue
Invoice (PAID / OVERDUE)
  ↓ If OVERDUE
Debt (auto-created)
```

---

### 4. **InvoiceItem** (Chi tiết hóa đơn)

**Mục đích:** Line items trong invoice

**Schema:**
```prisma
model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  chargeId    String?  @unique
  description String
  quantity    Int      @default(1)
  unitPrice   Decimal  @db.Decimal(15, 2)
  amount      Decimal  @db.Decimal(15, 2)
  
  // Relations
  invoice     Invoice  @relation(...)
  charge      Charge?  @relation(...)
}
```

**Example:**
```
Invoice INV-2026-0001:
  - Item 1: Cước vận chuyển (1 x 5,000,000 = 5,000,000)
  - Item 2: Phụ phí nhiên liệu (1 x 500,000 = 500,000)
  - Item 3: Phí lưu container (1 x 200,000 = 200,000)
  Subtotal: 5,700,000 VND
```

---

## 🔄 ENTITIES ĐÃ CẬP NHẬT

### 1. **Shipment** (Updated)

**Fields mới:**
```prisma
createdById         String?        // Người tạo
createdByType       UserType?      // INTERNAL/CUSTOMER
specialInstructions String?        // Yêu cầu đặc biệt
containerNumber     String?        // Số container
containerType       String?        // 20ft, 40ft, 40HC
```

**Relations mới:**
```prisma
createdBy   User?                @relation("ShipmentCreatedBy")
documents   ShipmentDocument[]
charges     Charge[]
invoices    Invoice[]
```

---

### 2. **User** (Updated)

**Relations mới:**
```prisma
createdShipments      Shipment[]           @relation("ShipmentCreatedBy")
uploadedDocuments     ShipmentDocument[]   @relation("DocumentUploadedBy")
verifiedDocuments     ShipmentDocument[]   @relation("DocumentVerifiedBy")
createdCharges        Charge[]             @relation("ChargeCreatedBy")
createdInvoices       Invoice[]            @relation("InvoiceCreatedBy")
```

---

### 3. **Customer** (Updated)

**Relations mới:**
```prisma
invoices  Invoice[]
```

---

### 4. **Debt** (Updated)

**Fields mới:**
```prisma
invoiceId  String?  @unique
```

**Relations mới:**
```prisma
invoice  Invoice?  @relation(...)
```

---

## 📊 DATABASE CHANGES

### Tables Created (4)
1. ✅ `shipment_documents` - 11 columns
2. ✅ `charges` - 10 columns
3. ✅ `invoices` - 19 columns
4. ✅ `invoice_items` - 7 columns

### Columns Added
- ✅ `shipments.createdById`
- ✅ `shipments.createdByType`
- ✅ `shipments.specialInstructions`
- ✅ `shipments.containerNumber`
- ✅ `shipments.containerType`
- ✅ `debts.invoiceId`

### Enums Created (3)
1. ✅ `DocumentType` - 7 values
2. ✅ `ChargeType` - 11 values
3. ✅ `InvoiceStatus` - 6 values

### Indexes Created (9)
1. ✅ `shipments_createdById_idx`
2. ✅ `shipment_documents_shipmentId_documentType_idx`
3. ✅ `shipment_documents_isVerified_idx`
4. ✅ `charges_shipmentId_idx`
5. ✅ `invoices_customerId_invoiceDate_idx`
6. ✅ `invoices_status_dueDate_idx`
7. ✅ `invoice_items_invoiceId_idx`
8. ✅ `invoices_invoiceNumber_key` (unique)
9. ✅ `invoice_items_chargeId_key` (unique)

### Foreign Keys Created (11)
1. ✅ `shipments_createdById_fkey`
2. ✅ `shipment_documents_shipmentId_fkey`
3. ✅ `shipment_documents_uploadedById_fkey`
4. ✅ `shipment_documents_verifiedById_fkey`
5. ✅ `charges_shipmentId_fkey`
6. ✅ `charges_createdById_fkey`
7. ✅ `invoices_customerId_fkey`
8. ✅ `invoices_shipmentId_fkey`
9. ✅ `invoices_createdById_fkey`
10. ✅ `invoice_items_invoiceId_fkey`
11. ✅ `invoice_items_chargeId_fkey`
12. ✅ `debts_invoiceId_fkey`

---

## ✅ VERIFICATION RESULTS

### Database Tables
```bash
✅ shipment_documents table: EXISTS
✅ charges table: EXISTS
✅ invoices table: EXISTS
✅ invoice_items table: EXISTS
```

### Enums
```bash
✅ DocumentType enum: EXISTS (7 values)
✅ ChargeType enum: EXISTS (11 values)
✅ InvoiceStatus enum: EXISTS (6 values)
```

### Compilation
```bash
✅ Wasp compilation: SUCCESS
✅ TypeScript errors: NONE
✅ Prisma schema: VALID
```

---

## 🎯 ENTITIES READY FOR IMPLEMENTATION

### Module 1: Customer Portal ✅
**Entities cần dùng:**
- ✅ Shipment (updated với createdById, containerNumber, etc.)
- ✅ Customer (đã có)
- ✅ User (updated với createdShipments relation)
- ✅ ShipmentStop (đã có)

**Status:** ✅ Schema ready - Có thể bắt đầu implement backend & frontend

---

### Module 2: Document Management ✅
**Entities cần dùng:**
- ✅ ShipmentDocument (NEW)
- ✅ Shipment (có documents relation)
- ✅ User (có uploadedDocuments, verifiedDocuments relations)
- ✅ DocumentType enum (NEW)

**Status:** ✅ Schema ready - Có thể bắt đầu implement

---

### Module 3: Charge & Invoice Management ✅
**Entities cần dùng:**
- ✅ Charge (NEW)
- ✅ Invoice (NEW)
- ✅ InvoiceItem (NEW)
- ✅ Shipment (có charges, invoices relations)
- ✅ Customer (có invoices relation)
- ✅ Debt (có invoiceId relation)
- ✅ ChargeType enum (NEW)
- ✅ InvoiceStatus enum (NEW)

**Status:** ✅ Schema ready - Có thể bắt đầu implement

---

## 📋 MIGRATION FILES CREATED

### Migration 1: Shipment Customer Fields
**File:** `/migrations/20260212_add_shipment_customer_fields/migration.sql`
**Status:** ✅ Applied
**Changes:**
- Added 5 columns to shipments
- Added foreign key for createdById
- Added index on createdById

### Migration 2: Document, Charge, Invoice
**File:** `/migrations/20260212_add_document_charge_invoice/migration.sql`
**Status:** ✅ Applied
**Changes:**
- Created 3 enums
- Created 4 tables
- Added invoiceId to debts
- Created 9 indexes
- Created 12 foreign keys

---

## 🔗 RELATIONSHIPS OVERVIEW

### Shipment Relationships (Updated)
```
Shipment → Customer (customerId)
Shipment → User (createdById)
Shipment → ShipmentStop[] (stops)
Shipment → Dispatch (dispatch)
Shipment → ShipmentStatusEvent[] (statusEvents)
Shipment → POD[] (pods)
Shipment → ShipmentDocument[] (documents) ✨ NEW
Shipment → Charge[] (charges) ✨ NEW
Shipment → Invoice[] (invoices) ✨ NEW
```

### User Relationships (Updated)
```
User → Customer (customerId)
User → Driver (driver)
User → Dispatch[] (createdDispatches)
User → ShipmentStatusEvent[] (createdStatusEvents)
User → POD[] (uploadedPODs)
User → Debt[] (createdDebts)
User → Shipment[] (createdShipments) ✨ NEW
User → ShipmentDocument[] (uploadedDocuments) ✨ NEW
User → ShipmentDocument[] (verifiedDocuments) ✨ NEW
User → Charge[] (createdCharges) ✨ NEW
User → Invoice[] (createdInvoices) ✨ NEW
```

### Customer Relationships (Updated)
```
Customer → User[] (users)
Customer → Shipment[] (shipments)
Customer → Debt[] (debts)
Customer → Invoice[] (invoices) ✨ NEW
```

### Financial Flow
```
Shipment → Charge[] → InvoiceItem[] → Invoice → Debt
```

---

## 🎯 NEXT STEPS

### Bạn có thể review và update:

#### **1. Shipment Entity**
- [ ] `createdById` - OK?
- [ ] `createdByType` - Cần không? (có thể check từ user.userType)
- [ ] `specialInstructions` - OK? (ShipmentStop cũng có field này)
- [ ] `containerNumber` - OK?
- [ ] `containerType` - OK? Hay cần enum ContainerType?

#### **2. ShipmentDocument Entity**
- [ ] DocumentType enum - Có đủ 7 types không?
- [ ] `mimeType` - Cần không?
- [ ] `notes` - Cần không?
- [ ] File size limit? (đề xuất: 10MB)

#### **3. Charge Entity**
- [ ] ChargeType enum - Có đủ 11 types không?
- [ ] `quantity` & `unitPrice` - Cần không? Hay chỉ cần `amount`?
- [ ] `currency` - Luôn VND hay cần support USD?

#### **4. Invoice Entity**
- [ ] `vatRate` - Fixed 10% hay configurable?
- [ ] `discount` - Cần không?
- [ ] `paymentMethod` - Cần không?
- [ ] `paymentTerms` - Override customer default?
- [ ] Invoice có thể cho nhiều shipments không? (hiện tại: shipmentId optional)

#### **5. InvoiceItem Entity**
- [ ] Có cần thêm field nào không?
- [ ] Link với Charge có OK không?

---

## 📝 SAU KHI BẠN REVIEW:

### Nếu cần thay đổi:
1. Update `schema.prisma`
2. Tạo migration mới
3. Chạy migration
4. Compile lại

### Nếu OK:
1. ✅ Bắt đầu implement Customer Portal backend
2. ✅ Implement Customer Portal frontend
3. ✅ Implement Document Management
4. ✅ Implement Charge & Invoice Management
5. ✅ Implement Cloud Storage
6. ✅ Testing

---

## 📊 CURRENT STATUS

```
✅ Schema updated: 14 entities, 14 enums
✅ Migrations created: 2 files
✅ Migrations applied: SUCCESS
✅ Database tables: 14 tables
✅ Compilation: SUCCESS
✅ TypeScript errors: NONE

⏳ Waiting for: Your review & approval
🚀 Ready for: PHASE 1 implementation
```

---

## 💡 RECOMMENDATIONS

### Có thể thêm sau (không cần ngay):

1. **ContainerType enum** (thay vì String):
```prisma
enum ContainerType {
  CONTAINER_20FT
  CONTAINER_40FT
  CONTAINER_40HC
  CONTAINER_45FT
  FLATBED
  TANK
}
```

2. **PaymentMethod enum**:
```prisma
enum PaymentMethod {
  BANK_TRANSFER
  CASH
  CHECK
  CREDIT_CARD
  OTHER
}
```

3. **Notification entity** (PHASE 2):
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

**Status:** ✅ **SCHEMA READY FOR REVIEW**  
**Action:** Hãy review và cho tôi biết nếu cần thay đổi gì!
