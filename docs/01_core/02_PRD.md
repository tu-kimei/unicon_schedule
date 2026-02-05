--- docs/01_PRD.md
+++ docs/01_PRD.md
@@
+# 1. Tổng quan sản phẩm
+
+Hệ thống quản lý vận tải container nội địa dành cho đội ngũ nội bộ:
+Ops, Dispatcher và Accounting.
+
+# 2. Personas
+
+## 2.1 Ops
+- Tạo và quản lý Order / Shipment
+- Theo dõi tiến độ vận chuyển
+- Thu thập POD
+
+## 2.2 Dispatcher
+- Gán xe, tài xế cho từng chặng
+- Theo dõi trạng thái thực tế
+- Xử lý phát sinh
+
+## 2.3 Accounting
+- Kiểm tra chi phí
+- Lập invoice
+- Đối soát công nợ
+
+## 2.4 Driver (tài xế)
+- Thông báo nhận lệnh qua ứng dụng di động
+- Cập nhật trạng thái chuyến đi (bắt đầu, hoàn thành, sự cố)
+- Upload hình ảnh hoặc tài liệu liên quan đến POD
+
+# 3. Core Flows
+
+1. Tạo Order từ khách hàng
+2. Tạo Shipment (1 Order có thể có nhiều Shipment)
+3. Khai báo các điểm dừng (Pickup / Drop / Depot / Port): Người dùng có thể tự cấu hình các điểm dừng hoặc chọn từ danh sách có sẵn.
+4. Dispatch: gán xe + tài xế cho từng Shipment
+5. Cập nhật trạng thái theo thời gian
+6. Upload POD
+7. Tổng hợp charge & lập Invoice
+
+# 4. Scope v0.1
+
+IN:
+- CRUD Order / Shipment
+- Multi-stop shipment
+- Dispatch (1 shipment – 1 xe tại 1 thời điểm)
+- Status timeline: Hiển thị lịch sử trạng thái của Shipment, bao gồm các cập nhật thời gian thực và các sự kiện quan trọng.
+- Upload POD (ảnh / file): Hỗ trợ định dạng JPG, PNG, PDF với dung lượng tối đa 5MB.
+
+OUT:
+- GPS realtime
+- Tự động tính cước
+- Portal khách hàng
+
+# 5. Acceptance Criteria (v0.1)
+
+- Mỗi Shipment phải truy vết được toàn bộ lịch sử trạng thái
+- Dispatcher chỉ thấy các shipment đang cần điều xe, với thông tin về xe và tài xế khả dụng được cập nhật thủ công.
+- POD gắn chặt với Shipment, không sửa sau khi submit
