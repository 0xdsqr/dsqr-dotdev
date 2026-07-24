{
  curl,
  dotdev,
  labs,
  runCommand,
  studio,
}:
runCommand "dsqr-dotdev-runtime-smoke-check" { } ''
  smokeApp() {
    app="$1"
    name="$2"
    port="$3"
    path="$4"
    log="$TMPDIR/$name.log"
    home="$TMPDIR/$name-home"
    mkdir -p "$home"

    HOME="$home" \
      TMPDIR="$TMPDIR" \
      HOST=127.0.0.1 \
      NITRO_HOST=127.0.0.1 \
      PORT="$port" \
      BASE_URL="http://127.0.0.1:$port" \
      TRUSTED_ORIGINS="http://127.0.0.1:$port" \
      AUTH_SECRET=runtime-smoke-only-not-a-production-secret \
      DATABASE_URL=postgresql://smoke:smoke@127.0.0.1:9/smoke \
      OTEL_SDK_DISABLED=true \
      "$app/bin/$name" >"$log" 2>&1 &
    pid="$!"

    for _ in $(seq 1 30); do
      if ${curl}/bin/curl \
        --fail \
        --max-time 5 \
        --output /dev/null \
        --silent \
        --show-error \
        "http://127.0.0.1:$port$path"; then
        kill "$pid"
        wait "$pid" || true
        return 0
      fi

      if ! kill -0 "$pid" 2>/dev/null; then
        cat "$log" >&2
        wait "$pid" || true
        echo "$name exited before opening port $port" >&2
        return 1
      fi

      sleep 1
    done

    cat "$log" >&2
    kill "$pid" 2>/dev/null || true
    wait "$pid" || true
    echo "$name did not serve a successful response from $path on port $port" >&2
    return 1
  }

  smokeApp ${dotdev} dotdev 3020 /about
  smokeApp ${studio} studio 3021 /
  smokeApp ${labs} labs 3022 /

  mkdir -p "$out"
  touch "$out/runtime-smoke-check"
''
