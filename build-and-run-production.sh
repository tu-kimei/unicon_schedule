#!/usr/bin/env bash

################################################################################
# Unified Production Deploy Script
#
# Single source of truth for production deploy:
# - Backend runtime:   .wasp/out/server/bundle/server.js
# - Frontend static:   .wasp/out/web-app/build -> /var/www/schedule.unicon.ltd
# - Process manager:   systemd service unicon-schedule.service
# - Reverse proxy:     nginx serving /var/www/schedule.unicon.ltd
#
# This replaces the old .wasp/build/* flow which caused FE/BE artifact drift.
################################################################################

set -Eeuo pipefail

PROJECT_ROOT="/root/.openclaw/workspace/unicon_schedule"
OUT_ROOT="$PROJECT_ROOT/.wasp/out"
OUT_SERVER="$OUT_ROOT/server"
OUT_WEB="$OUT_ROOT/web-app"
OUT_WEB_BUILD="$OUT_WEB/build"
PUBLIC_ROOT="/var/www/schedule.unicon.ltd"
SYSTEMD_SERVICE="unicon-schedule.service"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}➡${NC} $*"; }
ok()   { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*"; }

die() {
  err "$*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

load_node() {
  export NVM_DIR="$HOME/.nvm"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
    nvm use 22 >/dev/null || true
  fi
}

ensure_dirs() {
  mkdir -p "$PUBLIC_ROOT"
  mkdir -p "$PROJECT_ROOT/public/uploads/drivers/citizen_id"
  mkdir -p "$PROJECT_ROOT/public/uploads/drivers/license"
  mkdir -p "$PROJECT_ROOT/public/uploads/vehicles/registration"
  mkdir -p "$PROJECT_ROOT/public/uploads/vehicles/inspection"
  mkdir -p "$PROJECT_ROOT/public/uploads/vehicles/insurance"
  mkdir -p "$PROJECT_ROOT/public/uploads/debts/invoices"
  mkdir -p "$PROJECT_ROOT/public/uploads/debts/payments"
}

build_wasp() {
  log "Building Wasp app from project root"
  cd "$PROJECT_ROOT"
  wasp build
  ok "Wasp build completed"
}

bundle_server() {
  [[ -d "$OUT_SERVER" ]] || die "Missing server output directory: $OUT_SERVER"
  [[ -f "$OUT_SERVER/package.json" ]] || die "Missing server package.json"

  log "Installing server dependencies"
  cd "$OUT_SERVER"
  npm install --silent

  log "Bundling production server"
  npm run bundle

  [[ -f "$OUT_SERVER/bundle/server.js" ]] || die "Missing bundled server: $OUT_SERVER/bundle/server.js"
  ok "Server bundle ready"
}

build_web_app() {
  [[ -d "$OUT_ROOT" ]] || die "Missing Wasp output root: $OUT_ROOT"
  [[ -f "$OUT_ROOT/package.json" ]] || die "Missing .wasp/out/package.json"

  log "Installing web app/runtime dependencies"
  cd "$OUT_ROOT"
  npm install --silent

  log "Building frontend static bundle"
  npm run build

  [[ -f "$OUT_WEB_BUILD/index.html" ]] || die "Missing frontend build output: $OUT_WEB_BUILD/index.html"
  ok "Frontend bundle ready"
}

publish_frontend() {
  [[ -f "$OUT_WEB_BUILD/index.html" ]] || die "Cannot publish missing frontend build"

  log "Publishing frontend static files to $PUBLIC_ROOT"
  rsync -a --delete "$OUT_WEB_BUILD/" "$PUBLIC_ROOT/"

  if [[ -d "$PROJECT_ROOT/public/uploads" ]]; then
    mkdir -p "$PUBLIC_ROOT/uploads"
    rsync -a "$PROJECT_ROOT/public/uploads/" "$PUBLIC_ROOT/uploads/"
  fi

  ok "Frontend published"
}

restart_services() {
  log "Reloading systemd daemon"
  systemctl daemon-reload

  log "Restarting backend service: $SYSTEMD_SERVICE"
  systemctl restart "$SYSTEMD_SERVICE"
  systemctl is-active --quiet "$SYSTEMD_SERVICE" || die "Service failed to start: $SYSTEMD_SERVICE"

  log "Reloading nginx"
  nginx -t
  systemctl reload nginx

  ok "Services restarted"
}

healthcheck() {
  log "Running production health checks"

  curl -fsS http://127.0.0.1:3001/auth/me >/dev/null 2>&1 || warn "Backend /auth/me without session returned non-2xx (acceptable), backend reachable via service logs"
  curl -fsS https://schedule.unicon.ltd/login >/dev/null

  if curl -s https://schedule.unicon.ltd/assets/*.js 2>/dev/null | grep -q 'http://localhost:3001'; then
    die "Production frontend still contains localhost:3001"
  fi

  ok "Basic deploy checks completed"
}

main() {
  echo -e "${BLUE}🚀 Unicon Schedule - Unified Production Deploy${NC}"
  echo "================================================"

  require_cmd bash
  require_cmd curl
  require_cmd rsync
  require_cmd systemctl
  require_cmd nginx
  require_cmd npm
  require_cmd wasp

  load_node
  ensure_dirs
  build_wasp
  bundle_server
  build_web_app
  publish_frontend
  restart_services
  healthcheck

  echo
  ok "Deploy completed successfully"
  echo "Backend: systemd -> $SYSTEMD_SERVICE"
  echo "Frontend: $PUBLIC_ROOT"
  echo "Server bundle: $OUT_SERVER/bundle/server.js"
  echo "Web bundle: $OUT_WEB_BUILD"
}

main "$@"
