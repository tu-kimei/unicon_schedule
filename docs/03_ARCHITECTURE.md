--- docs/03_ARCHITECTURE.md
+++ docs/03_ARCHITECTURE.md
@@
+# 1. Tổng quan kiến trúc
+
+Ứng dụng internal tool sử dụng:
+- Frontend: Next.js
+- Backend: Next.js Route Handlers hoặc Wasp Actions
+- DB: PostgreSQL
+- ORM: Prisma
+
+# 2. Kiến trúc logic
+
+- UI Layer: CRUD, workflow, dashboard
+- Application Layer: business rules, permission
+- Data Layer: relational DB + audit logs
+
+# 3. Nguyên tắc dữ liệu
+
+- Không overwrite trạng thái: dùng status event
+- Mọi hành động quan trọng đều ghi audit log
+
+# 4. Auth & Permission (v0.1)
+
+- Login nội bộ: Sử dụng email và mật khẩu
+- Role-based access: 
+  - Ops: Tạo và chỉnh sửa Order/Shipment
+  - Dispatcher: Điều phối xe và tài xế
+  - Accounting: Xem và lập hóa đơn
+- Chưa cần permission matrix chi tiết

# 5. Email Configuration (Production)

## SMTP Provider Setup (Ready for Configuration)

**Current Status**: Using Dummy provider (emails logged to console)
**SMTP Details Provided**:
- **Provider**: Lark Suite SMTP
- **Host**: smtp.larksuite.com
- **Port**: 465 (SSL) or 587 (STARTTLS)
- **Username**: no-reply@unicon.ltd
- **Password**: Ubkv9EAS9SXqefoa
- **Encryption**: SSL/STARTTLS

**When Wasp SMTP syntax is confirmed, update main.wasp**:
```typescript
emailSender: {
  provider: SMTP,
  // Add correct Wasp field names when documented
  // host: "smtp.larksuite.com",
  // port: 465,
  // username: "no-reply@unicon.ltd",
  // password: "Ubkv9EAS9SXqefoa",
  // encryption: "SSL"
}
```

**From Email**: Basic App <hello@example.com>

## Email Templates Used

### 1. Email Verification (Signup)
- **Subject**: "Verify your Unicon Schedule account"
- **Content**: Welcome message + verification link
- **Trigger**: After successful signup

### 2. Password Reset
- **Subject**: "Reset your Unicon Schedule password"
- **Content**: Password reset instructions + secure link
- **Trigger**: User requests password reset

### 3. Login Notifications (Future)
- **Subject**: "New login to your Unicon Schedule account"
- **Content**: Security notification for new login
- **Trigger**: Successful login from new device/location

## Implementation Notes

- **Dummy Email**: Currently using Wasp's Dummy provider (logs to console)
- **Production**: Switch to SMTP provider for actual email delivery
- **Templates**: Wasp handles HTML/Text templates automatically
- **Security**: Password reset tokens expire in 24 hours
- **Rate Limiting**: Built-in protection against email spam

## Testing Email Configuration

```bash
# Test email sending (in development)
# Emails will appear in server logs with Dummy provider

# Check email logs in terminal where wasp start is running
# Look for "Dummy email sender" sections
```
