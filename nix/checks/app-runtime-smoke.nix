{
  app,
  appName,
  curl,
  path,
  port,
  runCommand,
}:
runCommand "dsqr-dotdev-runtime-smoke-${appName}" { } ''
  log="$TMPDIR/${appName}.log"
  home="$TMPDIR/${appName}-home"
  mkdir -p "$home"

  HOME="$home" \
    TMPDIR="$TMPDIR" \
    HOST=127.0.0.1 \
    NITRO_HOST=127.0.0.1 \
    PORT=${toString port} \
    BASE_URL="http://127.0.0.1:${toString port}" \
    TRUSTED_ORIGINS="http://127.0.0.1:${toString port}" \
    AUTH_SECRET=runtime-smoke-only-not-a-production-secret \
    DATABASE_URL=postgresql://smoke:smoke@127.0.0.1:9/smoke \
    OTEL_SDK_DISABLED=true \
    "${app}/bin/${appName}" >"$log" 2>&1 &
  pid="$!"

  cleanup() {
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  }
  trap cleanup EXIT

  for _ in $(seq 1 30); do
    if ${curl}/bin/curl \
      --fail \
      --max-time 5 \
      --output /dev/null \
      --silent \
      --show-error \
      "http://127.0.0.1:${toString port}${path}"; then
      mkdir -p "$out"
      touch "$out/runtime-smoke-${appName}"
      exit 0
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
      cat "$log" >&2
      echo "${appName} exited before opening port ${toString port}" >&2
      exit 1
    fi

    sleep 1
  done

  cat "$log" >&2
  echo "${appName} did not serve a successful response from ${path}" >&2
  exit 1
''
