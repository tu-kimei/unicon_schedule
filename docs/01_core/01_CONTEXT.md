--- docs/00_CONTEXT.md
+++ docs/00_CONTEXT.md
@@
+# 1. Bối cảnh
+
+Doanh nghiệp vận tải container nội địa hiện đang quản lý đơn hàng, điều xe,
+theo dõi trạng thái và thanh toán chủ yếu qua Excel, Zalo, và kinh nghiệm cá nhân.
+Điều này gây ra các vấn đề:
+- Thiếu minh bạch trạng thái chuyến
+- Khó audit khi xảy ra tranh chấp POD / thời gian giao hàng
+- Sai sót trong tính cước, phụ phí
+- Không có dữ liệu tổng hợp để tối ưu vận hành
+
+# 2. Mục tiêu dự án
+
+Xây dựng một hệ thống internal tool nhằm:
+- Quản lý vòng đời đơn vận tải container (Order → Shipment → Dispatch → POD → Invoice)
+- Chuẩn hóa quy trình điều xe và theo dõi trạng thái
+- Làm nền tảng cho báo cáo vận hành và tài chính
+- Giảm thiểu sai sót trong tính toán chi phí và phụ phí
+- Tăng tính minh bạch và khả năng audit dữ liệu
+
+# 3. Phạm vi ban đầu
+
+- Chỉ phục vụ vận tải container nội địa
+- Người dùng nội bộ (Ops, Dispatcher, Accounting, Driver)
+- Portal khách hàng (giai đoạn đầu): Hiển thị hình ảnh liên quan đến các bước vận hành (lấy cont rỗng, vào hàng, vào cảng, hạ trả cont)
+- Không tích hợp hệ thống bên thứ ba trong v0.1
+- Tập trung vào các tính năng cốt lõi, tránh mở rộng không cần thiết.
+
+# 4. Nguyên tắc thiết kế
+
+- Data là trung tâm (data-first)
+- Có khả năng audit & trace toàn bộ lịch sử
+- Ưu tiên đơn giản, tránh over-engineering
