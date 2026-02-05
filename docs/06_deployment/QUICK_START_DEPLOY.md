# 🚀 Quick Start - Deploy Unicon Schedule

Hướng dẫn nhanh để deploy Unicon Schedule lên production.

## 📋 Điều kiện tiên quyết

- Server Ubuntu 20.04+ hoặc CentOS 8+
- Domain đã trỏ về IP server
- Quyền sudo trên server

## ⚡ Deploy nhanh với Docker (Khuyến nghị)

### 1. Cài đặt Docker

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra
docker --version
docker-compose --version
```

### 2. Clone và cấu hình

```bash
# Clone repository
git clone https://github.com/your-org/unicon_schedule.git
cd unicon_schedule

# Copy và sửa file .env
cp .env.docker.example .env
nano .env

# Sửa các giá trị:
# - DB_PASSWORD
# - SMTP_USERNAME, SMTP_PASSWORD
# - WASP_WEB_CLIENT_URL, WASP_SERVER_URL
# - SESSION_SECRET (generate: openssl rand -base64 32)
```

### 3. Deploy

```bash
# Build và start
docker-compose up -d

# Xem logs
docker-compose logs -f app

# Kiểm tra status
docker-compose ps
```

### 4. Cấu hình Nginx (trên host)

```bash
# Cài đặt Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Tạo config
sudo nano /etc/nginx/sites-available/unicon-schedule
```

Paste config sau:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

Enable và reload:

```bash
sudo ln -s /etc/nginx/sites-available/unicon-schedule /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Cài đặt SSL

```bash
sudo certbot --nginx -d your-domain.com
```

### 6. Xong! 🎉

Truy cập: https://your-domain.com

---

## 🔨 Deploy thủ công (không dùng Docker)

### 1. Cài đặt dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 14
sudo apt install postgresql postgresql-contrib

# Wasp
curl -sSL https://get.wasp-lang.dev/installer.sh | sh
export PATH=$HOME/.local/bin:$PATH

# PM2
sudo npm install -g pm2
```

### 2. Cấu hình Database

```bash
sudo -u postgres psql

CREATE DATABASE unicon_schedule_prod;
CREATE USER unicon_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE unicon_schedule_prod TO unicon_user;
\q
```

### 3. Clone và build

```bash
git clone https://github.com/your-org/unicon_schedule.git
cd unicon_schedule

# Tạo .env.server
cp .env.server.example .env.server
nano .env.server  # Sửa các giá trị

# Build
wasp build

# Install dependencies
cd .wasp/build
npm install --production
```

### 4. Migrate database

```bash
cd db-migrate
npm install
npm run migrate-prod
cd ..
```

### 5. Start với PM2

```bash
# Quay về thư mục gốc
cd ../..

# Start
pm2 start ecosystem.config.js

# Save
pm2 save
pm2 startup
```

### 6. Cấu hình Nginx và SSL

Làm theo bước 4 và 5 ở phần Docker ở trên.

---

## 📊 Quản lý sau khi deploy

### Docker

```bash
# Xem logs
docker-compose logs -f app

# Restart
docker-compose restart app

# Stop
docker-compose down

# Update code
git pull
docker-compose up -d --build
```

### PM2

```bash
# Xem logs
pm2 logs unicon-schedule

# Restart
pm2 restart unicon-schedule

# Status
pm2 status

# Update code
git pull
wasp build
cd .wasp/build
npm install --production
pm2 restart unicon-schedule
```

---

## 🔐 Bảo mật

### 1. Firewall

```bash
# Cho phép SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Auto updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 💾 Backup

### Setup auto backup

```bash
# Cấp quyền
chmod +x scripts/*.sh

# Edit password trong scripts
nano scripts/backup-database.sh  # Sửa DB_PASSWORD

# Test
./scripts/backup-database.sh
./scripts/backup-uploads.sh

# Setup cron
crontab -e

# Thêm:
0 2 * * * /path/to/unicon_schedule/scripts/backup-database.sh >> /var/log/unicon/backup.log 2>&1
0 3 * * * /path/to/unicon_schedule/scripts/backup-uploads.sh >> /var/log/unicon/backup.log 2>&1
```

---

## 🆘 Troubleshooting

### App không start

```bash
# Docker
docker-compose logs app

# PM2
pm2 logs unicon-schedule
```

### Database connection error

```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Test connection
psql "postgresql://unicon_user:password@localhost:5432/unicon_schedule_prod"
```

### 502 Bad Gateway

```bash
# Kiểm tra app có chạy không
curl http://localhost:3001

# Restart app
docker-compose restart app  # hoặc
pm2 restart unicon-schedule
```

---

## 📚 Tài liệu đầy đủ

Xem file [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) để có hướng dẫn chi tiết hơn.

---

## ✅ Checklist

- [ ] Server đã cài đặt dependencies
- [ ] Database đã được tạo
- [ ] File .env đã được cấu hình
- [ ] Ứng dụng đã build thành công
- [ ] App đang chạy (Docker hoặc PM2)
- [ ] Nginx đã được cấu hình
- [ ] SSL đã được cài đặt
- [ ] Firewall đã được cấu hình
- [ ] Backup đã được setup
- [ ] Test toàn bộ chức năng

---

**Chúc bạn deploy thành công! 🎉**

Nếu gặp vấn đề, xem [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) hoặc liên hệ team support.
