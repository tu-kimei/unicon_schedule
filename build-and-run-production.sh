#!/bin/bash
#
# Rebuild + redeploy unicon-schedule (Wasp 0.21+).
# Idempotent. Must run as root.
#
# Flow:
#   1. Stop systemd service, free port 3001
#   2. wasp build           -> .wasp/out/{db,server,src,...}
#   3. npm install at root  -> fills workspace devDeps (@types/*, @tsconfig/*)
#   4. bundle server        -> .wasp/out/server/bundle/server.js
#   5. vite build           -> .wasp/out/web-app/build/
#   6. rsync to nginx root  -> /var/www/schedule.unicon.ltd/
#   7. prisma migrate deploy
#   8. systemctl start + nginx reload

set -euo pipefail

PROJECT_DIR=/root/.openclaw/workspace/unicon_schedule
WEB_ROOT=/var/www/schedule.unicon.ltd
ENV_FILE="$PROJECT_DIR/.env.server"
SERVICE=unicon-schedule.service

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[0;34m%s\033[0m\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
    red "Must run as root."
    exit 1
fi

cd "$PROJECT_DIR"

blue "==> [1/8] Stop systemd + free port 3001"
systemctl stop "$SERVICE" 2>/dev/null || true
if pid=$(ss -ltnp 2>/dev/null | awk '/:3001 /{print $NF}' | grep -oP 'pid=\K[0-9]+' | head -1); then
    [[ -n "$pid" ]] && { kill "$pid" 2>/dev/null || true; sleep 2; }
fi

blue "==> [2/8] wasp build"
wasp build

blue "==> [3/8] npm install (root workspace, incl. devDeps)"
npm install --no-audit --no-fund

blue "==> [4/8] Bundle server"
( cd .wasp/out/server && npm run bundle )

blue "==> [5/8] Build frontend (vite) + pre-compress"
REACT_APP_API_URL=https://schedule.unicon.ltd npx vite build
find .wasp/out/web-app/build -type f \
    \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' -o -name '*.map' \) \
    -exec gzip -9 -k -f {} +

blue "==> [6/8] Deploy to $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rsync -a --delete --exclude uploads .wasp/out/web-app/build/ "$WEB_ROOT/"

blue "==> [7/8] Prisma migrate deploy"
set -a; source "$ENV_FILE"; set +a
npx prisma migrate deploy --schema=.wasp/out/db/schema.prisma

blue "==> [8/8] Start service + reload nginx"
systemctl start "$SERVICE"
sleep 3
systemctl is-active --quiet "$SERVICE" || { red "Service failed to start"; systemctl status "$SERVICE" --no-pager | head -20; exit 1; }
sudo nginx -t && sudo systemctl reload nginx

green "==> Done. Service active, nginx reloaded."
systemctl status "$SERVICE" --no-pager | head -5
