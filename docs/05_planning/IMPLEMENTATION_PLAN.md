# 📋 IMPLEMENTATION PLAN - UNICON SCHEDULE

**Ngày tạo:** 12/02/2026  
**Phiên bản:** 1.1  
**Cập nhật:** 12/02/2026  
**Trạng thái:** Active Development

---

## 🔄 THAY ĐỔI QUAN TRỌNG (v1.1)

### ✨ Điều chỉnh chiến lược triển khai

**Thay đổi chính:**
- ❌ **Bỏ "Order Management" module riêng** - Không cần thiết theo PRD
- ✅ **Focus vào "Customer Shipment Creation"** - Khách hàng tự tạo Shipment trực tiếp
- ✅ **Tối ưu workflow theo PRD Flow #1 & #2:**
  - **Flow #1:** Customer tự tạo Shipment request qua portal
  - **Flow #2:** Điều xe tạo Shipment + Dispatch nhanh

**Lý do:**
- PRD không yêu cầu Order Management phức tạp
- Order model đã tồn tại nhưng có thể dùng sau (optional)
- Tập trung vào Shipment workflow - đơn giản và hiệu quả hơn
- Khách hàng tạo Shipment request → OPS/Dispatcher xác nhận → Dispatch

**Impact:**
- PHASE 1 được tái cấu trúc:
  - 1.1: Customer Portal - Shipment Creation (7 tasks)
  - 1.2: Internal Shipment Enhancement (3 tasks)
  - 1.3: Document Management (giữ nguyên)
  - 1.4: Charge & Invoice (giữ nguyên)
  - 1.5: Cloud Storage (giữ nguyên)

---

## 📊 TỔNG QUAN Dự ÁN

### Mục tiêu
Hoàn thiện hệ thống quản lý vận tải container nội địa theo PRD, bổ sung các tính năng còn thiếu để đáp ứng đầy đủ yêu cầu nghiệp vụ.

### Tiến độ hiện tại
- **Tổng số tính năng:** ~40 major features
- **Đã hoàn thành:** 9 features (22.5%)
- **Đang triển khai:** 3 features (7.5%)
- **Chưa triển khai:** 28 features (70%)
- **Tỷ lệ hoàn thành tổng thể:** ~60-65%

---

## 🔍 PHÂN TÍCH HIỆN TRẠNG

### ✅ ĐÃ TRIỂN KHAI (60-65% hoàn thành)

#### 1. **Quản lý Shipment** (80% hoàn thành)
**Vị trí code:** `/src/logistics/`

**Đã có:**
- ✅ Tạo shipment với multi-step wizard
- ✅ Xem danh sách shipments với filter
- ✅ Chi tiết shipment với stops, dispatch, events
- ✅ Cập nhật shipment
- ✅ Theo dõi trạng thái (DRAFT → READY → ASSIGNED → IN_TRANSIT → COMPLETED)
- ✅ Priority levels (LOW, NORMAL, HIGH, URGENT)
- ✅ Stop types (PICKUP, DROPOFF, DEPOT, PORT)

**Thiếu:**
- ❌ Khách hàng tự tạo shipment request
- ❌ Upload documents khi tạo shipment

**Files chính:**
- `src/logistics/pages/OpsShipmentsPage.tsx`
- `src/logistics/pages/CreateShipmentPage.tsx`
- `src/logistics/pages/ShipmentDetailsPage.tsx`
- `src/logistics/actions/shipments.ts`
- `src/logistics/queries/shipments.ts`

---

#### 2. **Dispatch Operations** (90% hoàn thành)
**Vị trí code:** `/src/logistics/pages/DispatcherDashboardPage.tsx`

**Đã có:**
- ✅ Dashboard điều xe
- ✅ Xem pending shipments
- ✅ Xem available vehicles & drivers
- ✅ Gán xe/tài xế cho shipment
- ✅ Assignment notes
- ✅ One-to-one shipment-dispatch relationship

**Thiếu:**
- ❌ Upload booking documents khi dispatch
- ❌ Upload shipment documents

**Files chính:**
- `src/logistics/pages/DispatcherDashboardPage.tsx`
- `src/logistics/actions/dispatch.ts`
- `src/logistics/queries/dispatch.ts`

---

#### 3. **Quản lý Công nợ** (95% hoàn thành)
**Vị trí code:** `/src/debt/`

**Đã có:**
- ✅ CRUD công nợ (create, update, delete, cancel)
- ✅ Debt types: FREIGHT, ADVANCE, OTHER
- ✅ Debt status: UNPAID, PAID, OVERDUE, CANCELLED
- ✅ Monthly tracking (YYYY-MM format)
- ✅ Payment processing với proof images
- ✅ Partial payment support
- ✅ Auto-calculate due dates
- ✅ Summary reports by customer & month
- ✅ Overdue tracking

**Thiếu:**
- ❌ Auto-generate debt từ invoice
- ❌ Automated debt reminders

**Files chính:**
- `src/debt/pages/DebtsListPage.tsx`
- `src/debt/pages/DebtDetailsPage.tsx`
- `src/debt/actions/debts.ts`
- `src/debt/actions/payment.ts`
- `src/debt/queries/debts.ts`
- `src/debt/queries/summary.ts`

---

#### 4. **Quản lý Khách hàng** (85% hoàn thành)
**Vị trí code:** `/src/debt/pages/`

**Đã có:**
- ✅ CRUD customers
- ✅ Payment terms configuration (days/months)
- ✅ Statement frequency settings
- ✅ VAT invoice settings (tax code, address)
- ✅ Customer status (ACTIVE/INACTIVE)
- ✅ Link customers với users

**Thiếu:**
- ❌ Customer portal interface
- ❌ Customer self-registration

**Files chính:**
- `src/debt/pages/CustomersListPage.tsx`
- `src/debt/pages/CustomerDetailsPage.tsx`
- `src/debt/actions/customers.ts`
- `src/debt/queries/customers.ts`

---

#### 5. **Quản lý Phương tiện** (100% hoàn thành)
**Vị trí code:** `/src/resources/`

**Đã có:**
- ✅ CRUD vehicles
- ✅ Vehicle types: TRACTOR, TRAILER
- ✅ Vehicle status: IN_USE, MAINTENANCE, OUT_OF_SERVICE
- ✅ Company assignment: KHANH_HUY, UNICON, RENTAL
- ✅ Multi-image upload (registration, inspection, insurance)
- ✅ Expiry date tracking
- ✅ Manufacturing year

**Files chính:**
- `src/resources/pages/VehiclesListPage.tsx`
- `src/resources/pages/VehicleDetailsPage.tsx`
- `src/resources/actions/vehicles.ts`
- `src/resources/queries/vehicles.ts`

---

#### 6. **Quản lý Tài xế** (100% hoàn thành)
**Vị trí code:** `/src/resources/`

**Đã có:**
- ✅ CRUD drivers
- ✅ Link với User account
- ✅ Citizen ID images (multi-upload)
- ✅ License images (multi-upload)
- ✅ Birth year, hometown
- ✅ License expiry tracking
- ✅ Driver status: ACTIVE, INACTIVE, SUSPENDED

**Files chính:**
- `src/resources/pages/DriversListPage.tsx`
- `src/resources/pages/DriverDetailsPage.tsx`
- `src/resources/actions/drivers.ts`
- `src/resources/queries/drivers.ts`

---

#### 7. **Quản lý User** (100% hoàn thành)
**Vị trí code:** `/src/admin/`

**Đã có:**
- ✅ CRUD users
- ✅ Role management (ADMIN, ACCOUNTING, OPS, DISPATCHER, DRIVER, CUSTOMER_OWNER, CUSTOMER_OPS)
- ✅ User types: INTERNAL, CUSTOMER
- ✅ Update user role & status
- ✅ Force password reset
- ✅ Delete user (cascade delete)

**Files chính:**
- `src/admin/pages/UsersListPage.tsx`
- `src/admin/pages/UserDetailsPage.tsx`
- `src/admin/actions/users.ts`
- `src/admin/queries/users.ts`

---

#### 8. **Authentication** (100% hoàn thành)
**Vị trí code:** `/src/auth/`

**Đã có:**
- ✅ Email/password authentication
- ✅ Login, Signup, Logout
- ✅ Email verification
- ✅ Password reset
- ✅ JWT-based auth

**Files chính:**
- `src/auth/email/LoginPage.tsx`
- `src/auth/email/SignupPage.tsx`
- `src/auth/email/PasswordResetPage.tsx`
- `src/auth/email/EmailVerificationPage.tsx`

---

### ⚠️ ĐANG TRIỂN KHAI MỘT PHẦN

#### 9. **Upload POD** (70% hoàn thành)
**Vị trí code:** `/src/logistics/actions/pods.ts`

**Đã có:**
- ✅ Backend action uploadPOD
- ✅ File type support: JPG, PNG, PDF
- ✅ 5MB file size limit
- ✅ Link POD to specific stops
- ✅ Permissions: DRIVER, OPS, ADMIN

**Thiếu:**
- ❌ Cloud storage integration (S3/Cloudinary)
- ❌ Currently stores file path only

**Files chính:**
- `src/logistics/actions/pods.ts`

---

#### 10. **Customer Shipment Creation** (20% hoàn thành)
**PRD Flow #1 & #2:** Khách hàng tự tạo shipment hoặc gửi thông tin cho Điều xe

**Đã có:**
- ✅ Shipment schema trong database
- ✅ Internal shipment creation (OPS/DISPATCHER)
- ✅ Query getAllShipments, getShipment
- ✅ Shipment status workflow: DRAFT → READY → ASSIGNED → IN_TRANSIT → COMPLETED

**Thiếu:**
- ❌ Customer-facing shipment creation UI
- ❌ Customer portal để tạo shipment request
- ❌ Workflow: Customer tạo → OPS/Dispatcher xác nhận → Dispatch
- ❌ Customer view để theo dõi shipments của mình

**Hiện trạng:**
- Shipment hiện chỉ được tạo bởi internal users (OPS, DISPATCHER, ADMIN)
- Khách hàng chưa có giao diện để tự tạo shipment request
- Cần tạo Customer Portal với role-based access (CUSTOMER_OPS, CUSTOMER_OWNER)

**Schema hiện tại:**
```prisma
model Shipment {
  id                String         @id @default(uuid())
  orderId           String         // Link to Order (optional)
  shipmentNumber    String         @unique
  currentStatus     ShipmentStatus @default(DRAFT)
  priority          Priority       @default(NORMAL)
  plannedStartDate  DateTime
  plannedEndDate    DateTime
  actualStartDate   DateTime?
  actualEndDate     DateTime?
  
  order             Order                @relation(...)
  stops             ShipmentStop[]
  dispatch          Dispatch?
  statusEvents      ShipmentStatusEvent[]
  pods              POD[]
}

model Order {
  id                 String       @id @default(uuid())
  customerId         String
  orderNumber        String       @unique
  description        String?
  totalWeight        Decimal?
  totalVolume        Decimal?
  specialInstructions String?
  status             OrderStatus  @default(DRAFT)
  
  customer  Customer   @relation(...)
  shipments Shipment[]
}
```

**Lưu ý:**
- Order model đã tồn tại nhưng chưa được sử dụng đầy đủ
- Order có thể được dùng như một "container" cho nhiều shipments
- Hoặc có thể bỏ qua Order và cho phép customer tạo Shipment trực tiếp

---

#### 11. **Invoice/Charge Management** (10% hoàn thành)

**Đã có:**
- ✅ Debt management (có thể track amounts)
- ✅ Invoice images upload trong debts

**Thiếu:**
- ❌ Charge breakdown per shipment
- ❌ Invoice generation
- ❌ Itemized billing
- ❌ Charge calculation logic
- ❌ Invoice templates

---

### ❌ CHƯA TRIỂN KHAI (theo PRD)

#### 12. **Customer Portal** (0% hoàn thành)
**PRD Requirements:** Customer-facing features

**Cần triển khai:**
- ❌ Customer shipment request
- ❌ Shipment tracking view
- ❌ GPS tracking reference
- ❌ Document verification
- ❌ Customer dashboard
- ❌ Communication tools

---

#### 13. **Document Management** (0% hoàn thành)
**PRD Flow #4:** Upload booking, shipment documents

**Cần triển khai:**
- ❌ Booking upload
- ❌ Shipment documents repository
- ❌ Document verification workflow
- ❌ Document templates
- ❌ Document sharing với customers

---

#### 14. **GPS Tracking** (0% hoàn thành)
**PRD Requirement:** Real-time vehicle tracking

**Cần triển khai:**
- ❌ GPS device integration
- ❌ Real-time tracking
- ❌ Route history
- ❌ Geofencing
- ❌ ETA calculation

---

#### 15. **Notifications** (0% hoàn thành)
**PRD Requirement:** Automated alerts

**Cần triển khai:**
- ❌ Push notifications
- ❌ Email notifications
- ❌ SMS alerts
- ❌ In-app notifications
- ❌ Debt reminders

---

#### 16. **Reporting & Analytics** (15% hoàn thành)
**Hiện có:** Basic debt summaries only

**Cần triển khai:**
- ❌ Shipment reports
- ❌ Financial reports
- ❌ Performance metrics
- ❌ Driver analytics
- ❌ Vehicle utilization
- ❌ Export to Excel/PDF

---

#### 17. **Driver Mobile App** (0% hoàn thành)
**PRD Requirement:** Mobile app for drivers

**Cần triển khai:**
- ❌ React Native/Flutter app
- ❌ Push notifications for assignments
- ❌ Driver-specific UI
- ❌ GPS tracking integration
- ❌ Real-time location updates

---

## 🎯 KẾ HOẠCH TRIỂN KHAI

### PHASE 1: Critical Features (Ưu tiên cao - 2-4 tuần)

#### 1.1 Customer Portal - Shipment Creation
**Mục tiêu:** Cho phép khách hàng tự tạo shipment request (PRD Flow #1 & #2)

**Phân tích yêu cầu:**
- **Flow 1:** Khách hàng tự tạo shipment request qua portal
- **Flow 2:** Khách hàng gửi thông tin → Điều xe tạo shipment + gán xe

**Tasks:**
1. Tạo queries cho customer:
   - `getMyShipments` - Shipments của customer (filter by customerId)
   - `getMyShipmentDetails` - Chi tiết shipment với permission check
   - `getMyShipmentStats` - Thống kê shipments (total, in-transit, completed)

2. Tạo actions cho customer:
   - `createShipmentRequest` - Customer tạo shipment request (status: DRAFT)
   - `updateShipmentRequest` - Customer cập nhật shipment (chỉ khi DRAFT)
   - `cancelShipmentRequest` - Customer hủy shipment request
   - `confirmDocuments` - Customer xác nhận chứng từ đầy đủ

3. Tạo UI pages cho Customer Portal:
   - `src/customer/pages/CustomerDashboard.tsx` - Dashboard tổng quan
     - Số lượng shipments (total, active, completed)
     - Shipments gần đây
     - Công nợ overview (nếu CUSTOMER_OWNER)
   
   - `src/customer/pages/MyShipmentsPage.tsx` - Danh sách shipments
     - Filter: status, date range, shipment number
     - Search: shipment number, container number
     - Sort: date, status, priority
   
   - `src/customer/pages/CreateShipmentRequestPage.tsx` - Tạo shipment request
     - Step 1: Thông tin cơ bản (priority, planned dates)
     - Step 2: Điểm dừng (pickup, dropoff, depot, port)
     - Step 3: Thông tin bổ sung (special instructions)
     - Step 4: Review & Submit
   
   - `src/customer/pages/MyShipmentDetailsPage.tsx` - Chi tiết shipment
     - Thông tin shipment
     - Stops timeline
     - Dispatch info (vehicle, driver)
     - Status events
     - POD documents
     - Xác nhận chứng từ

4. Tạo components:
   - `src/customer/components/ShipmentRequestForm.tsx` - Form tạo request
   - `src/customer/components/MyShipmentCard.tsx` - Card hiển thị
   - `src/customer/components/ShipmentStatusTimeline.tsx` - Timeline
   - `src/customer/components/DocumentVerification.tsx` - Xác nhận chứng từ

5. Update Sidebar navigation:
   - Thêm customer menu items (chỉ hiện với CUSTOMER_OPS, CUSTOMER_OWNER)
   - Dashboard
   - My Shipments
   - Create Request
   - My Debts (chỉ CUSTOMER_OWNER)

6. Permission & Security:
   - Customer chỉ xem được shipments của mình (filter by customerId)
   - CUSTOMER_OPS: Tạo, xem, cập nhật shipment requests
   - CUSTOMER_OWNER: Tất cả quyền của CUSTOMER_OPS + xem công nợ

7. Testing workflow:
   - Login với CUSTOMER_OPS
   - Tạo shipment request
   - Xem danh sách shipments
   - Xem chi tiết shipment
   - Xác nhận chứng từ
   - Login với CUSTOMER_OWNER - xem công nợ

**Deliverables:**
- [ ] Customer queries & actions với permission checks
- [ ] Customer portal pages (Dashboard, Shipments, Create Request)
- [ ] Customer components
- [ ] Navigation updates
- [ ] Role-based access control
- [ ] Test cases passed

**Lưu ý:**
- Không cần Order Management riêng - Customer tạo Shipment trực tiếp
- Order model có thể được sử dụng sau này nếu cần nhóm nhiều shipments
- Focus vào Shipment creation workflow theo PRD

---

#### 1.2 Internal Shipment Creation Enhancement
**Mục tiêu:** Cải thiện workflow tạo shipment cho internal users (PRD Flow #2)

**Phân tích:**
- Điều xe nhận thông tin từ khách hàng (qua Zalo, email, phone)
- Điều xe tạo shipment + gán xe ngay trong một workflow

**Tasks:**
1. Enhance CreateShipmentPage:
   - Thêm option "Create from customer request"
   - Quick create mode (ít steps hơn cho internal users)
   - Auto-assign vehicle & driver option
   - Select customer từ dropdown

2. Tạo action:
   - `createAndDispatchShipment` - Tạo shipment + dispatch trong 1 action
   - Validate vehicle & driver availability
   - Auto-update shipment status to ASSIGNED

3. Update DispatcherDashboard:
   - Hiển thị customer requests (shipments với status DRAFT từ customers)
   - Quick dispatch button
   - Bulk dispatch option

**Deliverables:**
- [ ] Enhanced shipment creation workflow
- [ ] Quick dispatch feature
- [ ] Updated dispatcher dashboard
- [ ] Test cases passed

---

#### 1.3 Document Management
**Mục tiêu:** Upload & quản lý documents cho shipments

**Tasks:**
1. Tạo schema:
```prisma
model ShipmentDocument {
  id           String       @id @default(uuid())
  shipmentId   String
  documentType DocumentType
  fileName     String
  filePath     String
  fileSize     Int
  uploadedById String
  uploadedAt   DateTime     @default(now())
  isVerified   Boolean      @default(false)
  verifiedById String?
  verifiedAt   DateTime?
  
  shipment     Shipment @relation(...)
  uploadedBy   User     @relation("DocumentUploadedBy", ...)
  verifiedBy   User?    @relation("DocumentVerifiedBy", ...)
}

enum DocumentType {
  BOOKING
  BILL_OF_LADING
  CUSTOMS
  DELIVERY_ORDER
  OTHER
}
```

2. Tạo actions:
   - `uploadShipmentDocument`
   - `verifyDocument`
   - `deleteDocument`
3. Tạo components:
   - `DocumentUpload.tsx`
   - `DocumentList.tsx`
   - `DocumentViewer.tsx`
4. Tích hợp vào ShipmentDetailsPage & DispatcherDashboard
5. Testing upload/verify/delete workflow

**Deliverables:**
- [ ] Database migration
- [ ] Document actions
- [ ] UI components
- [ ] Integration with existing pages
- [ ] Test cases passed

---

#### 1.4 Charge & Invoice Management
**Mục tiêu:** Quản lý chi phí và tạo invoice

**Tasks:**
1. Tạo schemas:
```prisma
model Charge {
  id          String      @id @default(uuid())
  shipmentId  String
  chargeType  ChargeType
  description String?
  amount      Decimal     @db.Decimal(15, 2)
  currency    String      @default("VND")
  createdById String
  createdAt   DateTime    @default(now())
  
  shipment    Shipment    @relation(...)
  createdBy   User        @relation(...)
  invoice     Invoice?
}

model Invoice {
  id              String        @id @default(uuid())
  invoiceNumber   String        @unique
  customerId      String
  shipmentId      String?
  chargeId        String?       @unique
  totalAmount     Decimal       @db.Decimal(15, 2)
  vatAmount       Decimal?      @db.Decimal(15, 2)
  grandTotal      Decimal       @db.Decimal(15, 2)
  invoiceDate     DateTime      @default(now())
  dueDate         DateTime
  status          InvoiceStatus @default(DRAFT)
  pdfPath         String?
  createdById     String
  createdAt       DateTime      @default(now())
  
  customer        Customer  @relation(...)
  shipment        Shipment? @relation(...)
  charge          Charge?   @relation(...)
  createdBy       User      @relation(...)
  debt            Debt?
}

enum ChargeType {
  FREIGHT
  FUEL_SURCHARGE
  DETENTION
  LOADING
  CUSTOMS
  OTHER
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

2. Tạo charge actions:
   - `createCharge`
   - `updateCharge`
   - `deleteCharge`
3. Tạo invoice actions:
   - `generateInvoice`
   - `sendInvoice`
   - `markInvoiceAsPaid`
4. Tạo UI pages:
   - `InvoicesListPage.tsx`
   - `CreateInvoicePage.tsx`
   - `InvoiceDetailsPage.tsx`
5. Tạo components:
   - `ChargeForm.tsx`
   - `InvoicePreview.tsx`
   - `InvoicePDF.tsx` (PDF generator)
6. Link Invoice với Debt module
7. Testing workflow

**Deliverables:**
- [ ] Database migrations
- [ ] Charge & Invoice actions
- [ ] UI pages & components
- [ ] PDF generation
- [ ] Debt integration
- [ ] Test cases passed

---

#### 1.5 Cloud Storage Integration
**Mục tiêu:** Tích hợp S3/Cloudinary cho file uploads

**Tasks:**
1. Setup AWS S3 hoặc Cloudinary:
   - Install dependencies: `@aws-sdk/client-s3` hoặc `cloudinary`
   - Configure credentials
   - Setup buckets/folders
2. Tạo storage helpers:
   - `src/server/storage/s3.ts` - S3 client
   - `src/server/storage/upload.ts` - Upload helpers
   - `src/server/storage/download.ts` - Download helpers
   - `src/server/storage/delete.ts` - Delete helpers
3. Update actions:
   - `uploadPOD` - Sử dụng cloud storage
   - `uploadShipmentDocument` - Sử dụng cloud storage
   - `uploadDebtInvoiceImages` - Sử dụng cloud storage
   - `uploadDebtPaymentProofImages` - Sử dụng cloud storage
4. Update image upload components:
   - Vehicle images
   - Driver images
   - Debt images
5. Environment variables setup
6. Testing upload/download/delete

**Environment Variables:**
```env
# AWS S3
AWS_S3_BUCKET=unicon-schedule
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# hoặc Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**Deliverables:**
- [ ] Cloud storage setup
- [ ] Storage helpers
- [ ] Updated actions
- [ ] Updated components
- [ ] Environment configuration
- [ ] Test cases passed

---

### PHASE 2: Important Features (1-2 tháng)

#### 2.1 Customer Portal - Tracking & Documents
**Tasks:**
- Xem chi tiết shipment
- Xác nhận chứng từ đầy đủ
- Xem công nợ (CUSTOMER_OWNER)
- GPS tracking reference (placeholder)

---

#### 2.2 Notification System
**Tasks:**
1. Tạo Notification schema
2. Email templates
3. Email notifications cho key events:
   - Shipment assigned
   - Status changed
   - POD uploaded
   - Debt created
   - Debt overdue
4. In-app notification center
5. Debt reminder notifications

---

#### 2.3 Basic Reporting
**Tasks:**
1. Shipment reports:
   - By status
   - By date range
   - By customer
2. Financial reports:
   - Revenue
   - Expenses
   - Profit
3. Driver performance reports
4. Vehicle utilization reports
5. Export to Excel/PDF

---

### PHASE 3: Advanced Features (2-3 tháng)

#### 3.1 Driver Mobile App
**Tasks:**
- Design mobile UI/UX
- Implement React Native/Flutter app
- Push notifications
- GPS tracking
- Status updates
- POD upload

---

#### 3.2 GPS Tracking Integration
**Tasks:**
- GPS device integration
- Real-time tracking
- Route history
- Geofencing
- ETA calculation

---

## 📝 TODO LIST CHI TIẾT

### ✅ Completed (8 modules - 100%)
1. ✅ Module: Quản lý Shipment (80%)
2. ✅ Module: Dispatch Operations (90%)
3. ✅ Module: Quản lý Công nợ (95%)
4. ✅ Module: Quản lý Khách hàng (85%)
5. ✅ Module: Quản lý Phương tiện (100%)
6. ✅ Module: Quản lý Tài xế (100%)
7. ✅ Module: Quản lý User (100%)
8. ✅ Module: Authentication (100%)

### ⚠️ In Progress (1 module - 70%)
9. ⚠️ Module: Upload POD - Cần tích hợp cloud storage

### ❌ Pending - PHASE 1 (Customer Shipment Creation)
10. ❌ PHASE 1.1: Tạo queries cho customer (getMyShipments, getMyShipmentDetails, getMyShipmentStats)
11. ❌ PHASE 1.2: Tạo actions (createShipmentRequest, updateShipmentRequest, cancelShipmentRequest, confirmDocuments)
12. ❌ PHASE 1.3: Tạo UI pages (CustomerDashboard, MyShipmentsPage, CreateShipmentRequestPage, MyShipmentDetailsPage)
13. ❌ PHASE 1.4: Tạo components (ShipmentRequestForm, MyShipmentCard, ShipmentStatusTimeline, DocumentVerification)
14. ❌ PHASE 1.5: Update Sidebar navigation với customer menu items
15. ❌ PHASE 1.6: Implement role-based access control (CUSTOMER_OPS, CUSTOMER_OWNER)
16. ❌ PHASE 1.7: Test workflow với customer roles

### ❌ Pending - PHASE 1 (Internal Shipment Enhancement)
17. ❌ PHASE 1.8: Enhance CreateShipmentPage với quick create mode
18. ❌ PHASE 1.9: Tạo action createAndDispatchShipment
19. ❌ PHASE 1.10: Update DispatcherDashboard để hiển thị customer requests

### ❌ Pending - PHASE 2 (Document Management)
20. ❌ PHASE 2.1: Tạo ShipmentDocument schema với DocumentType enum
21. ❌ PHASE 2.2: Tạo actions (uploadShipmentDocument, verifyDocument, deleteDocument)
22. ❌ PHASE 2.3: Tạo components (DocumentUpload, DocumentList, DocumentViewer)
23. ❌ PHASE 2.4: Tích hợp vào ShipmentDetailsPage và DispatcherDashboard

### ❌ Pending - PHASE 3 (Charge & Invoice)
24. ❌ PHASE 3.1: Tạo Charge và Invoice schemas với enums
25. ❌ PHASE 3.2: Tạo charge actions (createCharge, updateCharge, deleteCharge)
26. ❌ PHASE 3.3: Tạo invoice actions (generateInvoice, sendInvoice, markInvoiceAsPaid)
27. ❌ PHASE 3.4: Tạo UI pages (InvoicesListPage, CreateInvoicePage, InvoiceDetailsPage)
28. ❌ PHASE 3.5: Tạo components (ChargeForm, InvoicePreview, InvoicePDF generator)
29. ❌ PHASE 3.6: Link Invoice với Debt module

### ❌ Pending - PHASE 4 (Cloud Storage)
30. ❌ PHASE 4.1: Setup AWS S3 hoặc Cloudinary configuration
31. ❌ PHASE 4.2: Tạo storage helpers (upload, download, delete)
32. ❌ PHASE 4.3: Update uploadPOD action để sử dụng cloud storage
33. ❌ PHASE 4.4: Update uploadShipmentDocument để sử dụng cloud storage
34. ❌ PHASE 4.5: Update image upload components (Vehicle, Driver, Debt)

### ❌ Pending - PHASE 5 (Notifications)
35. ❌ PHASE 5.1: Tạo Notification schema và email templates
36. ❌ PHASE 5.2: Implement email notifications cho key events
37. ❌ PHASE 5.3: Tạo in-app notification center
38. ❌ PHASE 5.4: Implement debt reminder notifications

### ❌ Pending - PHASE 6 (Reporting)
39. ❌ PHASE 6.1: Tạo shipment reports (by status, by date, by customer)
40. ❌ PHASE 6.2: Tạo financial reports (revenue, expenses, profit)
41. ❌ PHASE 6.3: Tạo driver performance reports
42. ❌ PHASE 6.4: Tạo vehicle utilization reports
43. ❌ PHASE 6.5: Export reports to Excel/PDF

### ❌ Pending - PHASE 7 & 8 (Advanced)
44. ❌ PHASE 7: Driver Mobile App - Design và implement React Native/Flutter app
45. ❌ PHASE 8: GPS Tracking - Tích hợp GPS devices và real-time tracking

### ❌ Pending - TESTING
46. ❌ TESTING: Test Customer Shipment Creation workflow (customer tạo request)
47. ❌ TESTING: Test Internal Shipment Creation workflow (điều xe tạo + dispatch)
48. ❌ TESTING: Test Customer Portal với CUSTOMER_OPS và CUSTOMER_OWNER roles
49. ❌ TESTING: Test Document Management upload/verify/delete workflow
50. ❌ TESTING: Test Charge & Invoice generation và payment workflow
51. ❌ TESTING: Browser testing - Responsive design trên mobile/tablet/desktop

---

## 🎯 CRITICAL GAPS (Ưu tiên cao nhất)

### Top 5 Missing Features:
1. **Customer Portal - Shipment Creation** - Customers không thể tự tạo shipment request (PRD Flow #1)
2. **Internal Quick Dispatch** - Điều xe chưa có workflow nhanh để tạo shipment + dispatch (PRD Flow #2)
3. **Invoice Generation** - Không thể bill customers properly (PRD Flow #7)
4. **Charge Management** - Không track chi phí per shipment (PRD Flow #7)
5. **Document Upload for Dispatch** - Thiếu booking/shipment docs (PRD Flow #4)

---

## 📊 IMPLEMENTATION STATUS BY MODULE

| Module | Implementation % | Status | Priority |
|--------|-----------------|--------|----------|
| Shipment Management | 80% | ✅ Core complete | Medium |
| Dispatch Operations | 90% | ✅ Nearly complete | Medium |
| POD Upload | 70% | ⚠️ Needs cloud storage | High |
| Debt Management | 95% | ✅ Fully functional | Low |
| Customer Management | 85% | ✅ Complete for internal | Low |
| Vehicle Management | 100% | ✅ Fully implemented | Low |
| Driver Management | 100% | ✅ Fully implemented | Low |
| User Management | 100% | ✅ Fully implemented | Low |
| Authentication | 100% | ✅ Fully implemented | Low |
| **Customer Shipment Creation** | 20% | ❌ Backend ready, no UI | **Critical** |
| **Invoice/Charge** | 10% | ❌ Minimal | **Critical** |
| **Customer Portal** | 0% | ❌ Not started | **Critical** |
| **Document Management** | 0% | ❌ Not started | **Critical** |
| **Cloud Storage** | 0% | ❌ Not started | **High** |
| GPS Tracking | 0% | ❌ Not started | Medium |
| Notifications | 0% | ❌ Not started | Medium |
| Reporting | 15% | ❌ Basic only | Medium |
| Driver Mobile App | 0% | ❌ Not started | Low |

---

## 🔄 WORKFLOW THEO PRD

### Core Flow 1: Shipment được tạo chủ động từ khách hàng
**Status:** ❌ Chưa triển khai
- Cần: Customer Portal với Shipment Creation UI
- Customer (CUSTOMER_OPS/CUSTOMER_OWNER) tự tạo shipment request
- Shipment status: DRAFT → chờ OPS/Dispatcher xác nhận

### Core Flow 2: Khách hàng gửi thông tin → Điều xe tạo shipment
**Status:** ⚠️ Partial (có internal creation nhưng chưa optimize)
- Hiện tại: Điều xe có thể tạo shipment qua CreateShipmentPage
- Cần: Quick create workflow + auto-dispatch feature
- Cần: Enhanced DispatcherDashboard để xử lý customer requests nhanh

### Core Flow 3: Khai báo điểm dừng
**Status:** ✅ Đã có
- ShipmentStop với StopType

### Core Flow 4: Dispatch + Upload giấy tờ
**Status:** ⚠️ Partial (dispatch có, upload giấy tờ chưa)
- Cần: Document Management

### Core Flow 5: Tài xế cập nhật trạng thái
**Status:** ✅ Backend sẵn sàng
- Cần: Driver Mobile App

### Core Flow 6: Upload POD
**Status:** ⚠️ Partial (backend có, cloud storage chưa)
- Cần: Cloud Storage Integration

### Core Flow 7: Tổng hợp charge & lập Invoice
**Status:** ❌ Chưa triển khai
- Cần: Charge & Invoice Management

### Core Flow 8: Tạo công nợ và theo dõi
**Status:** ✅ Đã có
- Debt Management hoàn chỉnh

---

## 📅 TIMELINE ƯỚC TÍNH

### PHASE 1 (2-4 tuần) - Critical Features
- Week 1-2: Customer Portal - Shipment Creation + Internal Enhancement
- Week 3: Document Management
- Week 4: Charge & Invoice + Cloud Storage

### PHASE 2 (1-2 tháng) - Important Features
- Month 1: Customer Portal enhancements + Notifications
- Month 2: Reporting & Analytics

### PHASE 3 (2-3 tháng) - Advanced Features
- Month 1-2: Driver Mobile App
- Month 3: GPS Tracking Integration

---

## 🧪 TESTING STRATEGY

### Unit Testing
- Backend actions & queries
- Validation logic
- Business rules

### Integration Testing
- API endpoints
- Database operations
- File uploads

### E2E Testing
- Complete user workflows
- Role-based access
- Multi-step processes

### Browser Testing
- Responsive design
- Cross-browser compatibility
- Performance testing

---

## 📚 REFERENCES

- **PRD:** `/docs/01_core/02_PRD.md`
- **Architecture:** `/docs/01_core/03_ARCHITECTURE.md`
- **Database Schema:** `/docs/01_core/04_DATABASE_SCHEMA.md`
- **API Contracts:** `/docs/01_core/05_API_CONTRACTS.md`

---

**Document Version:** 1.0  
**Last Updated:** 12/02/2026  
**Next Review:** Weekly during PHASE 1
