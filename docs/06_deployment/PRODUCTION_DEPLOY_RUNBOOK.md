# Production Deploy Runbook — Unicon Schedule

**Cập nhật:** 2026-03-29  
**Phù hợp với:** unicon_schedule trên server `racknerd-16d01f4`

---

## 1. Kiến trúc thực tế

```
Internet
  │
  ▼
Nginx (port 80/443)
  │
  ├── /api/*         → proxy → 127.0.0.1:3001 (Wasp Node server)
  ├── /auth/*        → proxy → 127.0.0.1:3001
  ├── /operations/*  → proxy → 127.0.0.1:3001
  └── /*             → static files /var/www/schedule.unicon.ltd (Vite build)

Backend (Wasp Node server):
  - process: unicon-schedule.service (systemd)
  - working dir: /root/.openclaw/workspace/unicon_schedule/.wasp/out/server
  - bundle: .wasp/out/server/bundle/server.js
  - port: 3001

Database:
  - PostgreSQL local, /var/run/postgresql (unix socket)
  - DB: unicon_schedule
  - User: unicon_user
  - encoded URL: postgresql://unicon_user:Unicon%402026@localhost:5432/unicon_schedule
```

---

## 2. Checkout và chuẩn bị

```bash
cd /root/.openclaw/workspace/unicon_schedule

# Merge/checkout branch muốn deploy
git checkout master     # hoặc branch cần deploy
git pull

# Kiểm tra không có thay đổi uncommitted
git status
```

---

## 3. Build Backend

```bash
cd /root/.openclaw/workspace/unicon_schedule

# 1. Build toàn bộ project (gen .wasp/out/)
wasp build

# 2. Install @types nếu chưa có (cần cho bundle bước sau)
npm install -D @types/multer @types/cors @types/express

# 3. Bundle server
cd .wasp/out/server
npm install --production
npm run bundle

# Verify bundle OK
ls -lh bundle/server.js   # phải có file, > 100KB
```

---

## 4. Database Migration

```bash
cd /root/.openclaw/workspace/unicon_schedule/.wasp/out/db

# Xóa migration manual cũ nếu còn (gây lỗi P3015)
rm -rf migrations/manual

# Apply migration (chỉ deploy, không tạo migration mới)
DATABASE_URL='postgresql://unicon_user:Unicon%402026@localhost:5432/unicon_schedule' \
  npx prisma migrate deploy --schema ./schema.prisma
```

> **Lưu ý:** PASSWORD trong DATABASE_URL cần encode `@` thành `%40`.  
> Password thực: `Unicon@2026` → URL: `Unicon%402026`

---

## 5. Restart Backend Service

```bash
systemctl restart unicon-schedule

# Verify đang chạy
sleep 3
systemctl is-active unicon-schedule       # → active
ss -tlnp | grep 3001                      # → LISTEN trên 3001
curl -I http://127.0.0.1:3001             # → HTTP/1.1 200 OK
```

---

## 6. Build và Deploy Frontend (UI)

```bash
cd /root/.openclaw/workspace/unicon_schedule

# TODO: Cần xác nhận lại flow này lần deploy sau
# Khả năng 1: Vite build từ .wasp/out/src với vite config nào đó
# Khả năng 2: Có script riêng trong package.json
# Cần check:
cat package.json | grep scripts -A 20
# Tìm script build/dev/preview

# Sau khi build thành công (output thường là dist/ hoặc build/)
# Copy sang web root
cp -r dist/* /var/www/schedule.unicon.ltd/
# Hoặc rsync để không xóa uploads:
rsync -av --delete --exclude='uploads/' dist/ /var/www/schedule.unicon.ltd/
```

> ⚠️ **Chưa verify đầy đủ** bước build frontend. Cần thực hiện và document lại lần deploy tiếp theo.

---

## 7. Verify sau deploy

```bash
# Backend
curl -I https://schedule.unicon.ltd/api/health 2>/dev/null | head -5
# hoặc
curl -I https://schedule.unicon.ltd/operations/getInputInvoices | head -5

# Frontend
curl -s https://schedule.unicon.ltd | grep -c "input-invoice"   # nên > 0 nếu bản mới
```

---

## 8. Rollback

```bash
# Backend: checkout lại commit cũ
cd /root/.openclaw/workspace/unicon_schedule
git checkout <commit-hash hoặc branch-cũ>
wasp build
# ... làm lại bước 3-5

# DB: migration deploy là idempotent, không cần rollback trừ migration gây breaking change
```

---

## 9. Câu hỏi cần confirm lần deploy tiếp

- [ ] Frontend build bằng lệnh gì? (`npm run build`? `wasp build web`?)
- [ ] Output directory frontend là gì? (`dist/`? `.wasp/out/web-app/dist/`?)
- [ ] Có CI/CD script nào không (Makefile, deploy.sh)?
- [ ] `migrations/manual` trong `.wasp/out/db/migrations/manual` là gì — nên tạo hay xóa?
- [ ] Upload files lưu ở `/var/www/schedule.unicon.ltd/uploads/` — cần bảo vệ khi rsync?

---

## 10. Thông tin Service

```bash
# Xem service config
cat /etc/systemd/system/unicon-schedule.service

# Xem logs realtime
journalctl -u unicon-schedule -f

# Xem env hiện tại của process
cat /proc/$(systemctl show unicon-schedule -p MainPID --value)/environ | tr '\0' '\n'
```

---

## 11. Thông tin Nginx

```
Config: /etc/nginx/sites-enabled/* hoặc /etc/nginx/conf.d/*
Domain: schedule.unicon.ltd
Web root: /var/www/schedule.unicon.ltd
SSL: /etc/letsencrypt/live/schedule.unicon.ltd/
```

```bash
# Reload nginx sau khi đổi config
nginx -t && systemctl reload nginx
```

---

_Runbook này tổng hợp từ deploy thực tế ngày 2026-03-29. Cập nhật khi có thay đổi._
