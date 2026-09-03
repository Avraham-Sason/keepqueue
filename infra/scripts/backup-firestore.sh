#!/usr/bin/env bash
# Export the whole Firestore database to a Cloud Storage bucket.
#
# Usage:
#   infra/scripts/backup-firestore.sh                 # export to the default bucket
#   BUCKET=gs://my-bucket infra/scripts/backup-firestore.sh
#
# Why this exists: nothing in this repo could recover from a bad write or a bad rules deploy.
# firebase.json configures rules and indexes only, and no point-in-time recovery was ever
# enabled, so a mistake was permanent.
#
# This is the cheap half — a scheduled full export, restorable with `gcloud firestore import`.
# The other half is Firestore's built-in point-in-time recovery, which is a one-off toggle and
# is what actually saves you from "the bad write was four hours ago":
#
#   gcloud firestore databases update --database='(default)' --enable-pitr --project keepqueue
#
# Run this from cron on any machine with gcloud and a service account that holds
# roles/datastore.importExportAdmin, e.g. daily:
#
#   17 3 * * *  /opt/keepqueue/infra/scripts/backup-firestore.sh >> /var/log/keepqueue-backup.log 2>&1
set -euo pipefail

PROJECT="${PROJECT:-keepqueue}"
BUCKET="${BUCKET:-gs://${PROJECT}-firestore-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
DESTINATION="${BUCKET}/${STAMP}"

log() { echo "[backup] $*"; }
die() { echo "[backup] FAILED: $*" >&2; exit 1; }

command -v gcloud >/dev/null 2>&1 || die "gcloud is not installed"

# Creating the bucket here rather than assuming it: a backup script whose first run fails
# because the destination is missing is a backup script nobody has ever tested.
if ! gsutil ls -b "$BUCKET" >/dev/null 2>&1; then
    log "creating $BUCKET"
    gsutil mb -p "$PROJECT" "$BUCKET" || die "could not create $BUCKET"
    # Deleting old exports is the bucket's job, not this script's — a lifecycle rule keeps
    # working even when nobody has run the script for a month.
    printf '{"rule":[{"action":{"type":"Delete"},"condition":{"age":%s}}]}' "$RETENTION_DAYS" > /tmp/kq-lifecycle.json
    gsutil lifecycle set /tmp/kq-lifecycle.json "$BUCKET"
    rm -f /tmp/kq-lifecycle.json
    log "retention set to ${RETENTION_DAYS} days"
fi

log "exporting $PROJECT to $DESTINATION"
gcloud firestore export "$DESTINATION" --project "$PROJECT" || die "export failed"

log "done. restore with:"
log "  gcloud firestore import $DESTINATION --project $PROJECT"
