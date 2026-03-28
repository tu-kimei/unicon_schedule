# Tài khoản test - Unicon Logistics

> **Password chung: `password123`**
>
> Chạy `npx tsx scripts/seed-auth.ts` để reset lại password tất cả users.

---

## Nội bộ (INTERNAL)

### Quản trị viên (ADMIN)

| Email | Tên | Quyền |
|-------|-----|-------|
| tunn@kimei.vn | Admin Unicon | Toàn quyền hệ thống |

### Vận hành (OPS)

| Email | Tên | Quyền |
|-------|-----|-------|
| ops@unicon.com | Trần Văn Vận Hành | Quản lý chuyến hàng, chứng từ |

### Điều phối (DISPATCHER)

| Email | Tên | Quyền |
|-------|-----|-------|
| dispatcher@unicon.com | Lê Văn Điều Phối | Gán xe, tài xế, điều phối chuyến |

### Kế toán (ACCOUNTING)

| Email | Tên | Quyền |
|-------|-----|-------|
| accounting@unicon.com | Nguyễn Thị Kế Toán | Công nợ, hóa đơn, thanh toán |

### Tài xế (DRIVER) - Đang hoạt động

| Email | Tên |
|-------|-----|
| driver1@unicon.com | Phạm Văn Tài Xế 1 |
| minh@driver.unicon.vn | Minh |
| doan@driver.unicon.vn | Đoàn |
| linh@driver.unicon.vn | Linh |
| quang@driver.unicon.vn | Quang |
| khuong@driver.unicon.vn | Khương |
| thao@driver.unicon.vn | Thảo |
| ha@driver.unicon.vn | Hà |
| son@driver.unicon.vn | Sơn |
| tinh@driver.unicon.vn | Tĩnh |
| lap_nguyen@driver.unicon.vn | Lập Nguyễn |
| thue_xe_suong@driver.unicon.vn | Thuê xe Sương |
| thue_xe_apt@driver.unicon.vn | Thuê xe APT |
| thue_xe_ngoai@driver.unicon.vn | Thuê xe ngoài |
| tai_xe_khac_thue_ngoai@driver.unicon.vn | Tài xế khác (thuê ngoài) |
| xe_hai_duong@driver.unicon.vn | Xe Hải Dương |

### Tài xế (DRIVER) - Không hoạt động

| Email | Tên |
|-------|-----|
| dung@driver.unicon.vn | Dũng |
| hung@driver.unicon.vn | Hưng |
| nguyen_chung@driver.unicon.vn | Nguyễn Chung |

---

## Khách hàng (CUSTOMER)

### CTY AN PHÁT THỊNH

| Email | Tên | Vai trò |
|-------|-----|---------|
| khachhang@unicon.ltd | Khách hàng A | CUSTOMER_OWNER |
| anphatthinh_owner@unicon.ltd | Chủ hàng APT | CUSTOMER_OWNER |

### Công ty TNHH Vinamilk

| Email | Tên | Vai trò |
|-------|-----|---------|
| owner@vinamilk.com | Nguyễn Văn Chủ Hàng Vinamilk | CUSTOMER_OWNER |
| ops@vinamilk.com | Trần Thị Vận Hành Vinamilk | CUSTOMER_OPS |
| testcustomer@vinamilk.com | Test Customer VNM | CUSTOMER_OPS |

---

## Redirect theo vai trò

| Vai trò | Redirect sau login |
|---------|-------------------|
| ADMIN, OPS | /ops/shipments |
| DISPATCHER | /dispatcher |
| DRIVER | /driver |
| CUSTOMER_OWNER, CUSTOMER_OPS | /customer |
| ACCOUNTING | /ops/shipments |
