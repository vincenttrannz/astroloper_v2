#!/usr/bin/env bash
# =========================================================================
# Backend container entrypoint.
# Runs migrations + collectstatic, then execs whatever CMD was passed.
# Skip the pre-flight tasks by setting SKIP_ENTRYPOINT_MIGRATE=1.
# =========================================================================
set -euo pipefail

if [[ "${SKIP_ENTRYPOINT_MIGRATE:-0}" != "1" ]]; then
    echo "[entrypoint] applying migrations"
    python manage.py migrate --noinput

    echo "[entrypoint] collecting static files"
    python manage.py collectstatic --noinput --clear
fi

echo "[entrypoint] exec: $*"
exec "$@"
