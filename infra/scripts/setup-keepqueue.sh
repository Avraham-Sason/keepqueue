#!/usr/bin/env bash
# Provision a host to run keepqueue-api. This is the file that makes the VPS reproducible:
# service user, checkout, environment file and systemd unit. infra/deploy.sh assumes all of it
# already exists and only ships new code onto it.
#
# Usage:
#   sudo bash /opt/keepqueue/infra/scripts/setup-keepqueue.sh
#   sudo REPO_URL=git@github.com:Avraham-Sason/keepqueue.git bash .../setup-keepqueue.sh
#
# Safe to re-run: every step is a no-op when it is already in place, and an environment file
# that already holds secrets is never rewritten — it is only reported on.
set -euo pipefail

CHECKOUT=/opt/keepqueue
APP_DIR="$CHECKOUT/keepqueue-server"
ADMIN_USER="${ADMIN_USER:-avraham}"
SERVICE_USER="${SERVICE_USER:-keepqueue}"
UNIT=keepqueue-api
UNIT_FILE="/etc/systemd/system/$UNIT.service"
ENV_DIR=/etc/keepqueue
ENV_FILE="$ENV_DIR/$UNIT.env"
STATE_DIR=/var/lib/keepqueue
REPO_URL="${REPO_URL:-https://github.com/Avraham-Sason/keepqueue.git}"

# The names the server reads at boot: the eleven Firebase Admin service-account fields
# (keepqueue-server/src/firebase/helpers.ts) plus the three the HTTP layer reads. Values belong
# on the host and nowhere else, so only the names are ever written here.
ENV_VARS=(
    type
    project_id
    private_key_id
    private_key
    client_email
    client_id
    auth_uri
    token_uri
    auth_provider_x509_cert_url
    client_x509_cert_url
    universe_domain
    PORT
    allowed_origins
    vercel_preview_scope
)

log() { echo "[setup] $*"; }
die() { echo "[setup] FAILED: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
id "$ADMIN_USER" >/dev/null 2>&1 || die "admin user '$ADMIN_USER' does not exist (override with ADMIN_USER=...)"

# The service account owns nothing and logs in nowhere: it exists only so the API is not root.
if id "$SERVICE_USER" >/dev/null 2>&1; then
    log "service user $SERVICE_USER already exists"
else
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    log "created service user $SERVICE_USER"
fi

NODE_BIN="$(command -v node || true)"
[ -n "$NODE_BIN" ] || die "node is not on root's PATH; install it system-wide (a per-user nvm install is not reachable from a systemd unit)"
runuser -u "$SERVICE_USER" -- "$NODE_BIN" --version >/dev/null 2>&1 \
    || die "$SERVICE_USER cannot execute $NODE_BIN; install node somewhere readable by all users"
log "node: $NODE_BIN ($($NODE_BIN --version))"

# The checkout belongs to the admin account — deploy.sh fetches and builds as that user, and the
# service only ever reads the result.
install -d -o "$ADMIN_USER" -g "$ADMIN_USER" -m 0755 "$CHECKOUT"
if [ -d "$CHECKOUT/.git" ]; then
    log "checkout present at $CHECKOUT"
else
    log "cloning $REPO_URL into $CHECKOUT"
    runuser -u "$ADMIN_USER" -- git clone --quiet "$REPO_URL" "$CHECKOUT" \
        || die "clone failed; clone it by hand as $ADMIN_USER into $CHECKOUT and re-run"
fi

# deploy.sh records the outgoing revision here so --rollback has a target.
install -d -m 0755 "$STATE_DIR"

install -d -o root -g "$SERVICE_USER" -m 0750 "$ENV_DIR"
if [ -f "$ENV_FILE" ]; then
    missing=""
    for name in "${ENV_VARS[@]}"; do
        grep -q "^${name}=" "$ENV_FILE" || missing="$missing $name"
    done
    if [ -n "$missing" ]; then
        log "WARNING: $ENV_FILE is missing:$missing"
    else
        log "$ENV_FILE holds all ${#ENV_VARS[@]} variables; left untouched"
    fi
else
    {
        echo "# keepqueue-api environment. Filled in on the host only — never committed."
        echo "# systemd reads this file verbatim: one NAME=value per line, no 'export', no shell"
        echo "# expansion. private_key stays on a single line with literal \\n between its lines,"
        echo "# which is the form src/firebase/helpers.ts unescapes."
        echo "# PORT must match the port infra/deploy.sh polls for health (9000)."
        for name in "${ENV_VARS[@]}"; do
            echo "$name="
        done
    } > "$ENV_FILE"
    log "wrote template $ENV_FILE — fill it in before starting the service"
fi
# Read by systemd as root before it drops privileges; the group read is only so the service
# account can be used to debug the app by hand.
chown root:"$SERVICE_USER" "$ENV_FILE"
chmod 0640 "$ENV_FILE"

# ProtectHome makes /home unreadable to the service, which breaks a node installed under a user's
# home directory. Relax it only in that case rather than shipping a weaker unit everywhere.
case "$NODE_BIN" in
    /home/*) PROTECT_HOME=read-only ;;
    *) PROTECT_HOME=yes ;;
esac

cat > "$UNIT_FILE" <<UNIT_EOF
[Unit]
Description=Keepqueue API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$NODE_BIN dist/app.js
Restart=on-failure
RestartSec=3
KillSignal=SIGTERM
# The app drains in-flight requests on SIGTERM and force-exits after 15s; leave room for that
# before systemd escalates to SIGKILL.
TimeoutStopSec=25
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$UNIT
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=$PROTECT_HOME
# The process writes nothing to disk: logs go to the journal, and the deploy script writes
# $STATE_DIR as root.

[Install]
WantedBy=multi-user.target
UNIT_EOF
log "wrote $UNIT_FILE"

systemctl daemon-reload
systemctl enable "$UNIT" >/dev/null
log "enabled $UNIT (not started — deploy.sh starts it once there is a build)"

runuser -u "$ADMIN_USER" -- bash -lc 'command -v pnpm >/dev/null' \
    || log "WARNING: pnpm is not on $ADMIN_USER's PATH; deploy.sh needs it (npm i -g pnpm)"

log "done. Next:"
log "  1. fill $ENV_FILE"
log "  2. sudo bash $CHECKOUT/infra/deploy.sh"
