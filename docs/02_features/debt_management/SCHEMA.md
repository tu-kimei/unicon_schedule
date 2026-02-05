# Debt Management - Database Schema Design (MVP)

## Overview

Thiết kế database schema cho tính năng Quản lý Công nợ MVP, hỗ trợ:
- Quản lý công nợ theo khách hàng, theo tháng
- 3 loại công nợ: Cước vận chuyển, Chi hộ, Khác
- Tracking thanh toán (full payment only)
- Thời hạn công nợ và cảnh báo quá hạn

---

## Database Schema

### 1. Customer Model Updates

Cập nhật bảng `customers` để thêm thông tin thời hạn công nợ mặc định:

```prisma
model Customer {
  id                    String   @id @default(uuid())
  name                  String
  email                 String   @unique
  phone                 String?
  address               String?
  
  // NEW: Payment terms
  paymentTermDays       Int      @default(30) // Thời hạn công nợ mặc định (ngày)
  paymentTermType       PaymentTermType @default(DAYS) // DAYS, MONTHS
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  orders                Order[]
  debts                 Debt[]  // NEW
}

enum PaymentTermType {
  DAYS    // 20 ngày, 30 ngày
  MONTHS  // 1 tháng, 3 tháng
}
```

---

### 2. Debt Model (Main Table)

Bảng chính quản lý công nợ:

```prisma
model Debt {
  id                    String      @id @default(uuid())
  customerId            String
  
  // Debt Information
  debtType              DebtType
  debtMonth             String      // Format: "YYYY-MM" (e.g., "2026-02")
  amount                Decimal     @db.Decimal(15, 2) // Số tiền công nợ
  
  // Documents & References
  documentLink          String?     @db.Text // Link to Google Sheet/bảng kê
  invoiceImages         String[]    // Array of image URLs (hóa đơn)
  notes                 String?     @db.Text
  
  // Dates
  recognitionDate       DateTime    @default(now()) // Ngày ghi nhận công nợ
  dueDate               DateTime    // Ngày đến hạn (auto calculated)
  
  // Payment Status
  status                DebtStatus  @default(UNPAID)
  paidAmount            Decimal?    @db.Decimal(15, 2) // Số tiền đã thanh toán
  paidDate              DateTime?   // Ngày thanh toán
  paymentProofImages    String[]    // Array of UNC images
  paymentNotes          String?     @db.Text
  
  // Metadata
  createdById           String
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?   // Soft delete

  // Relations
  customer              Customer    @relation(fields: [customerId], references: [id])
  createdBy             User        @relation("DebtCreatedBy", fields: [createdById], references: [id])

  @@map("debts")
  @@index([customerId, debtMonth])
  @@index([status, dueDate])
  @@index([debtMonth])
}

enum DebtType {
  FREIGHT       // Công nợ cước vận chuyển
  ADVANCE       // Công nợ chi hộ
  OTHER         // Công nợ khác
}

enum DebtStatus {
  UNPAID        // Chưa thanh toán
  PAID          // Đã thanh toán
  OVERDUE       // Quá hạn
  CANCELLED     // Đã hủy
}
```

---

## Business Logic

### 1. Tính toán Ngày đến hạn (Due Date)

```typescript
function calculateDueDate(
  recognitionDate: Date,
  paymentTermDays: number,
  paymentTermType: PaymentTermType
): Date {
  if (paymentTermType === 'DAYS') {
    // Ngày ghi nhận + số ngày
    return addDays(recognitionDate, paymentTermDays);
  } else {
    // Ngày ghi nhận + số tháng
    return addMonths(recognitionDate, paymentTermDays);
  }
}
```

### 2. Tự động cập nhật Status

```typescript
function updateDebtStatus(debt: Debt): DebtStatus {
  if (debt.status === 'PAID' || debt.status === 'CANCELLED') {
    return debt.status; // Không thay đổi
  }
  
  const today = new Date();
  
  if (debt.dueDate < today) {
    return 'OVERDUE'; // Quá hạn
  }
  
  return 'UNPAID'; // Chưa thanh toán
}
```

### 3. Validation Rules

```typescript
// Khi tạo công nợ mới
- customerId: required
- debtType: required
- debtMonth: required, format "YYYY-MM"
- amount: required, > 0
- recognitionDate: required, default = now()
- dueDate: auto calculated from recognitionDate + customer.paymentTermDays

// Khi cập nhật thanh toán
- status: must be PAID
- paidAmount: required, must equal amount (MVP: full payment only)
- paidDate: required
- paymentProofImages: optional but recommended
```

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_debts_customer_month ON debts(customerId, debtMonth);
CREATE INDEX idx_debts_status_due ON debts(status, dueDate);
CREATE INDEX idx_debts_month ON debts(debtMonth);
CREATE INDEX idx_debts_overdue ON debts(status, dueDate) WHERE status = 'OVERDUE';
```

---

## Sample Data

```typescript
// Customer with payment terms
{
  id: "cust-001",
  name: "ABC Logistics Co.",
  email: "contact@abclogistics.vn",
  paymentTermDays: 30,
  paymentTermType: "DAYS"
}

// Debt record
{
  id: "debt-001",
  customerId: "cust-001",
  debtType: "FREIGHT",
  debtMonth: "2026-02",
  amount: 50000000, // 50 triệu VND
  documentLink: "https://docs.google.com/spreadsheets/d/abc123",
  invoiceImages: [
    "https://cloudinary.com/invoice-001.jpg",
    "https://cloudinary.com/invoice-002.jpg"
  ],
  notes: "Công nợ tháng 2/2026 - 10 chuyến hàng",
  recognitionDate: "2026-02-28T00:00:00Z",
  dueDate: "2026-03-30T00:00:00Z", // +30 days
  status: "UNPAID",
  createdById: "user-accounting-001"
}

// After payment
{
  ...
  status: "PAID",
  paidAmount: 50000000,
  paidDate: "2026-03-25T00:00:00Z",
  paymentProofImages: [
    "https://cloudinary.com/unc-001.jpg"
  ],
  paymentNotes: "Đã nhận chuyển khoản ngày 25/3"
}
```

---

## Migration Strategy

### Phase 1: Add Customer Payment Terms
```sql
ALTER TABLE customers 
ADD COLUMN "paymentTermDays" INTEGER DEFAULT 30,
ADD COLUMN "paymentTermType" "PaymentTermType" DEFAULT 'DAYS';
```

### Phase 2: Create Debt Table
```sql
CREATE TABLE debts (
  -- See Prisma schema above
);
```

### Phase 3: Update User Relations
```sql
-- Add relation for debt creator
-- Handled by Prisma migration
```

---

## Future Enhancements (Post-MVP)

1. **Partial Payments**:
   - Add `DebtPayment` table for multiple payments
   - Track payment history
   - Calculate remaining balance

2. **Auto-calculation from Shipments**:
   - Link Debt to Shipments
   - Auto-calculate freight charges
   - Auto-create monthly debts

3. **Notifications**:
   - Email reminders before due date
   - Overdue notifications
   - Payment confirmations

4. **Dashboard & Reports**:
   - Total receivables
   - Aging analysis
   - Customer payment history
   - Cash flow projections

---

## Notes

- MVP focuses on manual entry and simple tracking
- File uploads use Cloudinary (same as POD)
- Soft delete for audit trail
- All monetary values in VND (no currency field needed for MVP)
- Date fields use ISO 8601 format
