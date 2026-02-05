# 📁 Tài liệu và File Deployment

Danh sách đầy đủ các file và tài liệu liên quan đến deployment.

## 📚 Tài liệu

### 1. DEPLOYMENT_GUIDE.md
**Hướng dẫn deploy chi tiết và đầy đủ**

Bao gồm:
- Yêu cầu hệ thống
- Chuẩn bị môi trường
- Cấu hình Database và Email
- Build ứng dụng
- Deploy với Docker và thủ công
- Cấu hình Nginx và SSL
- Monitoring, Logging
- Backup & Recovery
- Troubleshooting

👉 **Đọc file này để hiểu đầy đủ quy trình deployment**

### 2. QUICK_START_DEPLOY.md
**Hướng dẫn deploy nhanh**

Bao gồm:
- Deploy nhanh với Docker (5 bước)
- Deploy thủ công (6 bước)
- Quản lý sau khi deploy
- Bảo mật cơ bản
- Setup backup
- Troubleshooting nhanh

👉 **Đọc file này nếu bạn muốn deploy nhanh**

### 3. UPLOAD_STRUCTURE.md
**Tài liệu về cấu trúc upload**

Bao gồm:
- Cấu trúc thư mục uploads
- API upload parameters
- Ví dụ sử dụng
- Quyền truy cập

👉 **Đọc file này để hiểu cách upload hoạt động**

---

## ⚙️ File cấu hình

### 1. .env.server.example
**Template cho environment variables (deploy thủ công)**

Sử dụng:
```bash
cp .env.server.example .env.server
nano .env.server  # Sửa các giá trị
```

Chứa:
- DATABASE_URL
- SMTP configuration
- WASP URLs
- SESSION_SECRET
- NODE_ENV, PORT

### 2. .env.docker.example
**Template cho environment variables (deploy với Docker)**

Sử dụng:
```bash
cp .env.docker.example .env
nano .env  # Sửa các giá trị
```

Chứa:
- DB_PASSWORD
- SMTP configuration
- WASP URLs
- SESSION_SECRET

### 3. ecosystem.config.js
**PM2 configuration file**

Sử dụng:
```bash
pm2 start ecosystem.config.js
```

Cấu hình:
- App name: unicon-schedule
- Cluster mode: 2 instances
- Auto restart
- Logging
- Memory limit: 1GB

### 4. Dockerfile
**Docker image configuration**

Build stages:
- Builder: Install Wasp, build app
- Production: Copy built files, setup directories

Features:
- Multi-stage build
- Non-root user
- Health check
- Optimized layers

### 5. docker-compose.yml
**Docker Compose orchestration**

Services:
- postgres: PostgreSQL 14
- app: Unicon Schedule
- nginx: Reverse proxy (optional)

Features:
- Health checks
- Volume persistence
- Network isolation
- Environment variables

---

## 🔧 Scripts

### 1. scripts/backup-database.sh
**Backup PostgreSQL database**

Features:
- Compressed backup (.sql.gz)
- Retention: 7 days
- Automatic cleanup
- Colored output

Sử dụng:
```bash
./scripts/backup-database.sh
```

Cron job:
```bash
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/unicon/backup.log 2>&1
```

### 2. scripts/backup-uploads.sh
**Backup uploads directory**

Features:
- Compressed backup (.tar.gz)
- Retention: 30 days
- Automatic cleanup
- File count report

Sử dụng:
```bash
./scripts/backup-uploads.sh
```

Cron job:
```bash
0 3 * * * /path/to/scripts/backup-uploads.sh >> /var/log/unicon/backup.log 2>&1
```

### 3. scripts/restore-database.sh
**Restore database from backup**

Features:
- Confirmation prompt
- Stop app before restore
- Drop and recreate database
- Restart app after restore

Sử dụng:
```bash
./scripts/restore-database.sh /path/to/backup.sql.gz
```

⚠️ **WARNING**: Sẽ overwrite database hiện tại!

---

## 📂 Cấu trúc thư mục

```
unicon_schedule/
├── DEPLOYMENT_GUIDE.md          # Hướng dẫn deploy đầy đủ
├── QUICK_START_DEPLOY.md        # Hướng dẫn deploy nhanh
├── UPLOAD_STRUCTURE.md          # Tài liệu upload
├── DEPLOYMENT_FILES.md          # File này
│
├── .env.server.example          # Template env (thủ công)
├── .env.docker.example          # Template env (Docker)
├── ecosystem.config.js          # PM2 config
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Docker Compose
│
├── scripts/
│   ├── backup-database.sh       # Backup DB
│   ├── backup-uploads.sh        # Backup uploads
│   └── restore-database.sh      # Restore DB
│
├── public/
│   └── uploads/                 # Upload directory
│       ├── debts/
│       │   ├── invoices/
│       │   └── payments/
│       ├── drivers/
│       │   ├── citizen_id/
│       │   └── license/
│       └── vehicles/
│           ├── registration/
│           ├── inspection/
│           └── insurance/
│
└── .gitignore                   # Git ignore rules
```

---

## 🚀 Quy trình Deploy

### Lần đầu tiên

1. **Đọc tài liệu**
   - DEPLOYMENT_GUIDE.md (đầy đủ)
   - hoặc QUICK_START_DEPLOY.md (nhanh)

2. **Chọn phương pháp**
   - Docker (khuyến nghị)
   - Thủ công (PM2)

3. **Chuẩn bị**
   - Server
   - Domain
   - Database
   - Email SMTP

4. **Cấu hình**
   - Copy .env.*.example
   - Sửa các giá trị

5. **Deploy**
   - Theo hướng dẫn trong QUICK_START_DEPLOY.md

6. **Setup backup**
   - Cấu hình scripts
   - Setup cron jobs

### Update code

#### Docker:
```bash
git pull
docker-compose up -d --build
```

#### PM2:
```bash
git pull
wasp build
cd .wasp/build
npm install --production
pm2 restart unicon-schedule
```

---

## 📋 Checklist Deploy

### Trước khi deploy
- [ ] Đã đọc DEPLOYMENT_GUIDE.md hoặc QUICK_START_DEPLOY.md
- [ ] Server đã sẵn sàng (OS, RAM, CPU, Disk)
- [ ] Domain đã trỏ về IP server
- [ ] Đã có thông tin SMTP email
- [ ] Đã tạo password mạnh cho database
- [ ] Đã generate SESSION_SECRET

### Trong quá trình deploy
- [ ] Dependencies đã được cài đặt
- [ ] Database đã được tạo và migrate
- [ ] File .env đã được cấu hình đúng
- [ ] Ứng dụng build thành công
- [ ] App đang chạy (Docker/PM2)
- [ ] Nginx đã được cấu hình
- [ ] SSL đã được cài đặt
- [ ] Firewall đã được cấu hình

### Sau khi deploy
- [ ] Test login/logout
- [ ] Test tạo/sửa/xóa dữ liệu
- [ ] Test upload file
- [ ] Test email (reset password, verification)
- [ ] Backup scripts đã được setup
- [ ] Monitoring đã được cấu hình
- [ ] Logs đang được ghi đúng
- [ ] Performance OK (load time, response time)

---

## 🆘 Khi gặp vấn đề

1. **Kiểm tra logs**
   - Docker: `docker-compose logs -f app`
   - PM2: `pm2 logs unicon-schedule`
   - Nginx: `sudo tail -f /var/log/nginx/unicon-error.log`

2. **Kiểm tra services**
   - App: `curl http://localhost:3001`
   - Database: `sudo systemctl status postgresql`
   - Nginx: `sudo systemctl status nginx`

3. **Xem Troubleshooting**
   - DEPLOYMENT_GUIDE.md (section Troubleshooting)
   - QUICK_START_DEPLOY.md (section Troubleshooting)

4. **Liên hệ support**
   - Cung cấp logs
   - Mô tả vấn đề chi tiết
   - Các bước đã thử

---

## 📞 Support

- **Documentation**: Đọc các file .md trong thư mục gốc
- **Logs**: Kiểm tra logs để debug
- **Community**: Hỏi team hoặc community
- **Issues**: Tạo issue trên GitHub (nếu có)

---

**Chúc bạn deploy thành công! 🎉**
