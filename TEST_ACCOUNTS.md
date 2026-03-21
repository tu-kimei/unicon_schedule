# Test Accounts - Unicon Schedule

> **Lưu ý:** File này chỉ dùng cho môi trường development. KHÔNG commit lên production.

## Tài khoản có thể login (có Auth Identity)

| # | Email | Password | Role | UserType | Mô tả |
|---|-------|----------|------|----------|-------|
| 1 | `tunn@kimei.vn` | `password123` | ADMIN | INTERNAL | Admin - full quyền |
| 2 | `khachhang@unicon.ltd` | `password123` | CUSTOMER_OWNER | CUSTOMER | Chủ hàng - Khách hàng A |
| 3 | `owner@vinamilk.com` | `password123` | CUSTOMER_OWNER | CUSTOMER | Chủ hàng - Vinamilk |
| 4 | `ops@vinamilk.com` | `password123` | CUSTOMER_OPS | CUSTOMER | Vận hành KH - Vinamilk |
| 5 | `testcustomer@vinamilk.com` | `password123` | CUSTOMER_OPS | CUSTOMER | Test user - Vinamilk |

## Tài khoản CHƯA có Auth Identity (không login được)

Các tài khoản dưới đây được tạo qua SQL trực tiếp, chưa có Auth Identity.
Dùng chức năng **Force Reset Password** từ Admin UI để tạo Auth Identity cho chúng.

### Internal Users

| Email | Role | Mô tả |
|-------|------|-------|
| `ops@unicon.com` | OPS | Vận hành nội bộ |
| `dispatcher@unicon.com` | DISPATCHER | Điều phối |
| `accounting@unicon.com` | ACCOUNTING | Kế toán |

### Driver Users (INTERNAL)

| Email | Tên | Active |
|-------|-----|--------|
| `driver1@unicon.com` | Phạm Văn Tài Xế 1 | Yes |
| `doan@driver.unicon.vn` | Đoàn | Yes |
| `linh@driver.unicon.vn` | Linh | Yes |
| `quang@driver.unicon.vn` | Quang | Yes |
| `lap_nguyen@driver.unicon.vn` | Lập Nguyễn | Yes |
| `khuong@driver.unicon.vn` | Khương | Yes |
| `thao@driver.unicon.vn` | Thảo | Yes |
| `ha@driver.unicon.vn` | Hà | Yes |
| `son@driver.unicon.vn` | SƠN | Yes |
| `tinh@driver.unicon.vn` | Tĩnh | Yes |
| `minh@driver.unicon.vn` | Minh | Yes |
| `thue_xe_suong@driver.unicon.vn` | Thuê xe Sương | Yes |
| `thue_xe_apt@driver.unicon.vn` | THUÊ XE APT | Yes |
| `thue_xe_ngoai@driver.unicon.vn` | THUÊ XE NGOÀI | Yes |
| `xe_hai_duong@driver.unicon.vn` | XE HẢI DƯƠNG | Yes |
| `tai_xe_khac_thue_ngoai@driver.unicon.vn` | Tài xế khác (thuê ngoài) | Yes |
| `hung@driver.unicon.vn` | HƯNG | **No** |
| `dung@driver.unicon.vn` | DŨNG | **No** |
| `nguyen_chung@driver.unicon.vn` | Nguyen Chung | **No** |

## Hướng dẫn tạo Auth cho user cũ

1. Login với tài khoản ADMIN (`tunn@kimei.vn`)
2. Vào **Quản trị > Quản lý Users**
3. Chọn user cần fix > click **Reset Password**
4. Nhập password mới (tối thiểu 8 ký tự)
5. Hệ thống sẽ tự động tạo Auth Identity nếu chưa có

## URL

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
