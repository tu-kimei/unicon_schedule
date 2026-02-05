# Detailed Implementation Plan - Unicon Schedule

**Created**: 2026-02-04  
**Status**: Active Planning Document  
**Owner**: Development Team

---

## 📊 Current System Status

### ✅ **Completed Modules**

#### **1. Logistics System (M1 - COMPLETE)**
- ✅ Order Management (CRUD)
- ✅ Shipment Management (CRUD, multi-stop)
- ✅ Dispatch System (assign vehicle/driver)
- ✅ Status Timeline & Events
- ✅ POD Upload & Management
- ✅ Vehicle & Driver Management

#### **2. Debt Management (M1.5 - COMPLETE)**
- ✅ Debt CRUD (Create, Read, Update, Delete)
- ✅ Customer Management (CRUD)
- ✅ Payment Tracking (Mark as Paid)
- ✅ File Upload (Invoices, Payment Proofs)
- ✅ Filters & Search
- ✅ Summary Views (by customer, by month)

#### **3. UI/UX Enhancements (COMPLETE)**
- ✅ Sidebar Navigation (desktop + mobile)
- ✅ Responsive Design
- ✅ File Upload Optimization (browser storage)
- ✅ PDF Preview
- ✅ Edit functionality for all entities

---

## 🎯 Roadmap Overview

```
┌─────────────────────────────────────────────────────────────┐
│ COMPLETED                                                    │
├─────────────────────────────────────────────────────────────┤
│ M1: Core Operations (Logistics)                    ✅ 100%  │
│ M1.5: Debt Management                              ✅ 100%  │
│ UI/UX: Sidebar, Responsive, File Upload           ✅ 100%  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ IN PROGRESS / NEXT                                           │
├─────────────────────────────────────────────────────────────┤
│ M2: Financial Layer                                ⏳ 20%   │
│ M3: Optimization & Integration                     ⏳ 0%    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 M2 – Financial Layer (NEXT MILESTONE)

**Timeline**: 3-4 weeks  
**Priority**: High  
**Dependencies**: M1, M1.5 complete

### **Objectives**
1. Link shipments với debts (auto-create debts)
2. Quản lý charge items (freight, surcharges)
3. Invoice generation
4. Financial reports & analytics

---

### **M2.1: Charge Items Management** (Week 1)

#### **Database Changes**
```prisma
model ChargeItem {
  id          String   @id @default(uuid())
  shipmentId  String
  chargeType  ChargeType // FREIGHT, FUEL_SURCHARGE, TOLL, PARKING, OTHER
  description String
  amount      Decimal  @db.Decimal(15, 2)
  quantity    Int      @default(1)
  unitPrice   Decimal? @db.Decimal(15, 2)
  notes       String?
  createdAt   DateTime @default(now())
  
  shipment    Shipment @relation(...)
}

enum ChargeType {
  FREIGHT           // Cước vận chuyển chính
  FUEL_SURCHARGE    // Phụ phí xăng dầu
  TOLL              // Phí cầu đường
  PARKING           // Phí đỗ xe
  LOADING_UNLOADING // Phí bốc xếp
  WAITING_TIME      // Phí chờ hàng
  OTHER             // Khác
}
```

#### **Backend Tasks**
- [ ] Create ChargeItem model
- [ ] Create migration
- [ ] Implement queries:
  - [ ] `getShipmentCharges` - Get all charges for a shipment
  - [ ] `calculateShipmentTotal` - Calculate total charges
- [ ] Implement actions:
  - [ ] `addChargeItem` - Add charge to shipment
  - [ ] `updateChargeItem` - Update charge
  - [ ] `deleteChargeItem` - Remove charge
  - [ ] `bulkAddCharges` - Add multiple charges at once

#### **Frontend Tasks**
- [ ] Create `ChargeItemForm` component
- [ ] Create `ChargeItemsList` component
- [ ] Add charges section to ShipmentDetailsPage
- [ ] Add "Tính cước" button to calculate freight
- [ ] Show total charges in shipment card

#### **Business Logic**
- [ ] Freight calculation rules (by distance, weight, vehicle type)
- [ ] Surcharge calculation (fuel %, toll rates)
- [ ] Validation (amount > 0, required fields)

**Deliverable**: Ops can add/manage charges for each shipment

---

### **M2.2: Auto-create Debts from Shipments** (Week 2)

#### **Database Changes**
```prisma
model Debt {
  // ... existing fields
  shipmentId  String?  // NEW: Link to shipment
  shipment    Shipment? @relation(...)
}

model Shipment {
  // ... existing fields
  debts       Debt[]   // NEW: One shipment can have multiple debts
}
```

#### **Backend Tasks**
- [ ] Update Debt model with shipmentId
- [ ] Create migration
- [ ] Implement `autoCreateDebtFromShipment` action:
  - [ ] Trigger when shipment status = COMPLETED
  - [ ] Calculate total from ChargeItems
  - [ ] Create debt with auto-populated fields
  - [ ] Link debt to shipment
- [ ] Add `getShipmentDebts` query

#### **Frontend Tasks**
- [ ] Add "Tạo công nợ" button in ShipmentDetailsPage
- [ ] Show linked debts in ShipmentDetailsPage
- [ ] Auto-populate debt form from shipment data
- [ ] Show shipment info in DebtDetailsPage (if linked)

#### **Business Logic**
- [ ] Auto-calculate debt amount from charges
- [ ] Auto-set debtMonth from shipment completion date
- [ ] Auto-set debtType based on charge types
- [ ] Validation: Can only create debt if shipment COMPLETED

**Deliverable**: Debts auto-created from completed shipments

---

### **M2.3: Invoice Generation** (Week 3)

#### **Database Changes**
```prisma
model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique // Auto-generated
  customerId      String
  invoiceDate     DateTime      @default(now())
  dueDate         DateTime
  status          InvoiceStatus @default(DRAFT)
  subtotal        Decimal       @db.Decimal(15, 2)
  taxAmount       Decimal?      @db.Decimal(15, 2)
  totalAmount     Decimal       @db.Decimal(15, 2)
  notes           String?
  createdById     String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  customer        Customer      @relation(...)
  createdBy       User          @relation(...)
  items           InvoiceItem[]
  debts           Debt[]        // Link to debts
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Int
  unitPrice   Decimal  @db.Decimal(15, 2)
  amount      Decimal  @db.Decimal(15, 2)
  
  invoice     Invoice  @relation(...)
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  CANCELLED
}
```

#### **Backend Tasks**
- [ ] Create Invoice & InvoiceItem models
- [ ] Create migration
- [ ] Implement queries:
  - [ ] `getAllInvoices` - List invoices
  - [ ] `getInvoice` - Get invoice details
  - [ ] `getCustomerInvoices` - Invoices by customer
- [ ] Implement actions:
  - [ ] `createInvoice` - Create from debts
  - [ ] `updateInvoice` - Update draft
  - [ ] `sendInvoice` - Mark as sent
  - [ ] `cancelInvoice` - Cancel invoice
  - [ ] `generateInvoicePDF` - Export to PDF

#### **Frontend Tasks**
- [ ] Create InvoicesListPage
- [ ] Create InvoiceDetailsPage
- [ ] Create InvoiceFormModal
- [ ] Add "Tạo hóa đơn" from debts
- [ ] PDF preview & download
- [ ] Email invoice (future)

#### **Business Logic**
- [ ] Auto-generate invoice number (format: INV-YYYYMM-0001)
- [ ] Calculate subtotal, tax, total
- [ ] Group debts by customer for invoicing
- [ ] Validation rules

**Deliverable**: Generate invoices from debts, export to PDF

---

### **M2.4: Financial Reports** (Week 4)

#### **Reports to Implement**
1. **Debt Aging Report**
   - Group debts by age (0-30, 31-60, 61-90, 90+ days)
   - Show by customer
   - Highlight overdue

2. **Revenue Report**
   - Revenue by month
   - Revenue by customer
   - Revenue by debt type

3. **Payment Collection Report**
   - Collection rate by month
   - Average collection time
   - Outstanding balance

4. **Customer Statement**
   - All debts for a customer
   - Payment history
   - Current balance

#### **Backend Tasks**
- [ ] Create report queries:
  - [ ] `getDebtAgingReport`
  - [ ] `getRevenueReport`
  - [ ] `getCollectionReport`
  - [ ] `getCustomerStatement`
- [ ] Implement export to Excel
- [ ] Implement export to PDF

#### **Frontend Tasks**
- [ ] Create ReportsPage with tabs
- [ ] Create charts (using recharts or similar)
- [ ] Add date range picker
- [ ] Add export buttons
- [ ] Print-friendly views

**Deliverable**: Comprehensive financial reports

---

## 🎨 M3 – Optimization & Integration (FUTURE)

**Timeline**: 4-6 weeks  
**Priority**: Medium

### **M3.1: Dashboard & KPIs** (Week 1-2)

#### **Dashboards**
1. **Operations Dashboard**
   - Active shipments
   - Pending dispatches
   - Completion rate
   - Vehicle utilization

2. **Financial Dashboard**
   - Total debts (unpaid, paid, overdue)
   - Revenue trends
   - Collection rate
   - Top customers

3. **Performance Dashboard**
   - On-time delivery rate
   - Average delivery time
   - Driver performance
   - Customer satisfaction

#### **Tasks**
- [ ] Design dashboard layouts
- [ ] Implement KPI calculations
- [ ] Create chart components
- [ ] Add real-time updates
- [ ] Add date range filters

---

### **M3.2: Advanced Features** (Week 3-4)

#### **Notifications System**
- [ ] Email notifications
  - [ ] Debt reminders (3 days before due)
  - [ ] Overdue alerts
  - [ ] Payment confirmations
  - [ ] Shipment status updates
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Notification history

#### **User Management**
- [ ] User CRUD (Admin only)
- [ ] Role management
- [ ] Permission matrix
- [ ] Activity logs
- [ ] User audit trail

#### **Settings & Configuration**
- [ ] Company settings
- [ ] Email templates
- [ ] Notification settings
- [ ] Default values
- [ ] System preferences

---

### **M3.3: External Integrations** (Week 5-6)

#### **GPS Integration**
- [ ] Real-time vehicle tracking
- [ ] Route optimization
- [ ] ETA calculation
- [ ] Geofencing alerts

#### **ePOD Integration**
- [ ] Digital signature capture
- [ ] Photo capture with GPS
- [ ] Timestamp verification
- [ ] Auto-sync to system

#### **Accounting Software Integration**
- [ ] Export to accounting format
- [ ] Bank reconciliation
- [ ] Tax reporting
- [ ] API integration

---

## 📅 Detailed Timeline

### **Current Sprint (Week 1-2): Testing & Polish**

**Week 1: Testing**
- [ ] Day 1-2: Comprehensive testing of all features
- [ ] Day 3-4: Bug fixes
- [ ] Day 5: User acceptance testing

**Week 2: Polish**
- [ ] Day 1-2: UI/UX improvements (toasts, loading, confirmations)
- [ ] Day 3: Performance optimization
- [ ] Day 4: Documentation
- [ ] Day 5: User training

---

### **Next Sprint (Week 3-6): M2 - Financial Layer**

**Week 3: Charge Items**
- [ ] Day 1-2: Database & backend
- [ ] Day 3-4: Frontend components
- [ ] Day 5: Testing & integration

**Week 4: Auto-create Debts**
- [ ] Day 1-2: Link shipments to debts
- [ ] Day 3-4: Auto-creation logic
- [ ] Day 5: Testing

**Week 5: Invoice Generation**
- [ ] Day 1-2: Invoice models & backend
- [ ] Day 3-4: Invoice UI & PDF export
- [ ] Day 5: Testing

**Week 6: Financial Reports**
- [ ] Day 1-2: Report queries
- [ ] Day 3-4: Charts & UI
- [ ] Day 5: Testing & polish

---

## 🎯 Feature Priority Matrix

| Feature | Business Value | Complexity | Priority | Timeline |
|---------|---------------|------------|----------|----------|
| **Testing & Polish** | High | Low | P0 | Week 1-2 |
| **Charge Items** | High | Medium | P1 | Week 3 |
| **Auto-create Debts** | High | Medium | P1 | Week 4 |
| **Invoice Generation** | High | High | P1 | Week 5 |
| **Financial Reports** | High | Medium | P1 | Week 6 |
| **Dashboard & KPIs** | Medium | Medium | P2 | Week 7-8 |
| **Notifications** | Medium | Medium | P2 | Week 9 |
| **User Management** | Medium | Low | P2 | Week 10 |
| **GPS Integration** | Low | High | P3 | Future |
| **ePOD Integration** | Low | High | P3 | Future |

---

## 📋 Detailed Task Breakdown

### **IMMEDIATE: Testing & Polish (Week 1-2)**

#### **Day 1: Comprehensive Testing**
- [ ] **Debt Management**
  - [ ] Test create debt (all fields, validations)
  - [ ] Test edit debt (UNPAID and PAID)
  - [ ] Test delete debt
  - [ ] Test mark as paid
  - [ ] Test file upload (invoices, payment proofs)
  - [ ] Test file removal
  - [ ] Test filters (month, customer, status, overdue)
  - [ ] Test search

- [ ] **Customer Management**
  - [ ] Test create customer
  - [ ] Test edit customer
  - [ ] Test delete customer (with/without debts)
  - [ ] Test search
  - [ ] Test customer details page

- [ ] **Logistics**
  - [ ] Test shipment CRUD
  - [ ] Test dispatch
  - [ ] Test status updates
  - [ ] Test POD upload

- [ ] **UI/UX**
  - [ ] Test sidebar (desktop)
  - [ ] Test sidebar (mobile)
  - [ ] Test responsive design (all breakpoints)
  - [ ] Test all modals
  - [ ] Test all forms

#### **Day 2: Bug Fixes**
- [ ] Fix all bugs found in Day 1
- [ ] Regression testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

#### **Day 3: UI/UX Improvements**
- [ ] Replace all `alert()` with Toast notifications
  - [ ] Install toast library (react-hot-toast or sonner)
  - [ ] Create Toast component
  - [ ] Replace all alerts
- [ ] Add loading skeletons
  - [ ] Table skeleton
  - [ ] Card skeleton
  - [ ] Form skeleton
- [ ] Add confirmation dialogs
  - [ ] Delete confirmations
  - [ ] Cancel confirmations
  - [ ] Custom dialog component

#### **Day 4: Better Error Handling**
- [ ] Error boundary component
- [ ] Network error handling
- [ ] Form validation improvements
- [ ] Better error messages
- [ ] Retry mechanisms

#### **Day 5: Performance & Accessibility**
- [ ] Add pagination to lists
- [ ] Optimize queries (add indexes)
- [ ] Lazy loading for images
- [ ] Accessibility audit (a11y)
- [ ] Keyboard navigation
- [ ] Screen reader support

---

### **Week 2: Documentation & Training**

#### **Day 1-2: Documentation**
- [ ] Update README.md
- [ ] Create USER_GUIDE.md
  - [ ] How to create debt
  - [ ] How to mark as paid
  - [ ] How to manage customers
  - [ ] How to use filters
  - [ ] How to upload files
- [ ] Create ADMIN_GUIDE.md
  - [ ] User management
  - [ ] Permissions
  - [ ] Troubleshooting
- [ ] API documentation
- [ ] Code comments

#### **Day 3: User Training Materials**
- [ ] Create training slides
- [ ] Record demo videos
- [ ] Create quick reference cards
- [ ] FAQ document

#### **Day 4: User Training Session**
- [ ] Schedule training with Accounting team
- [ ] Live demo
- [ ] Q&A session
- [ ] Collect feedback

#### **Day 5: Deployment Preparation**
- [ ] Production environment setup
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Rollback plan
- [ ] Go-live checklist

---

### **M2.1: Charge Items (Week 3)**

#### **Day 1: Database & Models**
- [ ] Design ChargeItem schema
- [ ] Create migration
- [ ] Update Shipment model
- [ ] Test migration on dev database

#### **Day 2: Backend Implementation**
- [ ] Implement queries (getShipmentCharges, calculateTotal)
- [ ] Implement actions (add, update, delete charges)
- [ ] Add validation logic
- [ ] Write unit tests
- [ ] Test with curl/Postman

#### **Day 3: Frontend Components**
- [ ] Create ChargeItemForm component
- [ ] Create ChargeItemsList component
- [ ] Create ChargeTypeSelect component
- [ ] Add to ShipmentDetailsPage

#### **Day 4: Freight Calculator**
- [ ] Design calculation rules
- [ ] Implement calculator logic
- [ ] Create calculator UI
- [ ] Add "Tính cước" button
- [ ] Test calculations

#### **Day 5: Integration & Testing**
- [ ] Integration testing
- [ ] Browser testing
- [ ] Fix bugs
- [ ] User testing
- [ ] Documentation

---

### **M2.2: Auto-create Debts (Week 4)**

#### **Day 1: Design & Planning**
- [ ] Design auto-creation flow
- [ ] Define trigger conditions
- [ ] Define mapping rules (shipment → debt)
- [ ] Review with stakeholders

#### **Day 2: Backend Implementation**
- [ ] Update Debt model (add shipmentId)
- [ ] Create migration
- [ ] Implement `autoCreateDebtFromShipment` action
- [ ] Add shipment-debt linking logic
- [ ] Write tests

#### **Day 3: Frontend Integration**
- [ ] Add "Tạo công nợ" button to ShipmentDetailsPage
- [ ] Show linked debts in shipment
- [ ] Show linked shipment in debt
- [ ] Handle manual vs auto-created debts

#### **Day 4: Business Logic**
- [ ] Implement calculation rules
- [ ] Handle edge cases (no charges, multiple debts)
- [ ] Validation logic
- [ ] Error handling

#### **Day 5: Testing**
- [ ] Test auto-creation flow
- [ ] Test manual creation still works
- [ ] Test linking
- [ ] Fix bugs
- [ ] Documentation

---

### **M2.3: Invoice Generation (Week 5)**

#### **Day 1-2: Database & Backend**
- [ ] Create Invoice & InvoiceItem models
- [ ] Create migration
- [ ] Implement invoice queries
- [ ] Implement invoice actions
- [ ] Invoice number generation logic

#### **Day 3: PDF Generation**
- [ ] Install PDF library (pdfmake or react-pdf)
- [ ] Design invoice template
- [ ] Implement PDF generation
- [ ] Add company logo/branding
- [ ] Test PDF output

#### **Day 4: Frontend**
- [ ] Create InvoicesListPage
- [ ] Create InvoiceDetailsPage
- [ ] Create InvoiceFormModal
- [ ] Add "Tạo hóa đơn" from debts
- [ ] PDF preview & download

#### **Day 5: Testing & Polish**
- [ ] Test invoice creation
- [ ] Test PDF generation
- [ ] Test email sending (if implemented)
- [ ] Fix bugs
- [ ] Documentation

---

### **M2.4: Financial Reports (Week 6)**

#### **Day 1: Report Design**
- [ ] Design report layouts
- [ ] Define data requirements
- [ ] Choose chart library
- [ ] Create mockups

#### **Day 2: Backend Queries**
- [ ] Implement debt aging report query
- [ ] Implement revenue report query
- [ ] Implement collection report query
- [ ] Implement customer statement query
- [ ] Optimize queries for performance

#### **Day 3: Charts & Visualizations**
- [ ] Install chart library (recharts)
- [ ] Create chart components
- [ ] Implement debt aging chart
- [ ] Implement revenue trend chart
- [ ] Implement collection rate chart

#### **Day 4: Reports Page**
- [ ] Create ReportsPage with tabs
- [ ] Add date range picker
- [ ] Add filters
- [ ] Add export buttons (Excel, PDF)
- [ ] Implement print view

#### **Day 5: Testing & Polish**
- [ ] Test all reports
- [ ] Test exports
- [ ] Test with large datasets
- [ ] Performance optimization
- [ ] Documentation

---

## 🎯 Success Criteria by Milestone

### **M2 Success Criteria**
- ✅ Can add charges to shipments
- ✅ Debts auto-created from completed shipments
- ✅ Can generate invoices from debts
- ✅ Can export invoices to PDF
- ✅ Financial reports available
- ✅ Export reports to Excel
- ✅ All features tested and working
- ✅ User training completed

### **M3 Success Criteria**
- ✅ Dashboard shows real-time KPIs
- ✅ Notifications working (email + in-app)
- ✅ User management functional
- ✅ Performance optimized
- ✅ Ready for external integrations

---

## 🔄 Agile Process

### **Sprint Structure**
- **Sprint Length**: 1 week
- **Sprint Planning**: Monday morning
- **Daily Standup**: Every morning (15 min)
- **Sprint Review**: Friday afternoon
- **Sprint Retro**: Friday end of day

### **Definition of Done**
- [ ] Code written and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Browser tested
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approved

---

## 📞 Decision Points

**Cần quyết định ngay:**

### **1. Immediate Next Steps**
**Question**: Bạn muốn làm gì tiếp theo?

**Option A**: Testing & Polish (1-2 tuần)
- Pros: Đảm bảo chất lượng, sẵn sàng production
- Cons: Chưa có features mới

**Option B**: M2.1 - Charge Items (1 tuần)
- Pros: Bắt đầu M2, có giá trị business cao
- Cons: Chưa test kỹ features hiện tại

**Option C**: M2.2 - Auto-create Debts (1 tuần)
- Pros: Tự động hóa, tiết kiệm thời gian
- Cons: Phụ thuộc vào Charge Items

**👉 Recommendation**: Option A (Testing & Polish) để đảm bảo hệ thống stable trước khi thêm features mới

---

### **2. Invoice Generation Priority**
**Question**: Có cần Invoice generation ngay không?

- **Yes**: Implement trong M2 (Week 5)
- **No**: Defer to later milestone

**👉 Recommendation**: Yes - Invoice là phần quan trọng của financial layer

---

### **3. Notification System**
**Question**: Email notifications có cần thiết cho MVP không?

- **Yes**: Implement trong M2
- **No**: Defer to M3

**👉 Recommendation**: No - Defer to M3, focus on core features first

---

### **4. Dashboard Priority**
**Question**: Dashboard cần implement khi nào?

- **Now**: Trong M2
- **Later**: Trong M3
- **Much Later**: Post-M3

**👉 Recommendation**: Later (M3) - Focus on transactional features first

---

## 🎬 Next Actions

**Để tiếp tục, bạn cần quyết định:**

1. ✅ **Approve plan này** hoặc điều chỉnh
2. ✅ **Chọn next milestone**: Testing & Polish, hoặc M2.1, hoặc khác?
3. ✅ **Confirm priorities**: Invoice? Notifications? Dashboard?
4. ✅ **Set timeline**: Khi nào cần go-live?

**Sau khi bạn quyết định, tôi sẽ:**
- Tạo detailed tasks cho milestone được chọn
- Update TODO list
- Bắt đầu implementation

---

## 📝 Notes

- Plan này là living document, sẽ update theo tiến độ
- Có thể điều chỉnh priorities dựa trên feedback
- Timeline có thể thay đổi dựa trên complexity thực tế

---

**Ready to proceed?** Hãy cho tôi biết bạn muốn đi theo hướng nào! 🚀
