# Hướng dẫn Sử dụng - Quản lý Công nợ

## 📖 Mục lục

1. [Truy cập hệ thống](#truy-cập-hệ-thống)
2. [Xem danh sách công nợ](#xem-danh-sách-công-nợ)
3. [Tạo công nợ mới](#tạo-công-nợ-mới)
4. [Cập nhật thanh toán](#cập-nhật-thanh-toán)
5. [Xem chi tiết công nợ](#xem-chi-tiết-công-nợ)
6. [Filter và tìm kiếm](#filter-và-tìm-kiếm)
7. [Xóa công nợ](#xóa-công-nợ)

---

## 1. Truy cập Hệ thống

### Đăng nhập

1. Truy cập: http://localhost:3000/login
2. Nhập email và password
3. Click "Log in"

### Tài khoản test:

| Email | Password | Role | Quyền |
|-------|----------|------|-------|
| tunn@kimei.vn | admin123 | ADMIN | Full access |
| accounting@unicon.ltd | driver123 | ACCOUNTING | Full access |
| ops@unicon.ltd | ops123 | OPS | Chỉ xem |

### Truy cập Quản lý Công nợ

Sau khi login, click menu **"Công nợ"** trên header.

---

## 2. Xem Danh sách Công nợ

### Màn hình chính

**URL**: `/accounting/debts`

**Hiển thị**:
- **Summary Cards**: Tổng công nợ, Chưa thanh toán, Đã thanh toán, Quá hạn
- **Filters**: Tháng, Khách hàng, Trạng thái
- **Table**: Danh sách công nợ grouped theo tháng

### Ý nghĩa các màu:

- 🟢 **Xanh lá**: Đã thanh toán
- 🟡 **Vàng**: Chưa thanh toán (còn hạn)
- 🔴 **Đỏ**: Quá hạn (highlight toàn bộ row)
- ⚪ **Xám**: Đã hủy

### Thông tin hiển thị:

- **Khách hàng**: Tên + email
- **Loại**: Cước vận chuyển / Chi hộ / Khác
- **Số tiền**: Format VND (50,000,000)
- **Ngày ghi nhận**: DD/MM/YYYY
- **Đến hạn**: DD/MM/YYYY + số ngày quá hạn/còn lại
- **Trạng thái**: Badge màu
- **Hành động**: Xem, Thanh toán

---

## 3. Tạo Công nợ Mới

### Bước 1: Mở form

Click button **"+ Tạo công nợ mới"** (góc trên bên phải)

### Bước 2: Điền thông tin

**Thông tin bắt buộc** (có dấu *):

1. **Khách hàng**: Chọn từ dropdown
   - Hệ thống sẽ tự động load thời hạn công nợ của khách hàng

2. **Loại công nợ**: Chọn 1 trong 3
   - ○ Cước vận chuyển
   - ○ Chi hộ
   - ○ Khác

3. **Tháng**: Chọn tháng (MM/YYYY)
   - Ví dụ: 02/2026

4. **Số tiền**: Nhập số tiền (VND)
   - Ví dụ: 50000000 (50 triệu)

5. **Ngày ghi nhận**: Chọn ngày
   - Mặc định: Hôm nay
   - Có thể chọn ngày khác

**Thông tin tự động**:
- **Ngày đến hạn**: Tự động tính = Ngày ghi nhận + Thời hạn của khách hàng
  - Ví dụ: 28/02/2026 + 30 ngày = 30/03/2026

**Thông tin tùy chọn**:

6. **Link bảng kê / Chứng từ**: Paste link Google Sheet
   - Ví dụ: https://docs.google.com/spreadsheets/d/abc123

7. **Hình ảnh Hóa đơn**: Upload files
   - Click vào vùng upload hoặc kéo thả file
   - Chấp nhận: JPG, PNG, PDF
   - Tối đa: 5MB/file, 10 files
   - Preview ngay sau khi upload
   - Click × để xóa file

8. **Ghi chú**: Nhập ghi chú
   - Ví dụ: "Công nợ tháng 2/2026 - 10 chuyến hàng"

### Bước 3: Tạo công nợ

Click button **"Tạo công nợ"**

### Kết quả:
- ✅ Công nợ mới xuất hiện trong danh sách
- ✅ Status = "Chưa thanh toán"
- ✅ Hiển thị trong section tháng tương ứng

---

## 4. Cập nhật Thanh toán

### Bước 1: Tìm công nợ

Tìm công nợ cần cập nhật thanh toán (status = "Chưa thanh toán")

### Bước 2: Mở form thanh toán

Click button **"Thanh toán"** trên row của công nợ

### Bước 3: Điền thông tin thanh toán

**Thông tin hiển thị**:
- Khách hàng
- Số tiền công nợ
- Ngày đến hạn

**Thông tin cần nhập**:

1. **Số tiền thanh toán**: (Auto-fill = số tiền công nợ)
   - MVP: Phải thanh toán full, không thể sửa
   - Ví dụ: 50,000,000 VND

2. **Ngày thanh toán**: Chọn ngày
   - Mặc định: Hôm nay
   - Có thể chọn ngày khác

3. **Hình ảnh UNC** (Ủy nhiệm chi): Upload files
   - Click vào vùng upload hoặc kéo thả
   - Chấp nhận: JPG, PNG, PDF
   - Tối đa: 5MB/file
   - Preview ngay sau khi upload

4. **Ghi chú thanh toán**: Nhập ghi chú
   - Ví dụ: "Đã nhận chuyển khoản ngày 25/3/2026"

### Bước 4: Xác nhận

Click button **"Xác nhận thanh toán"**

### Kết quả:
- ✅ Status updated = "Đã thanh toán" (màu xanh)
- ✅ Thông tin thanh toán được lưu
- ✅ Không thể sửa/xóa nữa

---

## 5. Xem Chi tiết Công nợ

### Cách 1: Click "Xem" trên row

### Cách 2: Click vào tên khách hàng

### Thông tin hiển thị:

**Card 1: Thông tin công nợ**
- Loại công nợ
- Tháng
- Số tiền (highlight lớn)
- Ngày ghi nhận
- Đến hạn (+ số ngày quá hạn/còn lại)

**Card 2: Thông tin thanh toán**
- Trạng thái
- Số tiền đã trả (nếu đã thanh toán)
- Ngày thanh toán (nếu đã thanh toán)
- Ghi chú thanh toán
- Button "Cập nhật thanh toán" (nếu chưa thanh toán)

**Bảng kê / Chứng từ**:
- Link Google Sheet (click để mở)

**Hình ảnh Hóa đơn**:
- Gallery hiển thị tất cả hình
- Click để xem full size (lightbox)
- Navigation: ‹ › để xem ảnh trước/sau

**Hình ảnh UNC** (nếu đã thanh toán):
- Gallery hiển thị hình UNC
- Click để xem full size

**Ghi chú**:
- Hiển thị ghi chú đầy đủ

**Thông tin khác**:
- Người tạo
- Ngày tạo
- Cập nhật lần cuối

### Actions:
- **← Quay lại**: Về danh sách
- **Xóa**: Xóa công nợ (chỉ Admin, chỉ khi chưa thanh toán)

---

## 6. Filter và Tìm kiếm

### Filter theo Tháng

1. Click dropdown "Tháng"
2. Chọn tháng (ví dụ: 02/2026)
3. Danh sách chỉ hiển thị công nợ của tháng đó

### Filter theo Khách hàng

1. Click dropdown "Khách hàng"
2. Chọn khách hàng
3. Danh sách chỉ hiển thị công nợ của khách hàng đó

### Filter theo Trạng thái

1. Click dropdown "Trạng thái"
2. Chọn: Tất cả / Chưa thanh toán / Đã thanh toán / Quá hạn

### Chỉ hiển thị Quá hạn

Check ☑ "Chỉ hiển thị công nợ quá hạn"

→ Danh sách chỉ hiển thị công nợ đã quá hạn (màu đỏ)

### Kết hợp Filters

Có thể kết hợp nhiều filters:
- Ví dụ: Tháng 02/2026 + Khách hàng ABC + Chưa thanh toán

---

## 7. Xóa Công nợ

⚠️ **Chỉ Admin được xóa**

### Bước 1: Vào chi tiết công nợ

Click "Xem" → Vào trang chi tiết

### Bước 2: Click "Xóa"

Button "Xóa" ở góc trên bên phải

### Bước 3: Xác nhận

Confirm dialog: "Bạn có chắc muốn xóa công nợ này?"

### Lưu ý:
- ❌ Không xóa được nếu đã thanh toán
- ✅ Soft delete (vẫn lưu trong database, chỉ ẩn đi)

---

## 📊 Hiểu Summary Cards

### Tổng công nợ (Màu xanh dương)
- Tổng số tiền của TẤT CẢ công nợ (bao gồm cả đã thanh toán)

### Chưa thanh toán (Màu vàng)
- Tổng số tiền công nợ chưa thanh toán
- Số lượng công nợ chưa thanh toán

### Đã thanh toán (Màu xanh lá)
- Tổng số tiền đã thu được
- Số lượng công nợ đã thanh toán

### Quá hạn (Màu đỏ)
- Tổng số tiền công nợ quá hạn
- Số lượng công nợ quá hạn
- ⚠️ Cần ưu tiên nhắc nhở!

---

## 💡 Tips & Best Practices

### Khi tạo công nợ:
- ✅ Luôn upload hình hóa đơn để dễ đối soát
- ✅ Paste link bảng kê Google Sheet
- ✅ Ghi chú rõ ràng (số chuyến, nội dung)
- ✅ Kiểm tra ngày đến hạn tự động có đúng không

### Khi cập nhật thanh toán:
- ✅ Upload hình UNC để có chứng từ
- ✅ Ghi chú ngày nhận tiền thực tế
- ✅ Kiểm tra số tiền trước khi xác nhận

### Quản lý công nợ quá hạn:
- ✅ Check "Chỉ hiển thị quá hạn" mỗi ngày
- ✅ Ưu tiên nhắc nhở khách có số ngày quá hạn lớn
- ✅ Ghi chú lại lịch sử liên hệ với khách

### Đối soát cuối tháng:
- ✅ Filter theo tháng cần đối soát
- ✅ Kiểm tra từng công nợ với bảng kê
- ✅ Verify hình ảnh hóa đơn và UNC
- ✅ Đảm bảo tất cả đã có status đúng

---

## ⚠️ Lưu ý Quan trọng

### Về Thanh toán:
- ⚠️ MVP chỉ hỗ trợ thanh toán FULL (không thanh toán từng phần)
- ⚠️ Sau khi đánh dấu "Đã thanh toán", không thể sửa được nữa
- ⚠️ Nếu nhập sai, cần Admin xóa và tạo lại

### Về Upload File:
- ⚠️ Tối đa 5MB/file
- ⚠️ Chỉ chấp nhận JPG, PNG, PDF
- ⚠️ Tối đa 10 files/lần upload
- ⚠️ File được lưu trên server, không thể khôi phục nếu xóa nhầm

### Về Permissions:
- ⚠️ OPS chỉ xem được, không tạo/sửa/xóa
- ⚠️ Chỉ Admin mới xóa được công nợ
- ⚠️ Accounting và Admin có full access

---

## 🐛 Xử lý Lỗi Thường gặp

### "Invalid credentials"
→ Kiểm tra lại email/password

### "You don't have permission"
→ Kiểm tra role của user (cần ADMIN hoặc ACCOUNTING)

### "File upload failed"
→ Kiểm tra:
- File size < 5MB?
- File type đúng (JPG, PNG, PDF)?
- Internet connection OK?

### "Cannot update paid debt"
→ Công nợ đã thanh toán không thể sửa. Cần Admin xóa và tạo lại.

### Modal không đóng được
→ Click vào vùng tối (backdrop) hoặc nút × hoặc ESC

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check console log (F12 → Console)
2. Screenshot lỗi
3. Liên hệ IT support

---

**Chúc bạn sử dụng hiệu quả!** 🎉
