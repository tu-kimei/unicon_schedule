# Shipment Flow Redesign - Design Spec

**Date:** 2026-03-21
**Status:** Draft
**Approach:** Refactor dần trên nền hiện tại (Approach A)

## 1. Overview

Thiết kế lại luồng tương tác vận chuyển container logistics:
- KH đặt lệnh vận chuyển (đã có giá cố định từ flow báo giá riêng)
- Dispatcher điều xe (đầu kéo + rơ mooc + tài xế), sắp xếp nhiều chuyến cho 1 tài xế
- Tài xế chạy giao hàng theo 2 luồng Xuất/Nhập, chụp ảnh chứng từ tại mỗi điểm
- Ảnh upload real-time cho KH xem, chứng từ giấy gốc mang về VP rồi trả KH
- 3 mức hoàn tất: Vận hành / Hành chính / Tài chính

## 2. Schema Changes

### 2.1 Vehicle - Tách Tractor & Trailer

Giữ bảng Vehicle hiện tại với `VehicleType` (TRACTOR/TRAILER). Thay đổi Dispatch để gán riêng:

```
Dispatch (thay bằng DriverTask):
  tractorId  → Vehicle (type=TRACTOR)
  trailerId  → Vehicle (type=TRAILER), nullable
```

### 2.2 Shipment - Mở rộng

Thêm fields:
- `shipmentType`: Enum (EXPORT, IMPORT)
- `operationStatus`: Enum - trạng thái vận hành (giữ nguyên field `currentStatus` hiện tại, đổi tên)
- `documentStatus`: Enum - trạng thái chứng từ
- `financialStatus`: Enum - trạng thái tài chính

### 2.3 ShipmentStop - Mở rộng

Thêm fields:
- `stopCategory`: Enum (PICKUP_EMPTY, WAREHOUSE_LOAD, PORT_DELIVERY, PORT_PICKUP, WAREHOUSE_UNLOAD, RETURN_EMPTY)
- `requiredPhotos`: String[] - danh sách loại ảnh cần chụp

### 2.4 DriverTask - Entity mới (thay Dispatch)

```prisma
model DriverTask {
  id            String   @id @default(uuid())
  driverId      String
  driver        Driver   @relation(fields: [driverId], references: [id])
  shipmentId    String
  shipment      Shipment @relation(fields: [shipmentId], references: [id])
  tractorId     String
  tractor       Vehicle  @relation("TractorTasks", fields: [tractorId], references: [id])
  trailerId     String?
  trailer       Vehicle? @relation("TrailerTasks", fields: [trailerId], references: [id])
  sequence      Int
  instructions  String?
  status        DriverTaskStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum DriverTaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}
```

### 2.5 POD - Mở rộng photoCategory

Thêm field:
- `photoCategory`: Enum (CONTAINER_EXTERIOR, CONTAINER_INTERIOR, PORT_GATE_PASS, WAREHOUSE_GATE_PASS, WEIGHT_TICKET, OTHER)

### 2.6 Notification - Entity mới

```prisma
model Notification {
  id            String            @id @default(uuid())
  userId        String
  user          User              @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String
  referenceId   String?
  referenceType ReferenceType?
  channels      String[]
  isRead        Boolean           @default(false)
  sentAt        DateTime          @default(now())
  readAt        DateTime?
}

enum NotificationType {
  ORDER_CREATED
  DISPATCHED
  STOP_CHECKIN
  PHOTO_UPLOADED
  DELIVERED
  DOC_RETURNED
  INVOICED
  OVERDUE
}

enum ReferenceType {
  SHIPMENT
  INVOICE
  DOCUMENT
}
```

### 2.7 GPSTracking - Entity mới

```prisma
model GPSTracking {
  id            String     @id @default(uuid())
  driverTaskId  String
  driverTask    DriverTask @relation(fields: [driverTaskId], references: [id])
  latitude      Float
  longitude     Float
  speed         Float?
  heading       Float?
  recordedAt    DateTime
}
```

## 3. State Machine - 3 tầng trạng thái

### 3.1 Operation Status (Vận hành)

```
DRAFT → PENDING → DISPATCHED → IN_TRANSIT → DELIVERED
  ↓        ↓          ↓            ↓
  └────────└──────────└────────────└──→ CANCELLED
```

| Trạng thái | Mô tả | Ai thay đổi |
|---|---|---|
| DRAFT | KH tạo lệnh, chưa gửi | KH |
| PENDING | KH đã gửi, chờ Dispatcher | KH → System |
| DISPATCHED | Đã gán xe + tài xế | Dispatcher |
| IN_TRANSIT | Tài xế đang chạy (auto khi check-in stop đầu) | Tài xế → System |
| DELIVERED | Tài xế hoàn tất stop cuối | Tài xế → System |
| CANCELLED | Hủy | KH (DRAFT/PENDING), Dispatcher/Admin (bất kỳ) |

### 3.2 Document Status (Hành chính)

```
PENDING → RECEIVED → RETURNED
```

| Trạng thái | Mô tả | Ai thay đổi |
|---|---|---|
| PENDING | Chờ tài xế mang chứng từ gốc về VP | Default |
| RECEIVED | VP đã nhận chứng từ gốc | OPS |
| RETURNED | Đã trả chứng từ gốc cho KH | OPS |

### 3.3 Financial Status (Tài chính)

```
NOT_BILLED → INVOICED → PARTIAL_PAID → PAID
                ↓            ↓
                └────────────└──→ OVERDUE
```

| Trạng thái | Mô tả | Ai thay đổi |
|---|---|---|
| NOT_BILLED | Chưa xuất hóa đơn | Default |
| INVOICED | Đã xuất hóa đơn | Accounting |
| PARTIAL_PAID | Thanh toán một phần | Accounting |
| PAID | Đã thanh toán đầy đủ | Accounting |
| OVERDUE | Quá hạn thanh toán | System (auto) |

## 4. Shipment Type Templates

### 4.1 Hàng Xuất (EXPORT)

| Sequence | Stop Category | Mô tả | Ảnh bắt buộc |
|---|---|---|---|
| 1 | PICKUP_EMPTY | Lấy cont rỗng | Cont rỗng (trong, ngoài, 4 mặt), Phiếu ra cảng/bãi |
| 2 | WAREHOUSE_LOAD | Kho đóng hàng | Phiếu vào kho, Phiếu cân xe (vào/ra), Phiếu ra kho |
| 3 | PORT_DELIVERY | Giao ra cảng | Phiếu vào cảng |

### 4.2 Hàng Nhập (IMPORT)

| Sequence | Stop Category | Mô tả | Ảnh bắt buộc |
|---|---|---|---|
| 1 | PORT_PICKUP | Lấy cont hàng từ cảng | Phiếu ra cảng |
| 2 | WAREHOUSE_UNLOAD | Kho xuống hàng | Phiếu vào kho, Phiếu cân xe (vào/ra), Phiếu ra kho |
| 3 | RETURN_EMPTY | Trả cont rỗng | Phiếu vào cảng/bãi, Cont rỗng (trong, ngoài) |

### 4.3 Cấu hình linh hoạt

- Danh sách ảnh bắt buộc có thể config theo KH hoặc theo tuyến (không hardcode)
- Dispatcher có thể thêm/bớt yêu cầu ảnh khi tạo lệnh

## 5. Roles & Permissions

| Role | Xem | Tạo/Sửa | Trạng thái được đổi |
|---|---|---|---|
| CUSTOMER_OPS | Shipments của KH mình | Tạo lệnh (DRAFT), gửi (PENDING), hủy (DRAFT/PENDING) | Operation: DRAFT → PENDING, CANCELLED |
| CUSTOMER_OWNER | Tất cả shipments của KH mình + debts | Như CUSTOMER_OPS + xem tài chính | Như CUSTOMER_OPS |
| DISPATCHER | Tất cả shipments | Tạo lệnh, gán xe/tài xế, sắp xếp chuyến | Operation: PENDING → DISPATCHED, CANCELLED |
| DRIVER | Chuyến được gán | Cập nhật stop, upload ảnh chứng từ | Operation: DISPATCHED → IN_TRANSIT → DELIVERED |
| OPS | Tất cả shipments | Nhận chứng từ gốc, trả cho KH | Document: PENDING → RECEIVED → RETURNED |
| ACCOUNTING | Tất cả shipments + tài chính | Xuất hóa đơn, ghi nhận thanh toán | Financial: NOT_BILLED → INVOICED → PARTIAL_PAID → PAID |
| ADMIN | Toàn bộ hệ thống | Tất cả | Tất cả |

## 6. DriverTask - Điều phối nhiều chuyến

### 6.1 Quan hệ

- 1 Driver → nhiều DriverTask (nhiều chuyến)
- 1 Shipment → nhiều DriverTask (có thể đổi tài xế)
- DriverTask gán: tractorId + trailerId (nullable) + driverId
- Bảng Dispatch cũ → thay bằng DriverTask

### 6.2 UI Dispatcher

- Kéo thả sắp xếp thứ tự chuyến cho mỗi tài xế
- Mỗi chuyến hiển thị: tuyến đường, loại hàng (Xuất/Nhập), thời gian dự kiến
- Ghi chú hướng dẫn cho từng chuyến (cắt/kéo rơ mooc)
- Phase sau: AI gợi ý thứ tự tối ưu dựa trên khoảng cách, thời gian

### 6.3 UI Tài xế

- Danh sách chuyến theo thứ tự, chuyến đang chạy highlight
- Hoàn thành chuyến trước mới mở chuyến tiếp (hoặc Dispatcher cho phép skip)

## 7. Luồng chụp ảnh & chứng từ

### 7.1 Real-time (ảnh chụp)

1. Tài xế đến stop → **Check-in** (ghi `actualArrival`)
2. Upload ảnh theo danh sách bắt buộc → hệ thống validate đủ chưa
3. Hoàn tất → **Check-out** (ghi `actualDeparture`)
4. Ảnh upload real-time → KH xem được luôn trên portal

### 7.2 Chứng từ giấy gốc

1. Tài xế mang chứng từ giấy về VP
2. OPS nhận → đánh dấu `documentStatus = RECEIVED`
3. Trả chứng từ gốc cho KH → đánh dấu `documentStatus = RETURNED`

## 8. Notification System

### 8.1 Sự kiện trigger

| Sự kiện | Ai nhận | Kênh |
|---|---|---|
| KH tạo lệnh mới | Dispatcher | In-app, Email |
| Dispatcher gán xe/tài xế | Tài xế, KH | In-app, Zalo/SMS, Email |
| Tài xế check-in stop | KH | In-app |
| Tài xế upload ảnh chứng từ | KH | In-app |
| Chuyến hoàn tất (DELIVERED) | KH, OPS | In-app, Email |
| Chứng từ gốc đã trả (RETURNED) | KH | In-app, Email |
| Hóa đơn xuất (INVOICED) | KH | In-app, Email |
| Quá hạn thanh toán (OVERDUE) | KH, Accounting | In-app, Email |

### 8.2 Phân phase

- **Phase đầu:** In-app + Email
- **Phase sau:** Tích hợp Zalo/SMS API

## 9. GPS Tracking

- Tích hợp qua API bên ngoài (do user cung cấp)
- Hiển thị vị trí real-time trên bản đồ
- Lưu lịch sử vị trí theo chuyến (bảng GPSTracking)

## 10. Dashboard quản lý

| Widget | Nội dung | Ai xem |
|---|---|---|
| Tổng quan hôm nay | Chờ điều phối / Đang chạy / Hoàn tất | Admin, Dispatcher |
| Bản đồ live | Vị trí tất cả tài xế đang chạy | Admin, Dispatcher |
| Xe & Tài xế | Trống / Đang chạy / Bảo trì | Admin, Dispatcher |
| Chứng từ | Chờ nhận / Đã nhận / Đã trả KH | OPS |
| Tài chính | Chưa xuất HĐ / Chờ thanh toán / Quá hạn | Accounting |
| Hiệu suất | Số chuyến/tài xế, thời gian TB/chuyến | Admin |
| Chuyến hàng của tôi | Trạng thái, chứng từ, tracking | Customer |

## 11. Phân phase triển khai

### Phase 1 (Core)
- Schema changes (DriverTask, mở rộng Shipment/Stop/POD)
- Luồng KH đặt lệnh (EXPORT/IMPORT templates)
- Dispatcher điều phối (gán xe, drag-drop sắp xếp)
- Tài xế check-in/out + upload ảnh (PWA)
- In-app notification
- Document status tracking (nhận/trả chứng từ)

### Phase 2 (Enhancement)
- GPS tracking integration
- Email notification
- Dashboard quản lý
- Financial status integration với Debt/Invoice module hiện có

### Phase 3 (Advanced)
- AI gợi ý sắp xếp chuyến tối ưu
- Zalo/SMS notification
- Báo cáo hiệu suất
- Mobile app native (nếu PWA không đáp ứng)

## 12. Tái sử dụng code hiện tại

| Module | Giữ nguyên | Thay đổi |
|---|---|---|
| Auth | 100% | Không |
| User/Admin | 95% | Thêm permissions cho role mới |
| Vehicle/Driver | 80% | Thêm relation TractorTasks/TrailerTasks |
| Debt/Invoice | 90% | Thêm link financialStatus |
| Customer | 95% | Không đáng kể |
| Shipment | 40% | Refactor lớn: schema, actions, queries, pages |
| Dispatch | 0% | Thay bằng DriverTask |
