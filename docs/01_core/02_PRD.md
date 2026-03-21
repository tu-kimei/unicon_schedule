--- docs/01_PRD.md
+++ docs/01_PRD.md
@@
+# 1. Tổng quan sản phẩm
+
+Hệ thống quản lý vận tải container nội địa dành cho đội ngũ nội bộ và Khách hàng
+- Nội bộ: Admin, Ops, Dispatcher, Driver và Accounting.
+- Khách hàng: Chủ và Ops
+
+# 2. Personas - Nội bộ
+
+## 2.1 Ops (vận hành)
+- Theo dõi và hỗ trợ Shipment
+- Theo dõi tiến độ vận chuyển
+- Thu thập POD
+- Kiểm soát để đảm bảo đủ giấy tờ chứng từ các shipment để sau này cung cấp lại đủ cho khách hàng
+
+## 2.2 Dispatcher (Điều xe)
+- Gán xe, tài xế cho từng Shipment
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

+## 2.5 Admin (Giám đốc hoặc quản lý chung)
+- Có thể access vào tất cả các feature và có thể thực hiện bất cứ thao tác nào
+
+# 3. Personas - Khách hàng
+## 3.1 Ops-khách hàng
+- Request shipment
+- Theo dõi tiến độ và trạng thái của Shipment
+- Tham chiếu tới GPS của xe
+- Hỗ trợ liên lạc để xe thuận lợi ra vào cồng, bốc xếp hàng
+- Xác nhận chứng từ của các shipment đã đầy đủ chưa

+## 3.2 Chủ hàng
+- Có thể thực hiện được tất cả các thao tác của Ops-khách hàng
+- Xem và theo dõi công nợ 

+# 4. Core Flows
+
+1. Shipment được tạo chủ động từ khách hàng
+2. Hoặc khách hàng sẽ gửi thông tin Order shipment qua cho Điều xe và Điều xe sẽ tạo shipment + gắn xe
+3. Khách hàng sẽ khai báo các điểm dừng (Noi lay / Tuyen duong / Noi ha): Người dùng có thể tự cấu hình các điểm dừng hoặc chọn từ danh sách có sẵn.
+4. Dispatch: gán xe cho từng Shipment (1 xe được bố trí riêng cho 1 tài xế nên không cần chọn tài xế). Upload các giấy tờ như (Booking, Thông tin shipment)
+5. Tài xe nhận bố trí shipment và cập nhật trạng thái, thông tin (upload các chứng từ) theo thời gian và theo các giai đoạn
+6. Upload POD
+7. Tổng hợp charge & lập Invoice, hoá đơn.
+8. Tạo công nợ và theo dõi, nhắc nhở công nợ
