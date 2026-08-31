#!/usr/bin/env bash
# Deploy keepqueue-api on the host it runs on.
#
# Usage:
#   sudo bash /opt/keepqueue/infra/deploy.sh              # deploy origin/main
#   sudo bash /opt/keepqueue/infra/deploy.sh <git-rev>    # deploy a specific revision
#
# Reached three ways, all running this same file so they cannot drift:
#   - `npm run deploy:server` from a workstation, over SSH
#   - the VPS dashboard's Deploy button, through vps-ops@deploy-keepqueue.service
#   - by hand over SSH
#
# The checkout belongs to the admin account and the service account only reads it, so the
# fetch and the build drop privileges and only the restart stays root.
set -euo pipefail

CHECKOUT=/opt/keepqueue
APP_DIR="$CHECKOUT/keepqueue-server"
ADMIN_USER="${ADMIN_USER:-avraham}"
UNIT=keepqueue-api
HEALTH_URL=http://127.0.0.1:9000/
TARGET="${1:-origin/main}"

log() { echo "[deploy] $*"; }
die() { echo "[deploy] FAILED: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
[ -d "$APP_DIR" ] || die "$APP_DIR missing — run infra/scripts/setup-keepqueue.sh first"

PREVIOUS_REV="$(runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" rev-parse --short HEAD)"
log "current revision $PREVIOUS_REV"

log "fetching $TARGET"
runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" fetch --quiet origin
runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" checkout --quiet "$TARGET" \
    || die "checkout of $TARGET failed; nothing was changed"
NEW_REV="$(runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" rev-parse --short HEAD)"
log "deploying $NEW_REV"

# --frozen-lockfile rather than a plain install: a deploy that silently resolves different
# versions than the ones committed is not the revision it claims to be.
log "installing dependencies"
runuser -u "$ADMIN_USER" -- bash -lc "cd '$APP_DIR' && pnpm install --frozen-lockfile" \
    || die "dependency install failed; the service is untouched and still on $PREVIOUS_REV"

log "building"
runuser -u "$ADMIN_USER" -- bash -lc "cd '$APP_DIR' && pnpm run build" \
    || die "build failed; the service is untouched and still on $PREVIOUS_REV"

# Only past this point is anything user-visible at risk: the build output is already on disk
# and valid, so the restart is the one irreversible step.
log "restarting $UNIT"
# Recorded before the restart, so a deploy that dies mid-restart still leaves a target to roll
# back to. Matches /var/lib/vps/previous-rev on the VPS side.
install -d -m 0755 /var/lib/keepqueue
printf '%s' "$PREVIOUS_REV" > /var/lib/keepqueue/previous-rev
systemctl restart "$UNIT"

log "waiting for health"
for attempt in $(seq 1 20); do
    if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
        log "healthy on attempt $attempt"
        log "deployed $PREVIOUS_REV -> $NEW_REV"
        exit 0
    fi
    sleep 1
done

systemctl is-active --quiet "$UNIT" || log "unit is not running — journalctl -u $UNIT -n 50"
die "no health response after 20s. Roll back with: sudo bash $0 $PREVIOUS_REV"
