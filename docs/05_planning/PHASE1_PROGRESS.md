# 🚀 PHASE 1 PROGRESS - Customer Portal & New Entities

**Ngày bắt đầu:** 12/02/2026  
**Trạng thái:** 🟢 In Progress  
**Module hiện tại:** Customer Portal Backend

---

## ✅ ĐÃ HOÀN THÀNH

### 1. **Schema Updates** ✅ (100%)

#### Entities Added (4):
- ✅ ShipmentDocument - Document management
- ✅ Charge - Charge management  
- ✅ Invoice - Invoice management
- ✅ InvoiceItem - Invoice line items

#### Entities Updated (4):
- ✅ Shipment - Thêm 5 fields (createdById, createdByType, specialInstructions, containerNumber, containerType)
- ✅ User - Thêm 5 relations
- ✅ Customer - Thêm invoices relation
- ✅ Debt - Thêm invoiceId field

#### Enums Added (3):
- ✅ DocumentType - 7 values
- ✅ ChargeType - 11 values
- ✅ InvoiceStatus - 6 values

#### Database:
- ✅ 4 tables created (shipment_documents, charges, invoices, invoice_items)
- ✅ 6 columns added to existing tables
- ✅ 3 enums created
- ✅ 9 indexes created
- ✅ 12 foreign keys created
- ✅ All migrations applied successfully

---

### 2. **Customer Portal Backend** ✅ (100%)

#### Queries Created (3):
- ✅ `getMyShipments` - Lấy danh sách shipments của customer
  - Filter by customerId
  - Include: customer, createdBy, stops, dispatch, statusEvents, pods
  - Permission check: CUSTOMER users only
  
- ✅ `getMyShipmentDetails` - Chi tiết shipment
  - Permission check: Customer owns shipment
  - Full details với all relations
  
- ✅ `getMyShipmentStats` - Thống kê dashboard
  - Total, draft, ready, assigned, inTransit, completed
  - Active shipments count

#### Actions Created (4):
- ✅ `createShipmentRequest` - Customer tạo shipment request
  - Validation: Customer active, stops valid, dates valid
  - Auto-generate shipment number: SHP-YYYY-XXXX
  - Status: DRAFT
  - createdByType: CUSTOMER
  
- ✅ `updateShipmentRequest` - Customer cập nhật shipment
  - Only DRAFT status
  - Permission check: Customer owns shipment
  - Can update: priority, dates, stops, container info
  
- ✅ `cancelShipmentRequest` - Customer hủy shipment
  - Only DRAFT or READY status
  - Permission check: Customer owns shipment
  - Create status event
  
- ✅ `confirmDocuments` - Customer xác nhận chứng từ
  - Create status event (NOTE type)
  - Permission check: Customer owns shipment

#### Wasp Configuration:
- ✅ 5 routes added (CustomerDashboard, MyShipments, CreateRequest, ShipmentDetails, MyDebts)
- ✅ 3 queries registered
- ✅ 4 actions registered
- ✅ All entities linked correctly

#### Compilation:
- ✅ TypeScript: No errors
- ✅ Wasp: Compiled successfully
- ✅ Backend ready for frontend

---

## 🔄 ĐANG LÀM

### 3. **Customer Portal Frontend** ⏳ (0%)

#### Pages cần tạo (5):
- [ ] `CustomerDashboardPage.tsx` - Dashboard tổng quan
  - Shipment stats (total, active, completed)
  - Recent shipments
  - Debt overview (CUSTOMER_OWNER only)
  
- [ ] `MyShipmentsPage.tsx` - Danh sách shipments
  - Filter: status, date range
  - Search: shipment number, container number
  - Sort: date, status, priority
  - Card view với status badges
  
- [ ] `CreateShipmentRequestPage.tsx` - Tạo shipment request
  - Multi-step wizard (3 steps)
  - Step 1: Basic info (priority, dates, container)
  - Step 2: Stops configuration
  - Step 3: Review & submit
  
- [ ] `MyShipmentDetailsPage.tsx` - Chi tiết shipment
  - Shipment info
  - Stops timeline
  - Dispatch info (vehicle, driver)
  - Status events history
  - POD documents
  - Document verification button
  
- [ ] `MyDebtsPage.tsx` - Công nợ (CUSTOMER_OWNER only)
  - Reuse existing debt components
  - Filter by customer

#### Components cần tạo (4):
- [ ] `ShipmentRequestForm.tsx` - Form tạo/sửa request
- [ ] `MyShipmentCard.tsx` - Card hiển thị shipment
- [ ] `ShipmentStatusTimeline.tsx` - Timeline trạng thái
- [ ] `DocumentVerification.tsx` - Button xác nhận chứng từ

#### Navigation:
- [ ] Update `Sidebar.tsx` - Thêm customer menu items
  - Dashboard
  - My Shipments
  - Create Request
  - My Debts (CUSTOMER_OWNER only)

---

## ⏳ PENDING

### 4. **Testing** (0%)
- [ ] Test getMyShipments query
- [ ] Test createShipmentRequest action
- [ ] Test updateShipmentRequest action
- [ ] Test cancelShipmentRequest action
- [ ] Test confirmDocuments action
- [ ] Test với CUSTOMER_OPS role
- [ ] Test với CUSTOMER_OWNER role
- [ ] Browser testing - UI/UX
- [ ] Permission checks
- [ ] Error handling

---

## 📊 PROGRESS SUMMARY

### Overall PHASE 1 Progress: 40%

| Module | Progress | Status |
|--------|----------|--------|
| Schema Updates | 100% | ✅ Complete |
| Customer Portal Backend | 100% | ✅ Complete |
| Customer Portal Frontend | 0% | ⏳ Next |
| Document Management | 0% | ⏳ Pending |
| Charge & Invoice | 0% | ⏳ Pending |
| Cloud Storage | 0% | ⏳ Pending |

### Customer Portal Module: 50%
- ✅ Schema: 100%
- ✅ Backend: 100%
- ⏳ Frontend: 0%
- ⏳ Testing: 0%

---

## 📋 FILES CREATED

### Backend (2 files):
1. ✅ `/src/customer/queries/shipments.ts` - 3 queries
2. ✅ `/src/customer/actions/shipments.ts` - 4 actions

### Migrations (2 files):
1. ✅ `/migrations/20260212_add_shipment_customer_fields/migration.sql`
2. ✅ `/migrations/20260212_add_document_charge_invoice/migration.sql`

### Documentation (3 files):
1. ✅ `/docs/05_planning/SCHEMA_UPDATES_SUMMARY.md`
2. ✅ `/docs/01_core/08_ERD.md` (updated to v2.2)
3. ✅ `/docs/05_planning/PHASE1_PROGRESS.md` (this file)

### Configuration:
1. ✅ `/main.wasp` - Added customer routes, queries, actions

---

## 🎯 NEXT ACTIONS

### Immediate (Bây giờ):
1. ⏳ Tạo CustomerDashboardPage.tsx
2. ⏳ Tạo MyShipmentsPage.tsx
3. ⏳ Tạo CreateShipmentRequestPage.tsx
4. ⏳ Tạo MyShipmentDetailsPage.tsx
5. ⏳ Tạo MyDebtsPage.tsx

### Then:
6. ⏳ Tạo components (ShipmentRequestForm, MyShipmentCard, etc.)
7. ⏳ Update Sidebar navigation
8. ⏳ Testing workflow

---

## 🔍 BACKEND API READY

### Customer Queries:
```typescript
// Get all shipments for customer
const shipments = await getMyShipments();

// Get shipment details
const shipment = await getMyShipmentDetails({ id: 'xxx' });

// Get dashboard stats
const stats = await getMyShipmentStats();
// Returns: { total, draft, ready, assigned, inTransit, completed, active }
```

### Customer Actions:
```typescript
// Create shipment request
const shipment = await createShipmentRequest({
  priority: 'NORMAL',
  plannedStartDate: new Date(),
  plannedEndDate: new Date(),
  containerNumber: 'CONT123',
  containerType: '40ft',
  specialInstructions: 'Handle with care',
  stops: [...]
});

// Update shipment (DRAFT only)
await updateShipmentRequest({
  shipmentId: 'xxx',
  priority: 'HIGH',
  stops: [...]
});

// Cancel shipment (DRAFT/READY only)
await cancelShipmentRequest({ shipmentId: 'xxx' });

// Confirm documents
await confirmDocuments({ shipmentId: 'xxx' });
```

---

## 💡 TECHNICAL NOTES

### Permission Model:
- ✅ All queries check `user.userType === 'CUSTOMER'`
- ✅ All queries filter by `user.customerId`
- ✅ All actions verify customer owns the shipment
- ✅ CUSTOMER_OPS & CUSTOMER_OWNER have same shipment permissions
- ✅ CUSTOMER_OWNER additionally can view debts

### Shipment Number Format:
- ✅ `SHP-YYYY-XXXX` (e.g., SHP-2026-0001)
- ✅ Auto-incremented based on total count

### Status Workflow:
```
Customer creates → DRAFT
  ↓ OPS/DISPATCHER confirms
READY
  ↓ DISPATCHER dispatches
ASSIGNED
  ↓ DRIVER updates
IN_TRANSIT
  ↓ DRIVER completes
COMPLETED
```

### Customer Can:
- ✅ Create shipment (→ DRAFT)
- ✅ Update shipment (only DRAFT)
- ✅ Cancel shipment (DRAFT or READY)
- ✅ View all shipments of their company
- ✅ Confirm documents received
- ❌ Cannot dispatch
- ❌ Cannot update status (except cancel)

---

**Status:** ✅ Backend Complete - Ready for Frontend Implementation  
**Next:** Create Customer Portal Pages & Components
