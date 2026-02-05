# 🚀 Hướng dẫn Deploy Unicon Schedule lên Production

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
3. [Cấu hình Database](#cấu-hình-database)
4. [Cấu hình Email](#cấu-hình-email)
5. [Build ứng dụng](#build-ứng-dụng)
6. [Deploy với Docker](#deploy-với-docker)
7. [Deploy thủ công](#deploy-thủ-công)
8. [Cấu hình Nginx](#cấu-hình-nginx)
9. [SSL/HTTPS](#sslhttps)
10. [Monitoring & Logging](#monitoring--logging)
11. [Backup & Recovery](#backup--recovery)
12. [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu cầu hệ thống

### Server Requirements

- **OS**: Ubuntu 20.04 LTS hoặc mới hơn (hoặc CentOS 8+)
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB+)
- **CPU**: 2 cores trở lên
- **Disk**: 20GB+ (SSD khuyến nghị)
- **Node.js**: v18.x hoặc v20.x
- **PostgreSQL**: v14 hoặc mới hơn

### Domain & DNS

- Domain name đã trỏ về IP server
- SSL certificate (Let's Encrypt miễn phí)

---

## 🔧 Chuẩn bị môi trường

### 1. Cài đặt Node.js

```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra version
node --version
npm --version
```

### 2. Cài đặt PostgreSQL

```bash
# Cài đặt PostgreSQL 14
sudo apt update
sudo apt install postgresql postgresql-contrib

# Khởi động PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Kiểm tra trạng thái
sudo systemctl status postgresql
```

### 3. Cài đặt Wasp

```bash
# Cài đặt Wasp CLI
curl -sSL https://get.wasp-lang.dev/installer.sh | sh

# Thêm Wasp vào PATH (thêm vào ~/.bashrc hoặc ~/.zshrc)
export PATH=$HOME/.local/bin:$PATH

# Kiểm tra version
wasp version
```

### 4. Cài đặt PM2 (Process Manager)

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Cấu hình PM2 tự khởi động
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

---

## 🗄️ Cấu hình Database

### 1. Tạo Database và User

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE unicon_schedule_prod;

# Tạo user
CREATE USER unicon_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

# Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE unicon_schedule_prod TO unicon_user;

# Thoát
\q
```

### 2. Cấu hình PostgreSQL cho remote access (nếu cần)

```bash
# Sửa file postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Tìm và sửa dòng:
listen_addresses = 'localhost'  # Hoặc '*' nếu cho phép remote

# Sửa file pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Thêm dòng (nếu cần remote access):
host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Tạo connection string

```bash
# Format:
postgresql://unicon_user:your_secure_password_here@localhost:5432/unicon_schedule_prod

# Ví dụ:
postgresql://unicon_user:MySecurePass123!@localhost:5432/unicon_schedule_prod
```

---

## 📧 Cấu hình Email

### Option 1: Gmail SMTP

```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Tạo App Password từ Google Account
```

**Lưu ý**: Cần bật 2FA và tạo App Password tại: https://myaccount.google.com/apppasswords

### Option 2: SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Option 3: AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

---

## 🏗️ Build ứng dụng

### 1. Clone source code

```bash
# Clone repository
git clone https://github.com/your-org/unicon_schedule.git
cd unicon_schedule

# Checkout production branch
git checkout main  # hoặc production
```

### 2. Tạo file .env.server

```bash
# Tạo file .env.server trong thư mục gốc
nano .env.server
```

Nội dung file `.env.server`:

```bash
# Database
DATABASE_URL=postgresql://unicon_user:your_secure_password_here@localhost:5432/unicon_schedule_prod

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=true

# Wasp Server URL (production domain)
WASP_WEB_CLIENT_URL=https://your-domain.com
WASP_SERVER_URL=https://your-domain.com

# Session Secret (generate a random string)
SESSION_SECRET=your-very-long-random-secret-key-here-min-32-chars

# Node Environment
NODE_ENV=production

# Port (optional, default 3001)
PORT=3001
```

### 3. Build ứng dụng

```bash
# Install dependencies
npm install

# Build với Wasp
wasp build

# Kết quả build sẽ nằm trong folder .wasp/build
```

---

## 🐳 Deploy với Docker

### 1. Tạo Dockerfile

Tạo file `Dockerfile` trong thư mục gốc:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy source
COPY . .

# Install Wasp
RUN curl -sSL https://get.wasp-lang.dev/installer.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Build
RUN wasp build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/.wasp/build ./build

# Install production dependencies
WORKDIR /app/build
RUN npm ci --only=production

# Create uploads directory
RUN mkdir -p /app/build/public/uploads/debts/invoices \
    /app/build/public/uploads/debts/payments \
    /app/build/public/uploads/drivers/citizen_id \
    /app/build/public/uploads/drivers/license \
    /app/build/public/uploads/vehicles/registration \
    /app/build/public/uploads/vehicles/inspection \
    /app/build/public/uploads/vehicles/insurance

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

### 2. Tạo docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: unicon_postgres
    restart: always
    environment:
      POSTGRES_DB: unicon_schedule_prod
      POSTGRES_USER: unicon_user
      POSTGRES_PASSWORD: your_secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - unicon_network

  app:
    build: .
    container_name: unicon_app
    restart: always
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://unicon_user:your_secure_password_here@postgres:5432/unicon_schedule_prod
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USERNAME: your-email@gmail.com
      SMTP_PASSWORD: your-app-password
      SMTP_TLS: true
      WASP_WEB_CLIENT_URL: https://your-domain.com
      WASP_SERVER_URL: https://your-domain.com
      SESSION_SECRET: your-very-long-random-secret-key-here
      NODE_ENV: production
      PORT: 3001
    volumes:
      - ./uploads:/app/build/public/uploads
    ports:
      - "3001:3001"
    networks:
      - unicon_network

volumes:
  postgres_data:

networks:
  unicon_network:
    driver: bridge
```

### 3. Deploy với Docker Compose

```bash
# Build và start containers
docker-compose up -d

# Xem logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Rebuild và restart
docker-compose up -d --build
```

---

## 🔨 Deploy thủ công (không dùng Docker)

### 1. Build và migrate database

```bash
cd unicon_schedule

# Build
wasp build

# Di chuyển vào thư mục build
cd .wasp/build

# Install dependencies
npm install --production

# Run database migrations
cd db-migrate
npm install
npm run migrate-prod
cd ..
```

### 2. Tạo thư mục uploads

```bash
# Tạo cấu trúc thư mục uploads
mkdir -p public/uploads/debts/invoices
mkdir -p public/uploads/debts/payments
mkdir -p public/uploads/drivers/citizen_id
mkdir -p public/uploads/drivers/license
mkdir -p public/uploads/vehicles/registration
mkdir -p public/uploads/vehicles/inspection
mkdir -p public/uploads/vehicles/insurance

# Set permissions
chmod -R 755 public/uploads
```

### 3. Chạy với PM2

Tạo file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'unicon-schedule',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/unicon_schedule/.wasp/build',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '/path/to/unicon_schedule/.env.server',
      error_file: '/var/log/unicon/error.log',
      out_file: '/var/log/unicon/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

Chạy ứng dụng:

```bash
# Tạo thư mục logs
sudo mkdir -p /var/log/unicon
sudo chown $USER:$USER /var/log/unicon

# Start với PM2
pm2 start ecosystem.config.js

# Lưu PM2 config
pm2 save

# Xem logs
pm2 logs unicon-schedule

# Xem status
pm2 status

# Restart
pm2 restart unicon-schedule

# Stop
pm2 stop unicon-schedule
```

---

## 🌐 Cấu hình Nginx

### 1. Cài đặt Nginx

```bash
sudo apt update
sudo apt install nginx

# Start và enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Tạo Nginx config

```bash
sudo nano /etc/nginx/sites-available/unicon-schedule
```

Nội dung file:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (sẽ được tạo bởi Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/unicon-access.log;
    error_log /var/log/nginx/unicon-error.log;

    # Max upload size
    client_max_body_size 10M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads folder
    location /uploads/ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 3. Enable site

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/unicon-schedule /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS

### Cài đặt Let's Encrypt SSL

```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Certbot sẽ tự động renew, kiểm tra timer
sudo systemctl status certbot.timer
```

---

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Xem real-time monitoring
pm2 monit

# Xem logs
pm2 logs unicon-schedule --lines 100

# Flush logs
pm2 flush

# Install PM2 web dashboard (optional)
pm2 install pm2-logrotate
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/unicon-access.log

# Error logs
sudo tail -f /var/log/nginx/unicon-error.log

# Rotate logs
sudo logrotate -f /etc/logrotate.d/nginx
```

### 3. PostgreSQL Logs

```bash
# Xem logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 4. Setup Log Rotation

Tạo file `/etc/logrotate.d/unicon`:

```bash
/var/log/unicon/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 💾 Backup & Recovery

### 1. Database Backup

Tạo script backup `/usr/local/bin/backup-unicon-db.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="unicon_schedule_prod"
DB_USER="unicon_user"
BACKUP_DIR="/var/backups/unicon/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/unicon_db_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="your_secure_password_here" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "unicon_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Cấp quyền và tạo cron job:

```bash
# Cấp quyền execute
sudo chmod +x /usr/local/bin/backup-unicon-db.sh

# Tạo cron job (chạy hàng ngày lúc 2:00 AM)
sudo crontab -e

# Thêm dòng:
0 2 * * * /usr/local/bin/backup-unicon-db.sh >> /var/log/unicon/backup.log 2>&1
```

### 2. Uploads Backup

```bash
#!/bin/bash

# Configuration
UPLOADS_DIR="/path/to/unicon_schedule/.wasp/build/public/uploads"
BACKUP_DIR="/var/backups/unicon/uploads"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_FILE -C $UPLOADS_DIR .

# Keep only last 30 days
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "Uploads backup completed: $BACKUP_FILE"
```

### 3. Database Restore

```bash
# Restore từ backup
gunzip < /var/backups/unicon/database/unicon_db_20260205_020000.sql.gz | \
PGPASSWORD="your_secure_password_here" psql -U unicon_user -h localhost unicon_schedule_prod
```

---

## 🔥 Troubleshooting

### 1. Application không start

```bash
# Kiểm tra logs
pm2 logs unicon-schedule --lines 50

# Kiểm tra port đã được sử dụng chưa
sudo lsof -i :3001

# Kiểm tra database connection
psql -U unicon_user -h localhost -d unicon_schedule_prod
```

### 2. Database connection error

```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra connection string trong .env.server
cat .env.server | grep DATABASE_URL

# Test connection
psql "postgresql://unicon_user:password@localhost:5432/unicon_schedule_prod"
```

### 3. Email không gửi được

```bash
# Kiểm tra SMTP settings
cat .env.server | grep SMTP

# Test SMTP connection (dùng telnet)
telnet smtp.gmail.com 587

# Kiểm tra logs
pm2 logs unicon-schedule | grep -i email
```

### 4. Upload file lỗi

```bash
# Kiểm tra permissions
ls -la public/uploads/

# Set lại permissions
chmod -R 755 public/uploads/
chown -R $USER:$USER public/uploads/

# Kiểm tra disk space
df -h
```

### 5. Nginx 502 Bad Gateway

```bash
# Kiểm tra app có chạy không
pm2 status

# Kiểm tra port
sudo lsof -i :3001

# Restart app
pm2 restart unicon-schedule

# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/unicon-error.log
```

---

## 🚀 Quick Deploy Checklist

- [ ] Server đã cài đặt Node.js, PostgreSQL, Nginx
- [ ] Database đã được tạo và migrate
- [ ] File `.env.server` đã được cấu hình đúng
- [ ] SMTP email đã được cấu hình
- [ ] Domain đã trỏ về IP server
- [ ] SSL certificate đã được cài đặt
- [ ] Ứng dụng đã được build thành công
- [ ] PM2 đã start ứng dụng
- [ ] Nginx đã được cấu hình và reload
- [ ] Backup script đã được setup
- [ ] Monitoring đã được cấu hình
- [ ] Test toàn bộ chức năng trên production

---

## 📞 Support

Nếu gặp vấn đề trong quá trình deploy, vui lòng:

1. Kiểm tra logs: `pm2 logs unicon-schedule`
2. Kiểm tra Nginx logs: `sudo tail -f /var/log/nginx/unicon-error.log`
3. Kiểm tra database: `sudo -u postgres psql unicon_schedule_prod`
4. Liên hệ team support

---

**Chúc bạn deploy thành công! 🎉**
