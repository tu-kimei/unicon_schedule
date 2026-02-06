# 👥 User Management & Authorization Guide

## 📋 Tổng quan

Module quản lý User và phân quyền cho phép ADMIN quản lý tất cả users trong hệ thống, bao gồm:
- Xem danh sách users với filter và search
- Cập nhật role cho users
- Active/Deactivate users
- Xóa users (nếu không có data liên quan)

---

## 🎯 Tính năng

### 1. **Danh sách Users** (`/admin/users`)

**Chức năng:**
- Hiển thị tất cả users trong hệ thống
- Filter theo:
  - Role (ADMIN, ACCOUNTING, OPS, DISPATCHER, DRIVER, CUSTOMER_OWNER, CUSTOMER_OPS)
  - User Type (INTERNAL, CUSTOMER)
  - Status (Active, Inactive)
- Search theo email hoặc tên
- Hiển thị thống kê tổng quan
- Actions: Edit, Activate/Deactivate, Delete

**Quyền truy cập:**
- ✅ ADMIN: Full access
- ❌ Các role khác: Không có quyền

### 2. **Chi tiết User** (`/admin/users/:id`)

**Chức năng:**
- Xem thông tin chi tiết user
- Cập nhật role
- Active/Deactivate user
- Xem activity summary (dispatches, debts created)

**Quyền truy cập:**
- ✅ ADMIN: Xem và edit bất kỳ user nào
- ✅ User khác: Chỉ xem được profile của chính mình (read-only)

---

## 🔐 Phân quyền (Authorization)

### Roles trong hệ thống:

#### **Internal Users:**
1. **ADMIN** - Quản trị viên
   - Full quyền trên toàn hệ thống
   - Quản lý users, roles, permissions
   - Xem tất cả data

2. **ACCOUNTING** - Kế toán
   - Quản lý công nợ (debts)
   - Quản lý khách hàng (customers)
   - Xem shipments

3. **OPS** - Vận hành
   - Tạo và quản lý shipments
   - Upload PODs
   - Xem vehicles, drivers

4. **DISPATCHER** - Điều phối
   - Phân công xe và tài xế
   - Cập nhật trạng thái shipments
   - Quản lý dispatches

5. **DRIVER** - Tài xế
   - Xem shipments được phân công
   - Cập nhật trạng thái
   - Upload PODs

#### **Customer Users:**
6. **CUSTOMER_OWNER** - Chủ hàng
   - Xem orders và shipments của công ty mình
   - Xem công nợ

7. **CUSTOMER_OPS** - Vận hành khách hàng
   - Tạo orders
   - Xem shipments
   - Xem công nợ

---

## 🛠️ API Endpoints

### Queries

#### `getAllUsers`
```typescript
// Request
{
  role?: UserRole;
  userType?: UserType;
  isActive?: boolean;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response
{
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    internalUsers: number;
    customerUsers: number;
    byRole: {
      admin: number;
      accounting: number;
      ops: number;
      dispatcher: number;
      driver: number;
      customerOwner: number;
      customerOps: number;
    };
  };
}
```

#### `getUser`
```typescript
// Request
{
  id: string;
}

// Response
User & {
  customer?: Customer;
  driver?: Driver;
  createdDispatches: Dispatch[];
  createdDebts: Debt[];
}
```

### Actions

#### `updateUserRole`
```typescript
// Request
{
  userId: string;
  role: UserRole;
}

// Response
User

// Validation:
- Chỉ ADMIN có quyền
- Không thể thay đổi role của chính mình
- DRIVER role yêu cầu driver profile
- CUSTOMER roles yêu cầu customerId
```

#### `updateUserStatus`
```typescript
// Request
{
  userId: string;
  isActive: boolean;
}

// Response
User

// Validation:
- Chỉ ADMIN có quyền
- Không thể deactivate chính mình
```

#### `deleteUser`
```typescript
// Request
{
  userId: string;
}

// Response
{
  message: string;
  id: string;
}

// Validation:
- Chỉ ADMIN có quyền
- Không thể xóa chính mình
- Không thể xóa nếu user có:
  - Dispatches đã tạo
  - Status events đã tạo
  - PODs đã upload
  - Debts đã tạo
  - Driver dispatches
```

---

## 💻 Sử dụng

### Truy cập User Management

1. **Login với ADMIN account**
   - Email: `tunn2208@gmail.com`
   - Role: ADMIN

2. **Vào menu Admin**
   - Click vào sidebar
   - Chọn "Quản lý Users" trong section "Quản trị"

3. **Hoặc truy cập trực tiếp:**
   - https://tuctuc.kimei.dev/admin/users

### Filter và Search

**Filter theo Role:**
```
All Roles | Admin | Accounting | Operations | Dispatcher | Driver | Customer Owner | Customer Ops
```

**Filter theo User Type:**
```
All Types | Internal | Customer
```

**Filter theo Status:**
```
All Status | Active | Inactive
```

**Search:**
- Nhập email hoặc tên user
- Tìm kiếm không phân biệt hoa thường

### Cập nhật Role

1. Click "Edit" trên user muốn cập nhật
2. Chọn role mới từ dropdown
3. Click "Update Role"
4. Confirm thay đổi

**Lưu ý:**
- Không thể thay đổi role của chính mình
- DRIVER role yêu cầu user phải có driver profile
- CUSTOMER roles yêu cầu user phải được link với customer

### Active/Deactivate User

1. Click "Deactivate" hoặc "Activate" trên user
2. Confirm thay đổi

**Lưu ý:**
- Không thể deactivate chính mình
- User bị deactivate không thể login

### Xóa User

1. Click "Delete" trên user
2. Confirm xóa

**Lưu ý:**
- Không thể xóa chính mình
- Không thể xóa user có data liên quan
- Nếu user có data, hãy deactivate thay vì xóa

---

## 🎨 UI Components

### RoleBadge
Hiển thị role với màu sắc khác nhau:
- 🔴 ADMIN - Red
- 🔵 ACCOUNTING - Blue
- 🟢 OPS - Green
- 🟣 DISPATCHER - Purple
- 🟡 DRIVER - Yellow
- 🟣 CUSTOMER_OWNER - Indigo
- 🔵 CUSTOMER_OPS - Cyan

### UserStatusBadge
- 🟢 Active - Green
- ⚪ Inactive - Gray

### UserTypeBadge
- 🔵 Internal - Blue
- 🟠 Customer - Orange

---

## 📊 Business Rules

### Role Assignment Rules

1. **DRIVER Role:**
   - User phải có driver profile (record trong bảng `drivers`)
   - Tạo driver profile trước khi assign DRIVER role

2. **CUSTOMER Roles:**
   - User phải có `customerId` (linked to customer)
   - Chỉ có thể assign cho users thuộc customer

3. **INTERNAL Roles:**
   - Không yêu cầu customerId
   - Mặc định cho tất cả internal users

### User Deletion Rules

User **KHÔNG THỂ** bị xóa nếu có:
- ✅ Dispatches đã tạo
- ✅ Status events đã tạo
- ✅ PODs đã upload
- ✅ Debts đã tạo
- ✅ Driver dispatches (nếu là driver)

**Giải pháp:** Deactivate user thay vì xóa

### Self-Management Rules

User **KHÔNG THỂ:**
- ❌ Thay đổi role của chính mình
- ❌ Deactivate chính mình
- ❌ Xóa chính mình

---

## 🔧 Development

### Files Structure

```
src/admin/
├── actions/
│   └── users.ts          # updateUserRole, updateUserStatus, deleteUser
├── queries/
│   └── users.ts          # getAllUsers, getUser
├── components/
│   ├── RoleBadge.tsx     # Role badge component
│   ├── UserStatusBadge.tsx  # Status badge component
│   └── UserTypeBadge.tsx    # User type badge component
└── pages/
    ├── UsersListPage.tsx    # Users list with filters
    └── UserDetailsPage.tsx  # User details and edit
```

### Wasp Configuration

```wasp
// Routes
route UsersListRoute { path: "/admin/users", to: UsersListPage }
route UserDetailsRoute { path: "/admin/users/:id", to: UserDetailsPage }

// Queries
query getAllUsers { ... }
query getUser { ... }

// Actions
action updateUserRole { ... }
action updateUserStatus { ... }
action deleteUser { ... }
```

---

## 🚀 Testing

### Test Cases

1. **View Users List**
   - Login as ADMIN
   - Navigate to /admin/users
   - Verify all users are displayed

2. **Filter Users**
   - Filter by role: ADMIN
   - Verify only ADMIN users shown
   - Clear filter

3. **Search Users**
   - Search by email
   - Search by name
   - Verify results

4. **Update Role**
   - Select a user
   - Change role from OPS to DISPATCHER
   - Verify role updated
   - Check user can access dispatcher features

5. **Deactivate User**
   - Deactivate a user
   - Verify user cannot login
   - Reactivate user
   - Verify user can login again

6. **Delete User**
   - Try to delete user with data → Should fail
   - Delete user without data → Should succeed

7. **Permission Tests**
   - Login as OPS user
   - Try to access /admin/users → Should be denied
   - Try to call getAllUsers API → Should return 403

---

## 📝 Notes

### Security Considerations

1. **Authorization:**
   - All endpoints check user.role === 'ADMIN'
   - Frontend also hides menu for non-admin users
   - Double-layer security (frontend + backend)

2. **Self-Management Prevention:**
   - Users cannot modify their own role/status
   - Prevents privilege escalation
   - Prevents account lockout

3. **Data Integrity:**
   - Cannot delete users with related data
   - Soft delete recommended (deactivate)
   - Maintains audit trail

### Future Enhancements

- [ ] Bulk operations (activate/deactivate multiple users)
- [ ] User activity logs
- [ ] Password reset by admin
- [ ] User invitation system
- [ ] Role-based dashboard customization
- [ ] Advanced permissions (granular permissions per feature)

---

## 🆘 Troubleshooting

### "Only ADMIN can view all users"
- Verify user role is ADMIN
- Check database: `SELECT role FROM users WHERE email = 'your@email.com'`
- Update role if needed: `UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com'`

### "Cannot delete user with existing data"
- User has related records in database
- Solution: Deactivate user instead
- Or manually clean up related data first

### "User must have a driver profile"
- Create driver profile first
- Then assign DRIVER role

### "User must be linked to a customer"
- Set customerId for user
- Then assign CUSTOMER_OWNER or CUSTOMER_OPS role

---

**User Management module hoàn tất! 🎉**

Access: https://tuctuc.kimei.dev/admin/users
