# Debt Management Feature - Summary Document

## 📋 Overview

**Feature Name**: Debt Management (Quản lý Công nợ)  
**Version**: MVP 1.0  
**Milestone**: M1.5  
**Status**: ✅ Design Complete - Ready for Implementation  
**Date**: 2026-02-03

---

## 🎯 Feature Description

Tính năng Quản lý Công nợ cho phép Accounting và Admin:
- Quản lý công nợ theo từng khách hàng, theo từng tháng
- Tracking 3 loại công nợ: Cước vận chuyển, Chi hộ, Khác
- Tự động tính ngày đến hạn dựa trên thời hạn công nợ của khách hàng
- Cảnh báo công nợ quá hạn
- Upload và lưu trữ chứng từ (hóa đơn, UNC)
- Ghi nhận thanh toán với đầy đủ thông tin

---

## 📊 Key Features (MVP)

### 1. Quản lý Công nợ
- ✅ Tạo công nợ mới (manual input)
- ✅ Xem danh sách công nợ (table grouped by month)
- ✅ Filter theo: Tháng, Khách hàng, Trạng thái, Quá hạn
- ✅ Xem chi tiết công nợ
- ✅ Sửa công nợ (chỉ khi chưa thanh toán)
- ✅ Xóa công nợ (soft delete, Admin only)

### 2. Loại Công nợ
- **Cước vận chuyển** (FREIGHT): Chi phí vận chuyển hàng hóa
- **Chi hộ** (ADVANCE): Chi phí ứng trước cho khách hàng
- **Khác** (OTHER): Các khoản công nợ khác

### 3. Thời hạn Công nợ
- Mỗi khách hàng có thời hạn mặc định (ví dụ: 30 ngày, 1 tháng)
- Hệ thống tự động tính ngày đến hạn = Ngày ghi nhận + Thời hạn
- Tự động đánh dấu OVERDUE khi quá ngày đến hạn

### 4. Chứng từ & Tài liệu
- **Link bảng kê**: Text field để paste link Google Sheet
- **Hình hóa đơn**: Upload multiple images (JPG, PNG, PDF, max 5MB)
- **Ghi chú**: Text area cho thông tin bổ sung

### 5. Thanh toán
- **MVP**: Chỉ hỗ trợ thanh toán full (không thanh toán từng phần)
- Ghi nhận: Số tiền, Ngày thanh toán
- Upload hình UNC (Ủy nhiệm chi)
- Ghi chú thanh toán
- Update status = PAID

### 6. Permissions
- **ADMIN**: Full access (CRUD + payment)
- **ACCOUNTING**: Full access (CRUD + payment)
- **OPS**: Read-only
- **DISPATCHER, DRIVER**: No access

---

## 🗄️ Database Schema

### New Enums
```prisma
enum DebtType { FREIGHT, ADVANCE, OTHER }
enum DebtStatus { UNPAID, PAID, OVERDUE, CANCELLED }
enum PaymentTermType { DAYS, MONTHS }
```

### Updated Models

**Customer** (updated):
```prisma
model Customer {
  // ... existing fields
  paymentTermDays Int             @default(30)
  paymentTermType PaymentTermType @default(DAYS)
  debts           Debt[]
}
```

**Debt** (new):
```prisma
model Debt {
  id                  String     @id @default(uuid())
  customerId          String
  debtType            DebtType
  debtMonth           String     // "YYYY-MM"
  amount              Decimal    @db.Decimal(15, 2)
  documentLink        String?
  invoiceImages       String[]
  notes               String?
  recognitionDate     DateTime   @default(now())
  dueDate             DateTime
  status              DebtStatus @default(UNPAID)
  paidAmount          Decimal?
  paidDate            DateTime?
  paymentProofImages  String[]
  paymentNotes        String?
  createdById         String
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  deletedAt           DateTime?
  
  customer            Customer   @relation(...)
  createdBy           User       @relation(...)
}
```

---

## 🔌 API Endpoints

### Queries (Wasp)
```wasp
query getAllDebts { ... }
query getDebt { ... }
query getDebtsSummaryByCustomer { ... }
query getDebtsSummaryByMonth { ... }
```

### Actions (Wasp)
```wasp
action createDebt { ... }
action updateDebt { ... }
action markDebtAsPaid { ... }
action cancelDebt { ... }
action deleteDebt { ... }
action uploadDebtInvoiceImages { ... }
action uploadDebtPaymentProofImages { ... }
```

See: [DEBT_MANAGEMENT_API.md](./DEBT_MANAGEMENT_API.md) for full details

---

## 🎨 UI Pages

### 1. Debts List Page
- **URL**: `/accounting/debts`
- **Features**:
  - Summary cards (Tổng CN, Chưa TT, Đã TT, Quá hạn)
  - Filters (Tháng, Khách hàng, Trạng thái, Quá hạn)
  - Table grouped by month
  - Actions: Xem, Sửa, Thanh toán

### 2. Debt Details Page
- **URL**: `/accounting/debts/:id`
- **Features**:
  - Full debt information
  - Payment information
  - Documents & images gallery
  - Notes
  - Action buttons

### 3. Modals
- Create/Edit Debt Modal
- Mark as Paid Modal

See: [DEBT_MANAGEMENT_UI.md](./DEBT_MANAGEMENT_UI.md) for full designs

---

## 📁 File Structure

```
src/
├── debt/
│   ├── actions/
│   │   ├── debts.ts          # CRUD actions
│   │   ├── payment.ts        # Payment actions
│   │   └── upload.ts         # File upload actions
│   │
│   ├── queries/
│   │   ├── debts.ts          # Get debts queries
│   │   └── summary.ts        # Summary queries
│   │
│   ├── components/
│   │   ├── DebtTypeBadge.tsx
│   │   ├── DebtStatusBadge.tsx
│   │   ├── DebtCard.tsx
│   │   ├── DebtFormModal.tsx
│   │   ├── MarkAsPaidModal.tsx
│   │   └── ImageGallery.tsx
│   │
│   └── pages/
│       ├── DebtsListPage.tsx
│       └── DebtDetailsPage.tsx
│
└── shared/
    └── utils/
        └── debtCalculations.ts  # Helper functions
```

---

## 🔄 Business Logic

### Calculate Due Date
```typescript
function calculateDueDate(
  recognitionDate: Date,
  paymentTermDays: number,
  paymentTermType: 'DAYS' | 'MONTHS'
): Date {
  if (paymentTermType === 'DAYS') {
    return addDays(recognitionDate, paymentTermDays);
  } else {
    return addMonths(recognitionDate, paymentTermDays);
  }
}
```

### Check Overdue Status
```typescript
function isOverdue(debt: Debt): boolean {
  if (debt.status === 'PAID' || debt.status === 'CANCELLED') {
    return false;
  }
  return debt.dueDate < new Date();
}

function getDaysOverdue(debt: Debt): number | null {
  if (!isOverdue(debt)) return null;
  return differenceInDays(new Date(), debt.dueDate);
}
```

---

## 📝 User Workflows

### Workflow 1: Tạo công nợ mới

```
1. Accounting login → Navigate to /accounting/debts
2. Click "Tạo công nợ mới"
3. Fill form:
   - Chọn khách hàng
   - Chọn loại công nợ
   - Nhập tháng (MM/YYYY)
   - Nhập số tiền
   - Chọn ngày ghi nhận (default: hôm nay)
   - (Optional) Paste link bảng kê
   - (Optional) Upload hình hóa đơn
   - (Optional) Nhập ghi chú
4. Hệ thống tự động tính ngày đến hạn
5. Click "Tạo công nợ"
6. Công nợ được tạo với status = UNPAID
```

### Workflow 2: Cập nhật thanh toán

```
1. Accounting login → Navigate to /accounting/debts
2. Filter để tìm công nợ cần cập nhật
3. Click "Thanh toán" hoặc vào chi tiết → "Cập nhật thanh toán"
4. Fill payment form:
   - Xác nhận số tiền (auto-fill = debt.amount)
   - Chọn ngày thanh toán
   - (Optional) Upload hình UNC
   - (Optional) Nhập ghi chú thanh toán
5. Click "Xác nhận thanh toán"
6. Status updated to PAID
7. Payment info saved
```

### Workflow 3: Tìm công nợ quá hạn

```
1. Accounting login → Navigate to /accounting/debts
2. Check "Chỉ hiển thị quá hạn"
3. Hệ thống hiển thị danh sách công nợ quá hạn
4. Highlight màu đỏ, hiển thị số ngày quá hạn
5. Accounting liên hệ khách hàng để nhắc nhở
```

### Workflow 4: Đối soát công nợ theo tháng

```
1. Accounting login → Navigate to /accounting/debts
2. Filter theo tháng (ví dụ: 02/2026)
3. Hệ thống hiển thị:
   - Tất cả công nợ của tháng đó
   - Tổng số tiền, số lượng
   - Trạng thái từng công nợ
4. Click vào từng công nợ để xem chi tiết
5. Verify với bảng kê và chứng từ
```

---

## 🚀 Implementation Checklist

### Phase 1: Database & Backend
- [x] Design database schema
- [x] Update schema.prisma
- [ ] Create migration
- [ ] Implement queries
- [ ] Implement actions
- [ ] Implement file upload
- [ ] Write unit tests
- [ ] Test APIs with curl/Postman

### Phase 2: Frontend
- [ ] Create DebtTypeBadge component
- [ ] Create DebtStatusBadge component
- [ ] Create DebtFormModal component
- [ ] Create MarkAsPaidModal component
- [ ] Create DebtsListPage
- [ ] Create DebtDetailsPage
- [ ] Add to navigation menu
- [ ] Implement filters & search
- [ ] Implement file upload UI

### Phase 3: Integration & Testing
- [ ] Integration testing
- [ ] Browser testing
- [ ] Test all user workflows
- [ ] Test permissions
- [ ] Fix bugs
- [ ] Performance testing
- [ ] Documentation

---

## 📚 Documentation Files

1. **[DEBT_MANAGEMENT_PRD.md](./DEBT_MANAGEMENT_PRD.md)** - Full PRD
2. **[DEBT_MANAGEMENT_SCHEMA.md](./DEBT_MANAGEMENT_SCHEMA.md)** - Database design
3. **[DEBT_MANAGEMENT_API.md](./DEBT_MANAGEMENT_API.md)** - API contracts
4. **[DEBT_MANAGEMENT_UI.md](./DEBT_MANAGEMENT_UI.md)** - UI/UX design
5. **[DEBT_MANAGEMENT_SUMMARY.md](./DEBT_MANAGEMENT_SUMMARY.md)** - This file

---

## 🎯 Next Steps

1. **Review & Approve** design documents
2. **Create migration** for database changes
3. **Start implementation** following the checklist
4. **Test thoroughly** before deploying
5. **Train users** on new features

---

## ⚠️ Important Notes

### MVP Limitations
- ❌ Không tự động tạo công nợ từ Shipment (manual only)
- ❌ Không hỗ trợ thanh toán từng phần (full payment only)
- ❌ Không có email notifications
- ❌ Không có dashboard/reports
- ❌ Không link trực tiếp với Shipment

### Future Enhancements (Post-MVP)
- ✨ Auto-create debts from completed shipments
- ✨ Partial payment support
- ✨ Email notifications (reminders, overdue alerts)
- ✨ Dashboard with charts and analytics
- ✨ Link debts to shipments
- ✨ Export to Excel/PDF
- ✨ Payment plans and installments
- ✨ Interest calculation for overdue debts

---

## 📞 Questions & Clarifications

All questions have been answered by the user:

✅ Công nợ độc lập, không link với Shipment (MVP)  
✅ Số tiền nhập manual (auto-calculation ở phase sau)  
✅ Thời hạn công nợ set ở Customer level  
✅ Ngày ghi nhận = ngày nhập hoặc user chọn  
✅ Thanh toán full only (partial payment ở phase sau)  
✅ Không cần approve workflow  
✅ Không cần notifications (MVP)  
✅ Không cần dashboard (MVP)  
✅ Permissions: Admin/Accounting full, OPS read-only  

---

## 🎉 Ready for Implementation!

All design documents are complete and ready for development team to start implementation.

**Estimated Development Time**: 2-3 weeks
- Week 1: Database & Backend
- Week 2: Frontend
- Week 3: Testing & Polish

**Team Required**:
- 1 Backend Developer
- 1 Frontend Developer
- 1 QA Tester

---

**Contact**: For questions or clarifications, contact the product owner.
