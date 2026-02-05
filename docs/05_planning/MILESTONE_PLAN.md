--- docs/02_PLAN.md
+++ docs/02_PLAN.md
@@
+# 1. Chiến lược triển khai
+
+Triển khai theo milestone nhỏ, mỗi milestone có thể đưa vào sử dụng nội bộ.
+
+# 2. Milestones
+
+## M1 – Core Operations (2–3 tuần)
+- Order / Shipment / Stops: Hoàn thiện CRUD và giao diện quản lý
+- Dispatch: Bao gồm giao diện điều phối và cập nhật trạng thái xe thủ công
+- Status timeline: Hiển thị lịch sử trạng thái của Shipment
+- POD upload: Hỗ trợ upload file với định dạng JPG, PNG, PDF (tối đa 5MB)
+
+## M2 – Financial Layer
+- Charge items: Quản lý các khoản phí
+- Invoice draft: Tạo bản nháp hóa đơn
+- Báo cáo cơ bản: Tổng hợp dữ liệu vận hành
+
+## M3 – Optimization & Integration
+- KPI dashboard: Hiển thị các chỉ số hiệu suất
+- Phân quyền chi tiết: Quản lý quyền truy cập theo vai trò
+- Tích hợp ngoài (GPS, ePOD): Chuẩn bị tích hợp với các hệ thống bên thứ ba
+
+# 3. Task breakdown (M1)
+
+- Thiết kế DB & ERD
+- API cho Order / Shipment
+- UI quản lý Shipment
+- Dispatch screen
+- Status update flow
+- POD upload & review
