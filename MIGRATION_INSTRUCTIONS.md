# 🚀 MIGRATION INSTRUCTIONS - Remove Order Entity

**Ngày:** 12/02/2026  
**Mục đích:** Xóa Order entity và chuyển sang workflow Customer → Shipment trực tiếp

---

## ⚠️ QUAN TRỌNG - ĐỌC TRƯỚC KHI CHẠY

Migration này sẽ:
1. ❌ **XÓA** bảng `orders` và tất cả dữ liệu orders
2. ❌ **XÓA** enum `OrderStatus`
3. ✅ **THÊM** cột `customerId` vào bảng `shipments`
4. ✅ **MIGRATE** dữ liệu: Copy `customerId` từ orders sang shipments
5. ❌ **XÓA** cột `orderId` từ bảng `shipments`

**LƯU Ý:** Migration này **KHÔNG THỂ ROLLBACK** dễ dàng. Hãy backup database trước!

---

## 📋 BƯỚC 1: BACKUP DATABASE

```bash
# Backup toàn bộ database
pg_dump -h localhost -U postgres -d unicon_schedule > backup_before_order_removal_$(date +%Y%m%d_%H%M%S).sql

# Hoặc chỉ backup orders table
pg_dump -h localhost -U postgres -d unicon_schedule -t orders > backup_orders_table.sql
```

---

## 📋 BƯỚC 2: VERIFY CURRENT STATE

```bash
# Kiểm tra số lượng orders
psql -h localhost -U postgres -d unicon_schedule -c "SELECT COUNT(*) FROM orders;"

# Kiểm tra số lượng shipments
psql -h localhost -U postgres -d unicon_schedule -c "SELECT COUNT(*) FROM shipments;"

# Kiểm tra tất cả shipments đều có orderId
psql -h localhost -U postgres -d unicon_schedule -c "SELECT COUNT(*) FROM shipments WHERE \"orderId\" IS NULL;"
# Kết quả phải là 0

# Kiểm tra tất cả orders đều có customerId
psql -h localhost -U postgres -d unicon_schedule -c "SELECT COUNT(*) FROM orders WHERE \"customerId\" IS NULL;"
# Kết quả phải là 0
```

---

## 📋 BƯỚC 3: RUN MIGRATION

### Option A: Sử dụng Wasp (Recommended)

```bash
cd /Users/nguyentu/workspace/unicon_schedule

# Chạy migration (sẽ prompt nhập tên)
wasp db migrate-dev
# Khi được hỏi tên migration, nhập: remove_order_entity
```

### Option B: Sử dụng Prisma trực tiếp

```bash
cd /Users/nguyentu/workspace/unicon_schedule

# Generate migration
npx prisma migrate dev --name remove_order_entity --schema=./schema.prisma
```

### Option C: Chạy SQL thủ công (Nếu Option A & B không work)

```bash
# Chạy migration SQL file
psql -h localhost -U postgres -d unicon_schedule -f migrations/20260212_remove_order_entity/migration.sql

# Hoặc
psql -h localhost -U postgres -d unicon_schedule -f migrations/remove_order_entity.sql
```

---

## 📋 BƯỚC 4: VERIFY MIGRATION

```bash
# 1. Kiểm tra orders table đã bị xóa
psql -h localhost -U postgres -d unicon_schedule -c "\dt orders"
# Kết quả: Did not find any relation named "orders"

# 2. Kiểm tra shipments có customerId
psql -h localhost -U postgres -d unicon_schedule -c "\d shipments"
# Phải thấy cột customerId

# 3. Kiểm tra tất cả shipments có customerId
psql -h localhost -U postgres -d unicon_schedule -c "SELECT COUNT(*) FROM shipments WHERE \"customerId\" IS NULL;"
# Kết quả phải là 0

# 4. Kiểm tra foreign key constraint
psql -h localhost -U postgres -d unicon_schedule -c "SELECT conname FROM pg_constraint WHERE conrelid = 'shipments'::regclass AND conname LIKE '%customer%';"
# Phải thấy: shipments_customerId_fkey

# 5. Kiểm tra index
psql -h localhost -U postgres -d unicon_schedule -c "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' AND indexname LIKE '%customer%';"
# Phải thấy: shipments_customerId_currentStatus_idx

# 6. Kiểm tra OrderStatus enum đã bị xóa
psql -h localhost -U postgres -d unicon_schedule -c "SELECT typname FROM pg_type WHERE typname = 'OrderStatus';"
# Kết quả: (0 rows)

# 7. Test query
psql -h localhost -U postgres -d unicon_schedule -c "SELECT s.id, s.\"shipmentNumber\", c.name as customer_name FROM shipments s JOIN customers c ON s.\"customerId\" = c.id LIMIT 5;"
# Phải hiển thị shipments với customer names
```

---

## 📋 BƯỚC 5: TEST APPLICATION

```bash
# Start development server
wasp start

# Test trong browser:
# 1. Navigate to /ops/shipments/create
# 2. Chọn Customer từ dropdown (không còn Order)
# 3. Tạo shipment mới
# 4. Verify shipment được tạo thành công
# 5. Xem shipment details - phải hiển thị Customer
# 6. Xem Dispatcher Dashboard - phải hiển thị Customer
```

---

## 🔄 ROLLBACK (Nếu cần)

**⚠️ CHỈ ROLLBACK NẾU MIGRATION THẤT BẠI**

```bash
# 1. Restore từ backup
psql -h localhost -U postgres -d unicon_schedule < backup_before_order_removal_*.sql

# 2. Revert code changes
git checkout HEAD -- schema.prisma main.wasp src/

# 3. Recompile
wasp compile
```

---

## ✅ SUCCESS CRITERIA

Migration thành công khi:
- [x] Code compile không lỗi
- [ ] Migration chạy thành công
- [ ] Orders table đã bị xóa
- [ ] Shipments có customerId
- [ ] Tất cả shipments có customerId (không NULL)
- [ ] Foreign key constraint tồn tại
- [ ] Index được tạo
- [ ] UI hiển thị Customer correctly
- [ ] Có thể tạo shipment mới với Customer
- [ ] Không có console errors

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Check logs: `.blackbox/tmp/shell_tool_*.log`
2. Check Wasp logs: `.wasp/out/`
3. Check database logs
4. Restore từ backup nếu cần

---

## 📊 CHANGES SUMMARY

### Database
- ❌ Dropped: `orders` table
- ❌ Dropped: `OrderStatus` enum
- ✅ Added: `shipments.customerId` column
- ❌ Dropped: `shipments.orderId` column
- ✅ Added: Foreign key `shipments_customerId_fkey`
- ✅ Added: Index `shipments_customerId_currentStatus_idx`

### Code
- ❌ Deleted: `/src/logistics/queries/orders.ts`
- ✅ Modified: 8 files (schema, wasp, queries, actions, pages, components)
- ✅ Created: 3 docs (IMPLEMENTATION_PLAN, ORDER_REMOVAL_SUMMARY, MIGRATION_INSTRUCTIONS)

### Workflow
- ❌ Old: Customer → Order → Shipment
- ✅ New: Customer → Shipment (direct)

---

**Status:** ✅ Code changes complete, ready for migration  
**Next:** Run database migration (BƯỚC 3)
