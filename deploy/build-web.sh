#!/bin/bash
set -euo pipefail
: "${NEXT_PUBLIC_API_URL:?HTTPS public origin required}"
case "$NEXT_PUBLIC_API_URL" in https://*) ;; *) echo 'HTTPS origin required' >&2; exit 1;; esac
export NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
npm ci --include=dev --no-fund
npm run build
python3 deploy/package_release.py web "$PWD" "$PWD/release.tgz" --commit "$(git rev-parse HEAD)"
# Start the actual packaged runtime under the same Ubuntu/Node baseline; use only non-sensitive public GETs.
stage=$(mktemp -d)
node_pid=
cleanup() { if [ -n "$node_pid" ]; then kill "$node_pid" 2>/dev/null || true; wait "$node_pid" 2>/dev/null || true; fi; rm -rf -- "$stage"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
tar -xzf release.tgz -C "$stage"
(
 cd "$stage"
 exec node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3199 > "$stage/runtime.log" 2>&1
) &
node_pid=$!
for attempt in $(seq 1 30); do
 if curl -fsS http://127.0.0.1:3199/en > /dev/null; then break; fi
 if [ "$attempt" = 30 ]; then echo 'Packaged runtime did not start' >&2; exit 1; fi
 sleep 1
done
curl -fsS http://127.0.0.1:3199/ar > /dev/null
if grep -rlF 'LL_BUILD_PRIVATE_CANARY_6e047f27' "$stage/.next/static" > /dev/null; then echo 'Private canary leaked to browser assets' >&2; exit 1; fi
echo 'Packaged Ubuntu 22.04 / Node 22 runtime smoke passed'
