# Shipment Flow E2E Test Checklist

## Export Flow
- [ ] KH tạo lệnh EXPORT → 3 stops auto-generated (PICKUP_EMPTY, WAREHOUSE_LOAD, PORT_DELIVERY)
- [ ] KH submit (DRAFT → PENDING) → notification cho Dispatcher
- [ ] Dispatcher gán tractor + trailer + tài xế → DISPATCHED + notifications
- [ ] Dispatcher sắp xếp thứ tự chuyến (drag-drop) → sequence updated
- [ ] Tài xế xem danh sách chuyến → đúng thứ tự
- [ ] Tài xế check-in stop 1 → IN_TRANSIT + notification cho KH
- [ ] Tài xế upload ảnh container (CONTAINER_EXTERIOR) → POD với photoCategory
- [ ] Tài xế check-out stop 1, check-in/out stop 2, 3 → DELIVERED
- [ ] OPS đánh dấu nhận chứng từ → DOC_RECEIVED
- [ ] OPS đánh dấu trả chứng từ → DOC_RETURNED + notification

## Import Flow
- [ ] KH tạo lệnh IMPORT → 3 stops auto-generated (PORT_PICKUP, WAREHOUSE_UNLOAD, RETURN_EMPTY)
- [ ] Full flow tương tự Export

## 3-Tier Status
- [ ] Operation status transitions: DRAFT → PENDING → DISPATCHED → IN_TRANSIT → DELIVERED
- [ ] Document status transitions: DOC_PENDING → DOC_RECEIVED → DOC_RETURNED
- [ ] Financial status: NOT_BILLED (default, integration with Invoice module later)
- [ ] CANCELLED works from any pre-DELIVERED state

## Notifications
- [ ] Bell icon hiển thị unread count
- [ ] Click notification → mark as read
- [ ] Mark all as read
- [ ] KH nhận notification khi: dispatched, check-in, photo uploaded, delivered, doc returned

## Role Access
- [ ] CUSTOMER_OPS: chỉ xem/tạo shipments của KH mình
- [ ] DISPATCHER: xem tất cả, gán xe/tài xế
- [ ] DRIVER: chỉ xem chuyến được gán, check-in/out, upload ảnh
- [ ] OPS: quản lý document status
- [ ] ADMIN: full access

## PWA
- [ ] manifest.json accessible at /manifest.json
- [ ] Service worker registered
- [ ] Installable on mobile (Add to Home Screen)
