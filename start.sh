#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
ENV_FILE="$ROOT/.env"
read_env(){ awk -F= -v key="$1" '$0 !~ /^[[:space:]]*#/ && $1 == key {value=substr($0,index($0,"=")+1);gsub(/^[[:space:]]+|[[:space:]]+$/,"",value);gsub(/^["\047]|["\047]$/,"",value);print value;exit}' "$ENV_FILE"; }
load_key(){ local key="$1" parsed; [ -n "${!key-}" ] && return 0; [ -f "$ENV_FILE" ] || return 0; parsed="$(read_env "$key")"; [ -z "$parsed" ] || export "$key=$parsed"; }
for key in DATABASE_URL JWT_SECRET GOVERNANCE_TENANT_ID ENABLE_GENERATED_FEATURES ALLOW_SCHEMA_MIGRATION BACKEND_PORT FRONTEND_PORT PGSSLROOTCERT; do load_key "$key"; done
BACKEND_PORT="${BACKEND_PORT:-${PORT:-8000}}"; FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export BACKEND_PORT FRONTEND_PORT
if [ ! -d node_modules ] || [ ! -d server/node_modules ]; then echo "Dependencies missing; run scripts/bootstrap.sh explicitly." >&2; exit 1; fi
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if command -v lsof >/dev/null && lsof -ti ":$port" >/dev/null 2>&1; then echo "Port $port is already in use." >&2; exit 1; fi; done
(cd server && PORT="$BACKEND_PORT" BACKEND_PORT="$BACKEND_PORT" FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT" ./node_modules/.bin/tsx src/app.ts) & BACKEND_PID=$!
PORT="$FRONTEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort & FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }; trap cleanup EXIT INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
