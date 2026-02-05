# Bảng Câu hỏi Làm rõ Yêu cầu Nghiệp vụ - Unicon Schedule

**Mục đích**: Thu thập thông tin chi tiết để hoàn thiện PRD và đảm bảo hệ thống đáp ứng đúng nhu cầu thực tế

**Ngày tạo**: 2024-01-22  
**Trạng thái**: Chờ phản hồi

---

## 📊 Phần 1: Quy mô & Khối lượng Công việc

### 1.1 Khối lượng Hiện tại

**Câu hỏi về Shipments:**
- [ ] Trung bình bao nhiêu shipment/ngày?
- [ ] Shipment nhiều nhất trong 1 ngày là bao nhiêu?
- [ ] Shipment ít nhất trong 1 ngày là bao nhiêu?
- [ ] Có mùa cao điểm không? (Tết, cuối năm, etc.)
- [ ] Tỷ lệ shipment urgent/high priority là bao nhiêu %?

**Câu hỏi về Đội xe:**
- [ ] Tổng số xe hiện có: ___ xe
- [ ] Phân loại xe:
  - Xe tải 1 tấn: ___ xe
  - Xe tải 3 tấn: ___ xe
  - Xe tải 5 tấn: ___ xe
  - Xe tải 10 tấn: ___ xe
  - Xe container: ___ xe
- [ ] Xe thuê ngoài chiếm bao nhiêu %?
- [ ] Tỷ lệ xe available trung bình: ___%

**Câu hỏi về Tài xế:**
- [ ] Tổng số tài xế: ___ người
- [ ] Tài xế full-time: ___ người
- [ ] Tài xế part-time: ___ người
- [ ] Tỷ lệ tài xế available trung bình: ___%
- [ ] Tài xế có smartphone: ___%

**Câu hỏi về Khách hàng:**
- [ ] Tổng số khách hàng active: ___ khách
- [ ] Khách hàng VIP (chiếm 80% doanh thu): ___ khách
- [ ] Khách hàng mới/tháng: ___ khách
- [ ] Tỷ lệ khách hàng quay lại: ___%

---

## ⏱️ Phần 2: Thời gian & Hiệu suất

### 2.1 Thời gian Xử lý Hiện tại

**Tạo Order/Shipment:**
- [ ] Thời gian trung bình tạo 1 order: ___ phút
- [ ] Thời gian trung bình tạo 1 shipment: ___ phút
- [ ] Có bao nhiêu % order bị nhập sai phải sửa lại?
- [ ] Thời gian sửa lỗi trung bình: ___ phút

**Dispatch:**
- [ ] Thời gian trung bình tìm xe phù hợp: ___ phút
- [ ] Thời gian trung bình tìm tài xế: ___ phút
- [ ] Có bao nhiêu % lần phải gọi > 5 cuộc để tìm được xe?
- [ ] Có bao nhiêu % shipment không tìm được xe?

**Theo dõi & Cập nhật:**
- [ ] Bao nhiêu lần/ngày Dispatcher phải gọi tài xế để hỏi trạng thái?
- [ ] Thời gian trung bình 1 cuộc gọi: ___ phút
- [ ] Có bao nhiêu % tài xế không nghe máy?
- [ ] Có bao nhiêu % shipment bị delay mà không ai biết?

**POD Collection:**
- [ ] Thời gian trung bình thu thập POD sau khi hoàn thành: ___ giờ/ngày
- [ ] Có bao nhiêu % POD bị thất lạc?
- [ ] Có bao nhiêu % POD không rõ ràng (mờ, thiếu thông tin)?
- [ ] Thời gian lưu trữ POD giấy: ___ tháng

**Invoicing & Reconciliation:**
- [ ] Thời gian trung bình tạo 1 invoice: ___ phút
- [ ] Thời gian đối soát cuối tháng: ___ ngày
- [ ] Có bao nhiêu % invoice bị tranh chấp?
- [ ] Thời gian giải quyết tranh chấp trung bình: ___ ngày

### 2.2 Mục tiêu Cải thiện

**Mục tiêu thời gian:**
- [ ] Mục tiêu thời gian tạo shipment: ___ phút
- [ ] Mục tiêu thời gian dispatch: ___ phút
- [ ] Mục tiêu thời gian thu thập POD: ___ giờ
- [ ] Mục tiêu thời gian đối soát cuối tháng: ___ giờ

**Mục tiêu chất lượng:**
- [ ] Mục tiêu tỷ lệ lỗi nhập liệu: < ___%
- [ ] Mục tiêu tỷ lệ POD đầy đủ: > ___%
- [ ] Mục tiêu tỷ lệ invoice chính xác: > ___%
- [ ] Mục tiêu customer satisfaction: > ___/5

---

## 💰 Phần 3: Chi phí & Tài chính

### 3.1 Cấu trúc Chi phí

**Chi phí Vận hành:**
- [ ] Chi phí nhân công/tháng cho việc quản lý thủ công: ___ VND
- [ ] Chi phí điện thoại (gọi tài xế, khách hàng): ___ VND/tháng
- [ ] Chi phí in ấn, văn phòng phẩm: ___ VND/tháng
- [ ] Chi phí lưu trữ tài liệu: ___ VND/tháng

**Chi phí Do Sai sót:**
- [ ] Chi phí bồi thường do delay/tháng: ___ VND
- [ ] Chi phí refund do sai sót/tháng: ___ VND
- [ ] Chi phí xử lý tranh chấp/tháng: ___ VND
- [ ] Doanh thu mất do khách hàng rời bỏ/tháng: ___ VND

**Cấu trúc Giá:**
- [ ] Cước phí tính theo: 
  - [ ] Khoảng cách (km)
  - [ ] Trọng lượng (kg)
  - [ ] Loại hàng
  - [ ] Loại xe
  - [ ] Khác: ___________

**Phụ phí:**
- [ ] Các loại phụ phí thường gặp:
  - [ ] Phụ phí chờ hàng: ___ VND/giờ
  - [ ] Phụ phí đêm/cuối tuần: ___%
  - [ ] Phụ phí vào cảng: ___ VND
  - [ ] Phụ phí bốc xếp: ___ VND
  - [ ] Khác: ___________

### 3.2 Mục tiêu Tài chính

**ROI Expectations:**
- [ ] Ngân sách dự kiến cho dự án: ___ VND
- [ ] Thời gian mong đợi hoàn vốn: ___ tháng
- [ ] Tiết kiệm chi phí mong đợi/tháng: ___ VND
- [ ] Tăng doanh thu mong đợi/tháng: ___ VND

---

## 🔄 Phần 4: Quy trình Nghiệp vụ Chi tiết

### 4.1 Quy trình Đặc biệt

**Container Rỗng:**
- [ ] Có cần quản lý container rỗng không?
- [ ] Container rỗng lấy từ đâu? (depot, cảng)
- [ ] Có phí lưu container rỗng không?
- [ ] Thời gian lưu container tối đa: ___ ngày

**Hàng Nguy hiểm:**
- [ ] Có vận chuyển hàng nguy hiểm không?
- [ ] Cần giấy phép đặc biệt không?
- [ ] Có quy trình kiểm tra đặc biệt không?
- [ ] Có phụ phí cho hàng nguy hiểm không?

**Hàng Quá khổ:**
- [ ] Có vận chuyển hàng quá khổ không?
- [ ] Cần xe đặc biệt không?
- [ ] Cần xin phép cơ quan chức năng không?
- [ ] Thời gian xử lý trung bình: ___ ngày

**Multi-leg Shipment:**
- [ ] Có shipment cần nhiều xe không? (ví dụ: xe tải → xe container)
- [ ] Cần quản lý điểm chuyển tiếp không?
- [ ] Ai chịu trách nhiệm tại điểm chuyển tiếp?

### 4.2 Xử lý Ngoại lệ

**Xe hỏng giữa đường:**
- [ ] Quy trình hiện tại: ___________
- [ ] Thời gian trung bình tìm xe thay: ___ giờ
- [ ] Ai chịu chi phí?
- [ ] Có bảo hiểm không?

**Tài xế không đến:**
- [ ] Tần suất: ___ lần/tháng
- [ ] Quy trình xử lý: ___________
- [ ] Thời gian tìm tài xế thay: ___ giờ
- [ ] Có phạt tài xế không?

**Khách hàng hủy đơn:**
- [ ] Tần suất: ___ lần/tháng
- [ ] Có phí hủy không?
- [ ] Thời gian notice tối thiểu: ___ giờ
- [ ] Quy trình hoàn tiền: ___________

**Hàng bị hư hỏng:**
- [ ] Tần suất: ___ lần/tháng
- [ ] Quy trình xử lý: ___________
- [ ] Ai chịu trách nhiệm?
- [ ] Có bảo hiểm hàng hóa không?

**Delay:**
- [ ] Định nghĩa delay: Trễ > ___ giờ
- [ ] Tần suất delay: ___ % shipments
- [ ] Nguyên nhân chính:
  - [ ] Tắc đường: ___%
  - [ ] Xe hỏng: ___%
  - [ ] Khách chậm nhận: ___%
  - [ ] Khác: ___________
- [ ] Có bồi thường cho khách không?

---

## 👥 Phần 5: Người dùng & Phân quyền

### 5.1 Cơ cấu Tổ chức

**Ops Team:**
- [ ] Số lượng: ___ người
- [ ] Cấu trúc: 
  - [ ] Ops Manager: ___ người
  - [ ] Ops Staff: ___ người
- [ ] Làm việc theo ca không?
- [ ] Ca làm việc: ___________

**Dispatch Team:**
- [ ] Số lượng: ___ người
- [ ] Làm việc theo ca không?
- [ ] Ca làm việc: ___________
- [ ] Có dispatcher chuyên trách từng khu vực không?

**Accounting Team:**
- [ ] Số lượng: ___ người
- [ ] Cấu trúc:
  - [ ] Accounting Manager: ___ người
  - [ ] Accountant: ___ người
- [ ] Có phân công theo khách hàng không?

**Management:**
- [ ] Số lượng: ___ người
- [ ] Vai trò:
  - [ ] CEO/Owner: ___ người
  - [ ] Operations Manager: ___ người
  - [ ] Finance Manager: ___ người

### 5.2 Quyền hạn Chi tiết

**Ops:**
- [ ] Được tạo order/shipment: Có/Không
- [ ] Được sửa order/shipment: Có/Không (điều kiện: _______)
- [ ] Được xóa order/shipment: Có/Không (điều kiện: _______)
- [ ] Được xem tất cả shipments: Có/Không
- [ ] Được xem thông tin tài chính: Có/Không
- [ ] Được approve invoice: Có/Không

**Dispatcher:**
- [ ] Được tạo order/shipment: Có/Không
- [ ] Được sửa shipment: Có/Không (điều kiện: _______)
- [ ] Được assign/reassign xe: Có/Không
- [ ] Được xem tất cả shipments: Có/Không
- [ ] Được xem thông tin tài chính: Có/Không

**Accounting:**
- [ ] Được tạo order/shipment: Có/Không
- [ ] Được sửa shipment: Có/Không
- [ ] Được xem tất cả shipments: Có/Không
- [ ] Được tạo/sửa invoice: Có/Không
- [ ] Được approve payment: Có/Không

**Driver:**
- [ ] Được xem tất cả shipments: Có/Không
- [ ] Chỉ xem shipments của mình: Có/Không
- [ ] Được update status: Có/Không
- [ ] Được upload POD: Có/Không
- [ ] Được xem thông tin tài chính: Có/Không

---

## 📱 Phần 6: Công nghệ & Tích hợp

### 6.1 Hạ tầng Hiện tại

**Thiết bị:**
- [ ] Ops có laptop/desktop: Có/Không
- [ ] Dispatcher có laptop/desktop: Có/Không
- [ ] Accounting có laptop/desktop: Có/Không
- [ ] Driver có smartphone: ___%
- [ ] Loại smartphone phổ biến: Android/iOS
- [ ] Có máy in không? Loại gì?

**Kết nối Internet:**
- [ ] Văn phòng có WiFi: Có/Không
- [ ] Tốc độ internet: ___ Mbps
- [ ] Driver có 3G/4G: ___%
- [ ] Có vùng không có sóng không?

**Phần mềm Hiện tại:**
- [ ] Đang dùng Excel version: ___________
- [ ] Đang dùng accounting software: ___________
- [ ] Đang dùng email: Gmail/Outlook/Khác
- [ ] Đang dùng messaging: Zalo/WhatsApp/Telegram

### 6.2 Tích hợp Mong muốn

**Tích hợp Bên thứ ba:**
- [ ] Cần tích hợp GPS tracking: Có/Không
  - Nếu có, dùng thiết bị nào? ___________
- [ ] Cần tích hợp accounting software: Có/Không
  - Nếu có, software nào? ___________
- [ ] Cần tích hợp payment gateway: Có/Không
  - Nếu có, gateway nào? ___________
- [ ] Cần tích hợp Google Maps: Có/Không

**API & Export:**
- [ ] Cần export data ra Excel: Có/Không
- [ ] Cần export data ra PDF: Có/Không
- [ ] Cần API cho khách hàng: Có/Không
- [ ] Cần webhook notifications: Có/Không

---

## 🎯 Phần 7: Ưu tiên & Timeline

### 7.1 Tính năng Ưu tiên

**Must Have (M1 - 2-3 tháng):**
Đánh dấu các tính năng PHẢI có trong version đầu tiên:
- [ ] Order management
- [ ] Shipment management
- [ ] Dispatch management
- [ ] Status tracking
- [ ] POD upload
- [ ] Basic reporting
- [ ] User management
- [ ] Khác: ___________

**Should Have (M2 - 3-6 tháng):**
Đánh dấu các tính năng NÊN có trong version 2:
- [ ] Financial management (charges, invoices)
- [ ] Advanced reporting
- [ ] Customer portal
- [ ] Driver mobile app
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Khác: ___________

**Nice to Have (M3 - 6-12 tháng):**
Đánh dấu các tính năng TỐT NẾU CÓ:
- [ ] GPS tracking
- [ ] Route optimization
- [ ] Predictive analytics
- [ ] AI-powered dispatch
- [ ] Integration với accounting software
- [ ] Khác: ___________

### 7.2 Timeline Mong đợi

**Deployment:**
- [ ] Mong muốn go-live: ___ tháng ___ năm
- [ ] Có deadline cứng không: Có/Không
- [ ] Lý do deadline: ___________

**Training:**
- [ ] Thời gian training mong muốn: ___ ngày
- [ ] Hình thức training: Online/Offline/Cả hai
- [ ] Ai sẽ train: Internal/External

**Parallel Run:**
- [ ] Có chạy song song với Excel không: Có/Không
- [ ] Thời gian chạy song song: ___ tuần/tháng
- [ ] Tiêu chí để cutover hoàn toàn: ___________

---

## 📋 Phần 8: Rủi ro & Quan ngại

### 8.1 Rủi ro Dự kiến

**Rủi ro Kỹ thuật:**
- [ ] Quan ngại về data migration: ___________
- [ ] Quan ngại về performance: ___________
- [ ] Quan ngại về security: ___________
- [ ] Quan ngại về downtime: ___________

**Rủi ro Nghiệp vụ:**
- [ ] Quan ngại về user adoption: ___________
- [ ] Quan ngại về training: ___________
- [ ] Quan ngại về thay đổi quy trình: ___________
- [ ] Quan ngại về chi phí: ___________

**Rủi ro Tổ chức:**
- [ ] Có kháng cự thay đổi không: Có/Không
- [ ] Ai là champion của dự án: ___________
- [ ] Ai có thể block dự án: ___________
- [ ] Có budget approval chưa: Có/Không

### 8.2 Success Criteria

**Tiêu chí Thành công:**
Dự án được coi là thành công khi:
- [ ] __% users sử dụng hệ thống hàng ngày
- [ ] Giảm __% thời gian xử lý
- [ ] Giảm __% tỷ lệ lỗi
- [ ] Tăng __% customer satisfaction
- [ ] ROI đạt được sau ___ tháng
- [ ] Khác: ___________

---

## 📞 Phần 9: Thông tin Liên hệ

### 9.1 Stakeholders

**Project Sponsor:**
- Tên: ___________
- Chức vụ: ___________
- Email: ___________
- Phone: ___________

**Product Owner:**
- Tên: ___________
- Chức vụ: ___________
- Email: ___________
- Phone: ___________

**Key Users:**
- Ops Lead: ___________
- Dispatcher Lead: ___________
- Accounting Lead: ___________

### 9.2 Decision Makers

**Ai quyết định:**
- [ ] Tính năng: ___________
- [ ] Budget: ___________
- [ ] Timeline: ___________
- [ ] Go-live: ___________

---

## ✅ Phần 10: Xác nhận

**Người điền form:**
- Tên: ___________
- Chức vụ: ___________
- Ngày: ___________
- Chữ ký: ___________

**Người review:**
- Tên: ___________
- Chức vụ: ___________
- Ngày: ___________
- Chữ ký: ___________

---

## 📝 Ghi chú Bổ sung

Vui lòng ghi thêm bất kỳ thông tin nào bạn cho là quan trọng:

```
[Ghi chú của bạn ở đây]
```

---

**Hướng dẫn sử dụng:**
1. Đánh dấu [x] vào các checkbox phù hợp
2. Điền số liệu vào chỗ trống ___
3. Ghi rõ các thông tin bổ sung
4. Gửi lại file này sau khi hoàn thành

**Lưu ý:** Càng nhiều thông tin chi tiết, hệ thống càng đáp ứng đúng nhu cầu của bạn!
