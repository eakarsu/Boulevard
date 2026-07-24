#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"
ENV_FILE="$ROOT/.env"
load_env_file(){ local line key value;while IFS= read -r line||[ -n "$line" ];do [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]]&&continue;line="${line#export }";key="${line%%=*}";value="${line#*=}";key="${key//[[:space:]]/}";[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]||continue;[ -n "${!key+x}" ]&&continue;if [[ "$value" == \"*\" && "$value" == *\" ]];then value="${value:1:${#value}-2}";elif [[ "$value" == \'*\' && "$value" == *\' ]];then value="${value:1:${#value}-2}";fi;export "$key=$value";done < "$ENV_FILE"; }
[ -f "$ENV_FILE" ]||{ echo "Missing required file: $ENV_FILE" >&2;exit 1; };load_env_file
BACKEND_PORT="${BACKEND_PORT:-${PORT:-8000}}"; FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export BACKEND_PORT FRONTEND_PORT
if [ ! -d node_modules ] || [ ! -d server/node_modules ]; then echo "Dependencies missing; run scripts/bootstrap.sh explicitly." >&2; exit 1; fi
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if command -v lsof >/dev/null && lsof -ti ":$port" >/dev/null 2>&1; then echo "Port $port is already in use." >&2; exit 1; fi; done
(cd server && ./node_modules/.bin/tsx src/database/runtimeSetup.ts)
(cd server && PORT="$BACKEND_PORT" BACKEND_PORT="$BACKEND_PORT" FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT" ./node_modules/.bin/tsx src/app.ts) & BACKEND_PID=$!
PORT="$FRONTEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" BACKEND_PORT="$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort & FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }; trap cleanup EXIT INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
