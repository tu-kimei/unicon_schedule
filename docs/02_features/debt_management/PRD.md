# Debt Management - Product Requirements Document (MVP)

## Document Information

- **Feature**: Debt Management (Quản lý Công nợ)
- **Version**: MVP 1.0
- **Milestone**: M1.5 (Between M1 and M2)
- **Priority**: High
- **Status**: Design Complete - Ready for Implementation
- **Last Updated**: 2026-02-03

---

## 1. Executive Summary

### 1.1 Problem Statement

Hiện tại, việc quản lý công nợ khách hàng được thực hiện thủ công qua Excel, dẫn đến:
- ❌ Khó tracking công nợ theo từng khách hàng, từng tháng
- ❌ Không có cảnh báo tự động khi công nợ quá hạn
- ❌ Mất thời gian đối soát và tìm kiếm chứng từ
- ❌ Dễ nhầm lẫn, thiếu sót trong việc ghi nhận thanh toán
- ❌ Không có audit trail cho các thay đổi

### 1.2 Solution

Xây dựng module Quản lý Công nợ tích hợp trong hệ thống Unicon Schedule, cho phép:
- ✅ Quản lý công nợ theo khách hàng, theo tháng
- ✅ Tự động tính ngày đến hạn dựa trên thời hạn công nợ của khách hàng
- ✅ Cảnh báo công nợ quá hạn
- ✅ Lưu trữ chứng từ, hóa đơn, UNC kèm theo
- ✅ Tracking lịch sử thanh toán
- ✅ Filter và search linh hoạt

### 1.3 Success Metrics

| Metric | Current | Target (MVP) |
|--------|---------|--------------|
| Thời gian tạo công nợ | ~10 phút (Excel) | < 2 phút |
| Thời gian tìm kiếm công nợ | ~5 phút | < 30 giây |
| Tỷ lệ quên nhắc nhở quá hạn | ~30% | < 5% |
| Thời gian đối soát cuối tháng | ~4 giờ | < 1 giờ |

---

## 2. User Personas & Use Cases

### 2.1 Accounting User

**Goals**:
- Tạo và quản lý công nợ cho khách hàng
- Tracking thanh toán
- Nhắc nhở khách hàng quá hạn
- Đối soát công nợ cuối tháng

**Pain Points**:
- Mất thời gian nhập liệu vào Excel
- Khó tracking công nợ quá hạn
- Thiếu chứng từ khi cần đối soát
- Không có lịch sử thay đổi

**User Stories**:
```gherkin
Feature: Quản lý Công nợ

Scenario: Tạo công nợ mới cho khách hàng
  Given Tôi là Accounting user
  When Tôi tạo công nợ mới cho khách hàng ABC tháng 02/2026
  And Nhập số tiền 50,000,000 VND
  And Upload hóa đơn và link bảng kê
  Then Hệ thống tự động tính ngày đến hạn dựa trên thời hạn của khách hàng
  And Lưu công nợ vào database
  So that Tôi có thể tracking công nợ này

Scenario: Xem danh sách công nợ quá hạn
  Given Tôi là Accounting user
  When Tôi filter "Chỉ hiển thị quá hạn"
  Then Hệ thống hiển thị danh sách khách hàng có công nợ quá hạn
  And Highlight số ngày quá hạn
  So that Tôi biết cần nhắc nhở khách hàng nào

Scenario: Cập nhật thanh toán
  Given Khách hàng ABC đã thanh toán công nợ
  When Tôi cập nhật trạng thái "Đã thanh toán"
  And Nhập ngày thanh toán và số tiền
  And Upload hình UNC
  Then Hệ thống cập nhật trạng thái công nợ
  And Lưu lịch sử thanh toán
  So that Tôi có chứng từ khi cần đối soát

Scenario: Tìm kiếm công nợ theo tháng
  Given Tôi cần đối soát công nợ tháng 02/2026
  When Tôi filter theo tháng "02/2026"
  Then Hệ thống hiển thị tất cả công nợ của tháng đó
  And Tổng hợp số tiền chưa thanh toán, đã thanh toán
  So that Tôi có thể đối soát nhanh chóng
```

### 2.2 Admin User

**Goals**:
- Giám sát tổng quan công nợ
- Hỗ trợ Accounting khi cần
- Quản lý quyền truy cập

**User Stories**:
```gherkin
Scenario: Xem tổng quan công nợ
  Given Tôi là Admin
  When Tôi truy cập trang Quản lý Công nợ
  Then Tôi thấy summary cards: Tổng công nợ, Chưa TT, Đã TT, Quá hạn
  So that Tôi nắm được tình hình tài chính
```

### 2.3 OPS User

**Goals**:
- Xem thông tin công nợ (read-only)
- Hiểu tình hình thanh toán của khách hàng

**User Stories**:
```gherkin
Scenario: Xem công nợ của khách hàng
  Given Tôi là OPS user
  When Tôi xem thông tin khách hàng ABC
  Then Tôi có thể xem danh sách công nợ của khách hàng này
  But Tôi không thể tạo/sửa/xóa công nợ
  So that Tôi biết tình hình thanh toán để tư vấn khách hàng
```

---

## 3. Functional Requirements

### 3.1 Core Features (MVP)

#### F1: Quản lý Công nợ

**F1.1 Tạo công nợ mới**
- Input: Khách hàng, Loại công nợ, Tháng, Số tiền, Ngày ghi nhận
- Optional: Link bảng kê, Hình hóa đơn, Ghi chú
- Auto-calculate: Ngày đến hạn (dựa vào thời hạn của khách hàng)
- Validation:
  - Khách hàng phải tồn tại
  - Số tiền > 0
  - Tháng đúng format YYYY-MM
  - Ngày ghi nhận hợp lệ

**F1.2 Xem danh sách công nợ**
- Hiển thị dạng table, group theo tháng
- Columns: Khách hàng, Loại, Số tiền, Ngày GN, Đến hạn, Trạng thái, Actions
- Summary cards: Tổng CN, Chưa TT, Đã TT, Quá hạn
- Highlight công nợ quá hạn (màu đỏ)
- Hiển thị số ngày quá hạn / còn lại

**F1.3 Filter & Search**
- Filter theo:
  - Tháng (dropdown: 02/2026, 01/2026, ...)
  - Khách hàng (dropdown: tất cả khách hàng)
  - Trạng thái (Tất cả, Chưa TT, Đã TT, Quá hạn)
  - Checkbox: "Chỉ hiển thị quá hạn"
- Search: Tìm theo tên khách hàng, số tiền

**F1.4 Xem chi tiết công nợ**
- Thông tin đầy đủ: Khách hàng, Loại, Tháng, Số tiền, Ngày GN, Đến hạn
- Thông tin thanh toán: Trạng thái, Số tiền đã trả, Ngày TT, Hình UNC
- Link bảng kê (nếu có)
- Hình ảnh hóa đơn (gallery)
- Ghi chú
- Lịch sử thay đổi

**F1.5 Sửa công nợ**
- Chỉ sửa được khi trạng thái = "Chưa thanh toán"
- Có thể sửa: Loại, Tháng, Số tiền, Ngày GN, Link, Hình, Ghi chú
- Không sửa được: Khách hàng (phải tạo mới)
- Auto-recalculate ngày đến hạn nếu thay đổi ngày GN

**F1.6 Xóa công nợ**
- Soft delete (set deletedAt)
- Chỉ Admin được xóa
- Không xóa được nếu đã thanh toán

#### F2: Quản lý Thanh toán

**F2.1 Cập nhật thanh toán**
- Input: Số tiền thanh toán (phải = số tiền công nợ), Ngày TT
- Optional: Hình UNC, Ghi chú TT
- Validation:
  - Số tiền phải bằng số tiền công nợ (MVP: full payment only)
  - Ngày TT hợp lệ
  - Không cập nhật được nếu đã thanh toán
- Update: status = PAID, paidAmount, paidDate, paymentProofImages, paymentNotes

**F2.2 Hủy thanh toán**
- Chỉ Admin/Accounting được hủy
- Thêm lý do hủy vào notes
- Update: status = CANCELLED

#### F3: Upload Files

**F3.1 Upload hình hóa đơn**
- Multiple files
- Max 5MB/file
- Formats: JPG, PNG, PDF
- Store URLs in invoiceImages array

**F3.2 Upload hình UNC**
- Multiple files
- Max 5MB/file
- Formats: JPG, PNG, PDF
- Store URLs in paymentProofImages array

#### F4: Customer Payment Terms

**F4.1 Thêm thời hạn công nợ vào Customer**
- Fields: paymentTermDays (số ngày/tháng), paymentTermType (DAYS/MONTHS)
- Default: 30 DAYS
- Dùng để tính ngày đến hạn tự động

### 3.2 Business Rules

**BR1: Tính ngày đến hạn**
```
IF paymentTermType = DAYS:
  dueDate = recognitionDate + paymentTermDays days
ELSE IF paymentTermType = MONTHS:
  dueDate = recognitionDate + paymentTermDays months
```

**BR2: Xác định trạng thái quá hạn**
```
IF status = PAID OR status = CANCELLED:
  Keep current status
ELSE IF dueDate < today:
  status = OVERDUE
ELSE:
  status = UNPAID
```

**BR3: Validation thanh toán**
```
MVP: paidAmount MUST EQUAL amount (full payment only)
Future: Allow partial payments
```

### 3.3 Non-Functional Requirements

**Performance**:
- Load danh sách công nợ < 2s
- Filter/search response < 1s
- Upload file < 5s

**Security**:
- Role-based access control
- Audit trail for all changes
- Secure file storage (Cloudinary)

**Usability**:
- Responsive design (desktop, tablet, mobile)
- Intuitive UI/UX
- Vietnamese language
- Clear error messages

---

## 4. Data Model

See: [DEBT_MANAGEMENT_SCHEMA.md](./DEBT_MANAGEMENT_SCHEMA.md)

**Key Entities**:
- `Customer` (updated with payment terms)
- `Debt` (main table)

**Enums**:
- `DebtType`: FREIGHT, ADVANCE, OTHER
- `DebtStatus`: UNPAID, PAID, OVERDUE, CANCELLED
- `PaymentTermType`: DAYS, MONTHS

---

## 5. API Contracts

See: [DEBT_MANAGEMENT_API.md](./DEBT_MANAGEMENT_API.md)

**Key Endpoints**:
- `GET /api/debts` - List with filters
- `GET /api/debts/:id` - Get details
- `POST /api/debts` - Create
- `PUT /api/debts/:id` - Update
- `POST /api/debts/:id/pay` - Mark as paid
- `POST /api/debts/:id/cancel` - Cancel
- `DELETE /api/debts/:id` - Soft delete
- `POST /api/debts/:id/upload-invoice` - Upload invoice images
- `POST /api/debts/:id/upload-payment-proof` - Upload UNC images

---

## 6. UI/UX Design

See: [DEBT_MANAGEMENT_UI.md](./DEBT_MANAGEMENT_UI.md)

**Key Pages**:
1. Debts List Page (`/accounting/debts`)
   - Table grouped by month
   - Filters & search
   - Summary cards
   
2. Debt Details Page (`/accounting/debts/:id`)
   - Full information
   - Documents & images
   - Payment info
   
3. Create/Edit Debt Modal
   - Form with validation
   - File upload
   
4. Mark as Paid Modal
   - Payment form
   - UNC upload

---

## 7. Permissions Matrix

| Action | ADMIN | ACCOUNTING | OPS | DISPATCHER | DRIVER |
|--------|-------|------------|-----|------------|--------|
| View debts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create debt | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update debt | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete debt | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mark as paid | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cancel debt | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload files | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 8. Out of Scope (Future Phases)

**Post-MVP Features**:
1. **Partial Payments**
   - Multiple payment records per debt
   - Track remaining balance
   - Payment history timeline

2. **Auto-calculation from Shipments**
   - Link Debt to Shipments
   - Auto-calculate freight charges
   - Auto-create monthly debts

3. **Notifications**
   - Email reminders before due date
   - Overdue notifications
   - Payment confirmations

4. **Dashboard & Reports**
   - Total receivables chart
   - Aging analysis
   - Customer payment history
   - Cash flow projections
   - Export to Excel/PDF

5. **Advanced Features**
   - Recurring debts
   - Payment plans
   - Interest calculation for overdue
   - Credit limit management

---

## 9. Implementation Plan

### Phase 1: Database & Backend (Week 1)
- [ ] Update Customer model with payment terms
- [ ] Create Debt model
- [ ] Create database migration
- [ ] Implement queries (getAllDebts, getDebt, summaries)
- [ ] Implement actions (create, update, pay, cancel, delete)
- [ ] Implement file upload (invoice, UNC)
- [ ] Write unit tests

### Phase 2: Frontend (Week 2)
- [ ] Create Debts List Page
- [ ] Create Debt Details Page
- [ ] Create Debt Form Modal
- [ ] Create Mark as Paid Modal
- [ ] Implement filters & search
- [ ] Implement file upload UI
- [ ] Add to navigation menu

### Phase 3: Testing & Polish (Week 3)
- [ ] Integration testing
- [ ] Browser testing
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| File upload failures | Medium | Low | Use Cloudinary (proven), add retry logic |
| Performance with large data | High | Medium | Add pagination, indexes, caching |
| User adoption | High | Medium | Training, clear UI, gradual rollout |
| Data migration errors | High | Low | Thorough testing, backup plan |

---

## 11. Success Criteria

**MVP is successful if**:
- ✅ Accounting can create/manage debts in < 2 minutes
- ✅ Can filter and find debts in < 30 seconds
- ✅ Overdue debts are clearly highlighted
- ✅ Payment tracking is accurate and complete
- ✅ Files are securely stored and accessible
- ✅ No critical bugs in production
- ✅ User satisfaction > 4/5

---

## 12. Appendix

### A. Glossary

- **Công nợ**: Debt, accounts receivable
- **Cước vận chuyển**: Freight charges
- **Chi hộ**: Advance payment on behalf of customer
- **UNC**: Ủy nhiệm chi (bank transfer confirmation)
- **Bảng kê**: Itemized list, statement
- **Đối soát**: Reconciliation

### B. References

- [DEBT_MANAGEMENT_SCHEMA.md](./DEBT_MANAGEMENT_SCHEMA.md)
- [DEBT_MANAGEMENT_API.md](./DEBT_MANAGEMENT_API.md)
- [DEBT_MANAGEMENT_UI.md](./DEBT_MANAGEMENT_UI.md)
- [01_PRD.md](./01_PRD.md) - Original PRD
- [02_PLAN.md](./02_PLAN.md) - Development plan

---

**Document Status**: ✅ Complete - Ready for Implementation

**Next Steps**: 
1. Review and approve PRD
2. Create implementation tasks
3. Start Phase 1 development
