#!/usr/bin/env bash
# Deploy keepqueue-api on the host it runs on.
#
# Usage:
#   sudo bash /opt/keepqueue/infra/deploy.sh              # deploy origin/main
#   sudo bash /opt/keepqueue/infra/deploy.sh <git-rev>    # deploy a specific revision
#   sudo bash /opt/keepqueue/infra/deploy.sh --rollback   # deploy the revision this replaced
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
PREVIOUS_REV_FILE=/var/lib/keepqueue/previous-rev
TARGET="${1:-origin/main}"

log() { echo "[deploy] $*"; }
die() { echo "[deploy] FAILED: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
[ -d "$APP_DIR" ] || die "$APP_DIR missing — run infra/scripts/setup-keepqueue.sh first"

# Resolved here rather than in the caller's command line: a $(cat ...) inside `ssh "..."` is
# expanded by the operator's own shell, which has no such file, so the target silently became
# origin/main and the "rollback" redeployed the newest code.
if [ "$TARGET" = "--rollback" ]; then
    [ -s "$PREVIOUS_REV_FILE" ] || die "$PREVIOUS_REV_FILE is empty or missing — nothing to roll back to"
    TARGET="$(cat "$PREVIOUS_REV_FILE")"
    log "rolling back to $TARGET"
fi

PREVIOUS_REV="$(runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" rev-parse --short HEAD)"
log "current revision $PREVIOUS_REV"

log "fetching $TARGET"
runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" fetch --quiet origin

# This checkout is a deploy artefact, not somebody's working copy, so it is reset to the target
# rather than merged into it. A plain `checkout` refuses whenever a tracked file has drifted,
# and one had: .gitattributes normalised line endings after bugs.md was already on disk with
# CRLF, so git reported it modified for ever and every deploy died on a whitespace difference
# in a documentation file. Reset also guarantees the built revision is exactly the named one.
runuser -u "$ADMIN_USER" -- git -C "$CHECKOUT" reset --hard --quiet "$TARGET" \
    || die "reset to $TARGET failed; nothing was changed"
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
install -d -m 0755 "$(dirname "$PREVIOUS_REV_FILE")"
printf '%s' "$PREVIOUS_REV" > "$PREVIOUS_REV_FILE"
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
