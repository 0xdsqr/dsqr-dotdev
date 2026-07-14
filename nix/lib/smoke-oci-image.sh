#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 2 ]]; then
  echo "usage: smoke-oci-image.sh <image> <port>" >&2
  exit 2
fi

image="$1"
port="$2"
container=""

# Invoked indirectly by the EXIT trap below.
# shellcheck disable=SC2329
cleanup() {
  if [[ -n "$container" ]]; then
    docker rm --force "$container" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

container="$(
  docker run \
    --detach \
    --read-only \
    --user 65534:65534 \
    --cap-drop ALL \
    --security-opt no-new-privileges=true \
    --tmpfs /tmp:rw,noexec,nosuid,nodev,size=67108864,mode=1777 \
    --publish "127.0.0.1:$port:$port" \
    --env AUTH_SECRET=runtime-smoke-only-not-a-production-secret \
    --env DATABASE_URL=postgresql://smoke:smoke@127.0.0.1:9/smoke \
    --env BASE_URL="http://127.0.0.1:$port" \
    --env TRUSTED_ORIGINS="http://127.0.0.1:$port" \
    --env OTEL_SDK_DISABLED=true \
    "$image"
)"

for _ in {1..30}; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    exit 0
  fi

  if [[ "$(docker inspect --format '{{.State.Running}}' "$container")" != "true" ]]; then
    docker logs "$container" >&2
    echo "$image exited before opening port $port" >&2
    exit 1
  fi

  sleep 1
done

docker logs "$container" >&2
echo "$image did not open port $port" >&2
exit 1
